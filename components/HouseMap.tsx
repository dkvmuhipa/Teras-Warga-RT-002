import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { House, PaymentStatus, Report, Official, Checkpoint, MapPoint, PatrolSession, PanicAlert, STBMRecord, BMKGQuakeData } from '../types';
import { Home, Map as MapIcon, MapPin, Store, X, AlertTriangle, User, Edit, DollarSign, ShieldAlert, ChevronRight, Info, CheckCircle, ShieldCheck, Star, Baby, Heart, Accessibility, Smile, Users, GraduationCap, Key, Briefcase as BriefcaseIcon, Phone, MessageCircle, Droplets, Trash2, Settings2, Save, Move, Shield, Lightbulb, Video, Trash, Navigation, Bell, Search, MousePointer2, VideoOff, Activity, Clock, Filter, Flame, CreditCard, Compass, Thermometer, UserPlus, Printer, Download, ArrowRight, AlertCircle, CheckCircle2, Radio, HeartPulse, LifeBuoy, Copy, QrCode, Share2, Sparkles, Check, Building } from 'lucide-react';
import { domToPng } from 'modern-screenshot';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { subscribeToCheckpoints, updateCheckpointPosition, updateMapPointInDb, formatHouseId, isHouseTrulyOccupied, subscribeToSTBMRecords, saveSTBMRecord } from '../services/databaseService';
import { useFinancial } from '../context/FinancialContext';
import { fetchLatestBMKGQuake, isPaluRegionQuake } from '../services/bmkgService';
import { QRISPaymentModal } from './finance/QRISPaymentModal';

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
    stbmRecords?: STBMRecord[];
    onEditHouse?: (house: House) => void;
    onPayDues?: (house: House) => void;
    onReportHouse?: (house: House) => void;
    onSendWhatsApp?: (house: House) => void;
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
    stbmRecords = [],
    onEditHouse, 
    onPayDues, 
    onReportHouse,
    onSendWhatsApp
}) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'finance' | 'stbm' | 'history'>('profile');
    const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [house.id, activeTab]);

    const { getPaymentStatus, getArrearsForHouse } = useFinancial();
    const activeReports = reports.filter(r => 
        (formatHouseId(r.houseId || '') === formatHouseId(house.id) || 
         formatHouseId(r.reporterHouseId || '') === formatHouseId(house.id)) && 
        r.status !== 'Selesai'
    );
    const isSafe = activeReports.length === 0;
    const officialData = officials?.find(o => {
        const officialHouseId = formatHouseId(o.houseId);
        const currentHouseId = formatHouseId(`${house.block}-${house.number}`);
        return officialHouseId === currentHouseId;
    });

    const statusAir = getPaymentStatus(house, 'Air');
    const statusSampah = getPaymentStatus(house, 'Sampah');
    const arrears = getArrearsForHouse(house);
    const isFullyPaid = arrears.length === 0;

    const houseStbm = stbmRecords.find(s => {
        const sHid = formatHouseId(s.houseId);
        const curHid = formatHouseId(house.id);
        const curBlockNum = formatHouseId(`${house.block}-${house.number}`);
        return sHid === curHid || sHid === curBlockNum;
    });

    const hasStbmIssue = houseStbm ? (houseStbm.needsFollowUp || houseStbm.isBABS) : false;

    const handleCopyKavling = () => {
        const info = `Kavling ${house.block}-${house.number} (ID: ${house.id.slice(0, 8).toUpperCase()}) RT 002/RW 020 Huntap Tondo 2. Penghuni: ${house.headOfFamily || '-'}`;
        navigator.clipboard.writeText(info);
        toast.success('Info kavling berhasil disalin!');
    };

    const cleanPhone = house.phone ? house.phone.replace(/\D/g, '') : '';
    const hasValidPhone = cleanPhone.length >= 8;

    const handleWhatsAppChat = () => {
        if (!hasValidPhone) {
            toast.error('Nomor telepon warga belum terdaftar.');
            return;
        }
        const clean = cleanPhone.replace(/^0/, '62');
        const text = encodeURIComponent(`Halo Bapak/Ibu ${house.headOfFamily || ''} (Warga Kavling ${house.block}-${house.number} RT 002/RW 020 Huntap Tondo 2), kami dari Pengurus RT ingin menginformasikan...`);
        window.open(`https://wa.me/${clean}?text=${text}`, '_blank');
    };
    
    const modalContent = (
        <>
            <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 pointer-events-auto">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" 
                onClick={onClose} 
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="bg-white w-full max-w-sm sm:max-w-md md:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden ring-1 ring-white/20 flex flex-col h-[88dvh] sm:h-auto sm:max-h-[88vh]"
            >
                {/* Mobile Drag Indicator */}
                <div className="sm:hidden w-full pt-2.5 pb-1 flex justify-center bg-transparent absolute top-0 left-0 right-0 z-30 pointer-events-none">
                    <div className="w-12 h-1.5 bg-white/40 rounded-full" />
                </div>

                {/* Modern Digital Twin Cyber/Blueprint Header */}
                <div className={`relative min-h-[170px] sm:min-h-[185px] pt-6 sm:pt-5 pb-4 px-5 sm:px-6 shrink-0 overflow-hidden flex flex-col justify-between ${
                    !isSafe ? 'bg-gradient-to-br from-rose-950 via-rose-900 to-slate-950' :
                    officialData ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950' :
                    house.status === 'Business' ? 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900' :
                    house.status === 'Visiting' ? 'bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900' :
                    !isHouseTrulyOccupied(house) ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900' :
                    'bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-950'
                }`}>
                    {/* SVG Vector Tech Grid */}
                    <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id={`tech-grid-${house.id}`} width="26" height="26" patternUnits="userSpaceOnUse">
                                <path d="M 26 0 L 0 0 0 26" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                                <circle cx="26" cy="26" r="1.5" fill="rgba(255,255,255,0.3)" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#tech-grid-${house.id})`} />
                    </svg>

                    {/* Ambient Glow Orbs */}
                    <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

                    {/* House Real Photo if available */}
                    {house.housePhotoUrl && (
                        <div className="absolute inset-0">
                            <img 
                                src={house.housePhotoUrl} 
                                alt="Foto Rumah" 
                                className="w-full h-full object-cover opacity-60"
                                referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                        </div>
                    )}

                    {/* Header Top Controls */}
                    <div className="relative z-20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Live Pulsing Status Badge */}
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/40 backdrop-blur-md border border-white/15 text-white shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                        !isHouseTrulyOccupied(house) ? 'bg-slate-400' :
                                        house.status === 'Business' ? 'bg-purple-400' :
                                        house.status === 'Visiting' ? 'bg-sky-400' : 'bg-emerald-400'
                                    }`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                        !isHouseTrulyOccupied(house) ? 'bg-slate-400' :
                                        house.status === 'Business' ? 'bg-purple-400' :
                                        house.status === 'Visiting' ? 'bg-sky-400' : 'bg-emerald-400'
                                    }`}></span>
                                </span>
                                {!isHouseTrulyOccupied(house) ? 'Kosong' : 
                                 house.status === 'Business' ? 'Usaha' : 
                                 house.status === 'Visiting' ? 'Rutin Singgah' : 'Dihuni'}
                            </div>

                            {/* Architecture Chip */}
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wide uppercase bg-white/10 backdrop-blur-md border border-white/15 text-white/90 flex items-center gap-1">
                                <Building size={10} className="text-white/70" /> RISHA T-36
                            </span>

                            {officialData && (
                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/80 backdrop-blur-md border border-indigo-400/30 text-white flex items-center gap-1">
                                    <Star size={10} fill="currentColor" /> Pengurus RT
                                </span>
                            )}
                        </div>

                        {/* Close Button */}
                        <button 
                            onClick={onClose} 
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/25 shadow-lg transition-all cursor-pointer"
                            title="Tutup"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Header Bottom Kavling Info */}
                    <div className="relative z-10 flex items-end justify-between gap-2 pt-1">
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold text-emerald-300/90 tracking-widest uppercase mb-1 flex items-center gap-1">
                                <MapPin size={10} /> RT 002 / RW 020 • HUNTAP TONDO 2
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-white drop-shadow-md">
                                    {house.block}-{house.number}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[9px] font-mono tracking-wider text-white/75 bg-white/10 px-2 py-0.5 rounded backdrop-blur-xs">
                                    ID: {house.id.slice(0, 8).toUpperCase()}
                                </span>
                                <button
                                    onClick={handleCopyKavling}
                                    className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white/90 rounded transition-colors cursor-pointer"
                                    title="Salin Info Kavling"
                                >
                                    <Copy size={10} /> Salin
                                </button>
                            </div>
                        </div>

                        {/* Header Action Button */}
                        {hasValidPhone ? (
                            <button
                                onClick={handleWhatsAppChat}
                                className="p-2.5 rounded-2xl bg-emerald-500/25 hover:bg-emerald-500/40 backdrop-blur-md border border-emerald-400/40 text-emerald-300 shadow-lg transition-all active:scale-95 flex flex-col items-center gap-0.5 group shrink-0 cursor-pointer"
                                title="Chat WhatsApp Penghuni"
                            >
                                <MessageCircle size={18} className="group-hover:scale-110 text-emerald-400 transition-transform" />
                                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-300">Chat WA</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsQrisModalOpen(true)}
                                className="p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white shadow-lg transition-all active:scale-95 flex flex-col items-center gap-0.5 group shrink-0 cursor-pointer"
                                title="Tampilkan QRIS Pembayaran Iuran"
                            >
                                <QrCode size={18} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-300">QRIS</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Modern Glassmorphic Segmented Tabs */}
                <div className="p-2 sm:p-2.5 bg-slate-100/90 border-b border-slate-200/80 shrink-0">
                    <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 rounded-2xl">
                            {[
                                { id: 'profile', label: 'Profil', icon: User },
                                { id: 'finance', label: 'Keuangan', icon: CreditCard, badge: arrears.length > 0 ? `${arrears.length}` : undefined },
                                { id: 'stbm', label: 'STBM', icon: Droplets, badge: hasStbmIssue ? '⚠️' : '✓' },
                                { id: 'history', label: 'Riwayat', icon: Clock }
                            ].map(tab => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`relative flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-extrabold transition-all min-w-0 ${
                                            isActive 
                                                ? 'bg-white text-indigo-700 shadow-sm' 
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <Icon size={13} className={`shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <span className="truncate">{tab.label}</span>
                                        {tab.badge && (
                                            <span className={`text-[9px] px-1 sm:px-1.5 py-0.2 rounded-full font-black shrink-0 ${
                                                tab.badge === '⚠️' ? 'bg-rose-100 text-rose-700' :
                                                tab.badge === '✓' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-rose-500 text-white'
                                            }`}>
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div ref={scrollContainerRef} className="overflow-y-auto overscroll-contain custom-scrollbar flex-1 min-h-0 bg-white p-4 sm:p-5 space-y-3.5 sm:space-y-4 pb-12 sm:pb-6">
                        {activeTab === 'profile' && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                {/* Emergency Alert Banner if any */}
                                {!isSafe && (
                                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs animate-pulse">
                                        <div className="bg-rose-600 p-2 rounded-xl text-white shrink-0">
                                            <AlertTriangle size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-rose-800 text-xs">Laporan Kendala Aktif</h4>
                                            <ul className="text-[11px] text-rose-700 mt-1 list-disc pl-4 space-y-0.5">
                                                {activeReports.map(r => (<li key={r.id}>{r.type}: {r.description}</li>))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Main Resident Profile Card */}
                                <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
                                    <div className="flex items-start gap-3.5 sm:gap-4">
                                        {/* Avatar with initial */}
                                        <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md shrink-0 ring-4 ring-indigo-50">
                                            {house.headOfFamily ? house.headOfFamily.charAt(0).toUpperCase() : <Home size={22} />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                    Kepala Keluarga
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                    {house.residenceType || 'Rumah Keluarga'}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-slate-900 text-base sm:text-xl truncate mt-1">
                                                {house.headOfFamily || '(Belum Terdata)'}
                                            </h3>

                                            {/* PDAM Meter Status Pill */}
                                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                                    (house.pdamStatus || 'Terpasang') === 'Terpasang'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : (house.pdamStatus || 'Terpasang') === 'Belum Terpasang'
                                                        ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/10 animate-pulse'
                                                        : 'bg-amber-50 text-amber-700 border-amber-300'
                                                }`}>
                                                    <Droplets size={11} />
                                                    PDAM: {house.pdamStatus || 'Terpasang'}{house.pdamMeterNumber ? ` (#${house.pdamMeterNumber})` : ''}
                                                </span>
                                            </div>

                                            {/* Quick Contact Bar */}
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                {hasValidPhone ? (
                                                    <>
                                                        <button
                                                            onClick={handleWhatsAppChat}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200 text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer"
                                                        >
                                                            <MessageCircle size={13} className="text-emerald-600" />
                                                            <span>WhatsApp</span>
                                                        </button>

                                                        <a
                                                            href={`tel:${cleanPhone}`}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-all"
                                                        >
                                                            <Phone size={11} className="text-slate-500" />
                                                            <span>{house.phone}</span>
                                                        </a>
                                                    </>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 italic">Kontak telepon belum terdaftar</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 4 Live Utility & Sanitation Chips */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className={`p-2.5 sm:p-3 rounded-2xl flex flex-col justify-between gap-1.5 border ${
                                        house.pdamStatus === 'Hilang'
                                            ? 'bg-purple-50/90 border-purple-200'
                                            : house.pdamStatus === 'Belum Terpasang'
                                            ? 'bg-rose-50/80 border-rose-200'
                                            : 'bg-sky-50/80 border-sky-100'
                                    }`}>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <div className={`p-1.5 text-white rounded-lg shadow-2xs shrink-0 ${
                                                house.pdamStatus === 'Hilang'
                                                    ? 'bg-purple-600'
                                                    : house.pdamStatus === 'Belum Terpasang'
                                                    ? 'bg-rose-500'
                                                    : 'bg-sky-500'
                                            }`}>
                                                <Droplets size={13} />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-800 uppercase tracking-tight truncate">Air PDAM</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-0.5">
                                            <span className="text-[10px] text-slate-500 font-bold">Meteran</span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                house.pdamStatus === 'Hilang'
                                                    ? 'bg-purple-100 text-purple-800 animate-pulse'
                                                    : house.pdamStatus === 'Belum Terpasang'
                                                    ? 'bg-rose-100 text-rose-800'
                                                    : statusAir === PaymentStatus.PAID 
                                                    ? 'bg-emerald-100 text-emerald-800' 
                                                    : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {house.pdamStatus === 'Hilang'
                                                    ? '🚨 Hilang'
                                                    : house.pdamStatus === 'Belum Terpasang'
                                                    ? 'Belum Ada'
                                                    : statusAir === PaymentStatus.PAID ? 'Terpasang' : 'Tercatat'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-2.5 sm:p-3 bg-emerald-50/80 border border-emerald-100 rounded-2xl flex flex-col justify-between gap-1.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <div className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-2xs shrink-0">
                                                <CheckCircle2 size={13} />
                                            </div>
                                            <span className="text-[9px] font-black text-emerald-900 uppercase tracking-tight truncate">Sanitasi</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-0.5">
                                            <span className="text-[10px] text-slate-500 font-bold">Biotank</span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                hasStbmIssue 
                                                    ? 'bg-rose-100 text-rose-800' 
                                                    : 'bg-emerald-100 text-emerald-800'
                                            }`}>
                                                {hasStbmIssue ? 'Perlu Cek' : 'Normal'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-2.5 sm:p-3 bg-amber-50/80 border border-amber-100 rounded-2xl flex flex-col justify-between gap-1.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-2xs shrink-0">
                                                <Trash2 size={13} />
                                            </div>
                                            <span className="text-[9px] font-black text-amber-900 uppercase tracking-tight truncate">Sampah</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-0.5">
                                            <span className="text-[10px] text-slate-500 font-bold">TPS3R</span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                statusSampah === PaymentStatus.PAID 
                                                    ? 'bg-emerald-100 text-emerald-800' 
                                                    : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {statusSampah === PaymentStatus.PAID ? 'Terkelola' : 'Ada Tagihan'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-2.5 sm:p-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex flex-col justify-between gap-1.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <div className="p-1.5 bg-indigo-500 text-white rounded-lg shadow-2xs shrink-0">
                                                <ShieldCheck size={13} />
                                            </div>
                                            <span className="text-[9px] font-black text-indigo-900 uppercase tracking-tight truncate">Lingkungan</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-0.5">
                                            <span className="text-[10px] text-slate-500 font-bold">Keamanan</span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                isSafe 
                                                    ? 'bg-indigo-100 text-indigo-800' 
                                                    : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                {isSafe ? 'Aman' : 'Laporan'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 4 Grid Metrik Hunian */}
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                            <Users size={12} className="text-slate-400" />
                                            <span>Total Penghuni</span>
                                        </div>
                                        <div className="text-base font-black text-slate-900 mt-1">
                                            {house.occupants || 0} <span className="text-xs font-bold text-slate-500">Jiwa</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                            <BriefcaseIcon size={12} className="text-slate-400" />
                                            <span>Pekerjaan / Bidang</span>
                                        </div>
                                        <div className="text-xs font-bold text-slate-900 mt-1 truncate">
                                            {house.jobCategory && house.jobCategory.trim() !== '-' ? house.jobCategory : 'Belum Diisi'}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                            <Home size={12} className="text-slate-400" />
                                            <span>Status Hunian</span>
                                        </div>
                                        <div className="text-xs font-bold text-slate-900 mt-1 truncate">
                                            {house.status === 'Occupied' ? 'Dihuni Tetap' : house.status === 'Visiting' ? 'Rutin Singgah' : house.status === 'Business' ? 'Tempat Usaha' : 'Rumah Kosong'}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                            <Navigation size={12} className="text-slate-400" />
                                            <span>Kendaraan Warga</span>
                                        </div>
                                        <div className="text-xs font-bold text-slate-900 mt-1 truncate">
                                            {(house.twoWheelCount || 0) + (house.fourWheelCount || 0) > 0 
                                                ? `${house.twoWheelCount || 0} Motor, ${house.fourWheelCount || 0} Mobil`
                                                : `${house.vehicleCount || 0} Unit`}
                                        </div>
                                    </div>
                                </div>

                                {/* Spesifikasi Arsitektur Kawasan Huntap Tondo 2 */}
                                <div className="p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-200 rounded-xl space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-1">
                                            <Building size={11} className="text-indigo-600" /> Spesifikasi Unit Huntap
                                        </span>
                                        <span className="text-[9px] font-semibold text-slate-500">Standar PUPR</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 pt-1">
                                        <div>• Konstruksi: <strong>RISHA T-36 Tahan Gempa</strong></div>
                                        <div>• Luas Tanah: <strong>108 m² (Kavling)</strong></div>
                                        <div>• Sanitasi: <strong>Biotank + SPALDT</strong></div>
                                        <div>• Air Bersih: <strong>SPAM Reservoir PDAM</strong></div>
                                    </div>
                                </div>

                                {/* Kelompok Rentan Badges */}
                                {(house.pregnantCount || house.babyCount || house.toddlerCount || house.elderlyCount || house.widowCount || house.isDisability) ? (
                                    <div className="space-y-2 pt-1">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kelompok Rentan</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {house.pregnantCount ? <VulnerabilityBadge icon={Heart} label="Ibu Hamil" count={house.pregnantCount} color="rose" /> : null}
                                            {house.babyCount ? <VulnerabilityBadge icon={Baby} label="Bayi" count={house.babyCount} color="blue" /> : null}
                                            {house.toddlerCount ? <VulnerabilityBadge icon={Baby} label="Balita" count={house.toddlerCount} color="amber" /> : null}
                                            {house.elderlyCount ? <VulnerabilityBadge icon={Accessibility} label="Lansia" count={house.elderlyCount} color="indigo" /> : null}
                                            {house.widowCount ? <VulnerabilityBadge icon={User} label="Janda" count={house.widowCount} color="slate" /> : null}
                                            {house.isDisability ? <VulnerabilityBadge icon={Accessibility} label="Disabilitas" count={house.disabilityCount || 1} color="purple" /> : null}
                                        </div>
                                    </div>
                                ) : null}

                                {/* Anggota Keluarga Terdata */}
                                {house.familyMembers && house.familyMembers.length > 0 && (
                                    <div className="space-y-2 pt-1">
                                        <div className="flex items-center justify-between px-1">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Users size={12} className="text-indigo-500" />
                                                <span>Anggota Keluarga ({house.familyMembers.length} Orang)</span>
                                            </h4>
                                        </div>
                                        <div className="bg-slate-50/90 rounded-2xl p-2.5 border border-slate-200/80 space-y-1.5">
                                            {house.familyMembers.map((member, idx) => (
                                                <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-2 shadow-2xs">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                                                            {member.name ? member.name.charAt(0).toUpperCase() : idx + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-black text-slate-800 truncate">{member.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold">{member.relationship || 'Keluarga'}</p>
                                                        </div>
                                                    </div>
                                                    {member.gender && (
                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                                                            {member.gender}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Profil Pengurus if available */}
                                {officialData && (
                                    <div className="bg-slate-950 rounded-2xl p-4 text-white relative overflow-hidden shadow-lg border border-slate-800">
                                        <div className="absolute top-0 right-0 p-3 opacity-10"><Star size={70} fill="currentColor" /></div>
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Penghuni merupakan Pengurus RT</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl border border-indigo-500/40 p-0.5 overflow-hidden shrink-0">
                                                <img src={officialData.photo || `https://ui-avatars.com/api/?name=${officialData.name}&background=6366f1&color=fff`} className="w-full h-full rounded-lg object-cover" alt="" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm leading-tight text-white">{officialData.role}</h4>
                                                <p className="text-xs text-slate-400 font-medium">{officialData.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'finance' && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                {/* Virtual Debit Card */}
                                <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl border border-indigo-500/20">
                                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-300">KARTU IURAN DIGITAL RT 02</span>
                                            <div className="text-xl font-black mt-0.5 tracking-tight">KAVLING {house.block}-{house.number}</div>
                                        </div>
                                        <div className="w-9 h-7 rounded bg-amber-300/80 flex items-center justify-center border border-amber-200 shadow-inner">
                                            <div className="w-5 h-4 border border-amber-600/40 rounded-xs" />
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-end justify-between">
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wider text-slate-400">Status Pembayaran</p>
                                            <p className={`text-base font-black ${isFullyPaid ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {isFullyPaid ? 'LUNAS (TERVERIFIKASI)' : `${arrears.length} Bulan Tunggakan`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] uppercase tracking-wider text-slate-400">Total Tagihan</p>
                                            <p className="text-lg font-black text-white">
                                                Rp {(arrears.length > 0 ? arrears.length * 50000 : 0).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Iuran Status Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-center">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-1.5 ${statusAir === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            <Droplets size={18} />
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase">Iuran Air</div>
                                        <div className={`text-xs font-black mt-0.5 ${statusAir === PaymentStatus.PAID ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {statusAir === PaymentStatus.PAID ? 'LUNAS' : 'MENUNGGAK'}
                                        </div>
                                    </div>

                                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-center">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-1.5 ${statusSampah === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            <Trash2 size={18} />
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase">Iuran Sampah</div>
                                        <div className={`text-xs font-black mt-0.5 ${statusSampah === PaymentStatus.PAID ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {statusSampah === PaymentStatus.PAID ? 'LUNAS' : 'MENUNGGAK'}
                                        </div>
                                    </div>
                                </div>

                                {arrears.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rincian Bulan Tunggakan</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {arrears.map(month => (
                                                <div key={month} className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs font-bold text-rose-800">
                                                    <span>{month}</span>
                                                    <span className="text-[10px] font-semibold text-rose-600">Rp 50.000</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* QRIS Pay Button */}
                                <button
                                    onClick={() => setIsQrisModalOpen(true)}
                                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    <QrCode size={16} />
                                    <span>Bayar Iuran via QRIS Instan</span>
                                </button>
                            </motion.div>
                        )}

                        {activeTab === 'stbm' && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                {/* Banner Status ODF */}
                                <div className={`p-5 rounded-2xl text-white relative overflow-hidden shadow-lg ${hasStbmIssue ? 'bg-rose-600' : 'bg-gradient-to-r from-emerald-600 to-teal-700'}`}>
                                    <div className="absolute top-0 right-0 p-3 opacity-15">
                                        <Droplets size={80} />
                                    </div>
                                    <div className="relative z-10">
                                        <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-wider">
                                            {hasStbmIssue ? '⚠️ Perlu Perhatian Sanitasi' : '🏆 100% ODF Terverifikasi'}
                                        </span>
                                        <h3 className="text-lg font-black mt-1.5 leading-tight">
                                            {hasStbmIssue ? 'Perlu Tindak Lanjut Sanitasi' : 'Sanitasi Total Memenuhi Standar'}
                                        </h3>
                                        <p className="text-xs text-white/90 mt-1 font-medium">
                                            {hasStbmIssue 
                                                ? (houseStbm?.problemType || 'Ada catatan kendala tangki/saluran septik pada hunian ini.')
                                                : 'Jamban terhubung ke Biotank kedap PUPR & jaringan SPALDT ramah lingkungan.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Spesifikasi Sarana Sanitasi */}
                                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Infrastruktur Sanitasi (Huntap Tondo 2)</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/70">
                                            <span className="text-[8px] text-slate-400 font-bold block uppercase">Model Septik</span>
                                            <span className="font-bold text-slate-800 text-[11px]">Biotank Biofilter PUPR</span>
                                        </div>
                                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/70">
                                            <span className="text-[8px] text-slate-400 font-bold block uppercase">Saluran Limbah</span>
                                            <span className="font-bold text-emerald-700 text-[11px]">SPALDT Terpusat</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 5 Pilar STBM Checklist */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Indikator 5 Pilar STBM</h4>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'Pilar 1: Stop BABS (Akses Jamban Sehat)', desc: 'Jamban leher angsa kedap / Biotank terpasang', active: houseStbm ? (!houseStbm.isBABS && houseStbm.hasHealthyLatrine !== false) : true },
                                            { label: 'Pilar 2: Cuci Tangan Pakai Sabun (CTPS)', desc: 'Kran air mengalir & sabun pembersih tangan', active: houseStbm ? (houseStbm.hasCTPS !== false) : true },
                                            { label: 'Pilar 3: Pengelolaan Air & Pangan Aman', desc: 'Air minum terlindung dan wadah tertutup', active: houseStbm ? (houseStbm.safeWaterAndFood !== false) : true },
                                            { label: 'Pilar 4: Pengelolaan Sampah Rumah Tangga', desc: 'Pemilahan terpilah & retribusi TPS3R', active: houseStbm ? (houseStbm.wasteManagement !== false) : true },
                                            { label: 'Pilar 5: Pengelolaan Limbah Cair (SPAL)', desc: 'Saluran limbah cair domestik tertutup & lancar', active: houseStbm ? (houseStbm.liquidWasteManagement !== false) : true }
                                        ].map((pilar, i) => (
                                            <div key={i} className={`flex items-start gap-3 p-2.5 rounded-xl border ${pilar.active ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50 border-rose-200'}`}>
                                                <div className={`mt-0.5 p-1 rounded-full shrink-0 ${pilar.active ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                    <CheckCircle2 size={12} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-bold leading-tight ${pilar.active ? 'text-slate-800' : 'text-rose-800'}`}>{pilar.label}</p>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">{pilar.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {houseStbm?.notes && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                        <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">Catatan Khusus Kader STBM:</p>
                                        <p className="text-xs text-amber-900 font-medium italic">"{houseStbm.notes}"</p>
                                    </div>
                                )}

                                {/* Admin Action / Quick Resolution */}
                                {isAdmin && hasStbmIssue && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                if (houseStbm) {
                                                    await saveSTBMRecord({
                                                        ...houseStbm,
                                                        needsFollowUp: false,
                                                        isBABS: false,
                                                        problemType: undefined,
                                                        notes: `${houseStbm.notes || ''} [Terselesaikan pada ${new Date().toLocaleDateString('id-ID')}]`.trim()
                                                    });
                                                    toast.success('Status kendala sanitasi berhasil diselesaikan!');
                                                }
                                            } catch (e) {
                                                toast.error('Gagal memperbarui status STBM.');
                                            }
                                        }}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                                    >
                                        <CheckCircle size={14} /> Tandai Sanitasi Terselesaikan
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'history' && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                <div className="relative pl-7 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                    <HistoryItem icon={DollarSign} title="Pembayaran Iuran" desc="Pengecekan transaksi iuran air & sampah warga" date="Bulan Berjalan" color="emerald" />
                                    <HistoryItem icon={ShieldCheck} title="Pemeriksaan Sanitasi" desc="Verifikasi 5 Pilar STBM & Biotank PUPR" date="Terkini" color="teal" />
                                    <HistoryItem icon={Edit} title="Pembaruan Data Kependudukan" desc="Penyelarasan database RT 002/RW 020" date="Terdata" color="indigo" />
                                </div>
                                {house.specialNotes && (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-3 opacity-10"><Info size={40} className="text-amber-600" /></div>
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Catatan Khusus</p>
                                        <p className="text-xs font-bold text-slate-700 italic leading-relaxed">"{house.specialNotes}"</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Modern Footer Actions */}
                    <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                        {isAdmin ? (
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <button 
                                    onClick={() => { onClose(); onEditHouse?.(house); }} 
                                    className="flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                                >
                                    <Edit size={16}/> <span>Edit Data</span>
                                </button>
                                <button 
                                    onClick={() => { onClose(); onPayDues?.(house); }} 
                                    className="flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                                >
                                    <DollarSign size={16}/> <span>Kelola Iuran</span>
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                                <button 
                                    onClick={() => { onClose(); onReportHouse?.(house); }} 
                                    className="w-full flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-rose-200 active:scale-95 transition-all cursor-pointer"
                                >
                                    <ShieldAlert size={16}/> <span>Lapor Masalah</span>
                                </button>
                                <button
                                    onClick={() => setIsQrisModalOpen(true)}
                                    className="w-full flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer"
                                >
                                    <QrCode size={16} className="text-emerald-400"/> <span>Bayar QRIS</span>
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Instant QRIS Payment Modal Integration */}
            <QRISPaymentModal
                isOpen={isQrisModalOpen}
                onClose={() => setIsQrisModalOpen(false)}
                title={`Iuran Lingkungan Kavling ${house.block}-${house.number}`}
                amount={arrears.length > 0 ? arrears.length * 50000 : 50000}
                description={`Pembayaran iuran ${house.block}-${house.number} (${arrears.length > 0 ? `${arrears.length} bulan tunggakan` : 'Bulan Berjalan'})`}
                houseId={house.id}
                residentName={house.headOfFamily || `Penghuni Kavling ${house.block}-${house.number}`}
                paymentType="Kombinasi"
                onConfirmPaid={() => {
                    setIsQrisModalOpen(false);
                    toast.success('Terima kasih! Bukti pembayaran QRIS telah diterima.');
                }}
            />
        </>
    );

    if (typeof document !== 'undefined') {
        return createPortal(modalContent, document.body);
    }

    return modalContent;
};

// --- Sub-components for Detail Modal ---

const VulnerabilityBadge = ({ icon: Icon, label, count, color }: { icon: any, label: string, count: number, color: string }) => {
    const colorStyles: Record<string, { bg: string, border: string, text: string, iconBg: string, iconColor: string }> = {
        rose: { bg: 'bg-rose-50/80', border: 'border-rose-200', text: 'text-rose-900', iconBg: 'bg-rose-500', iconColor: 'text-white' },
        blue: { bg: 'bg-sky-50/80', border: 'border-sky-200', text: 'text-sky-900', iconBg: 'bg-sky-500', iconColor: 'text-white' },
        amber: { bg: 'bg-amber-50/80', border: 'border-amber-200', text: 'text-amber-900', iconBg: 'bg-amber-500', iconColor: 'text-white' },
        indigo: { bg: 'bg-indigo-50/80', border: 'border-indigo-200', text: 'text-indigo-900', iconBg: 'bg-indigo-500', iconColor: 'text-white' },
        purple: { bg: 'bg-purple-50/80', border: 'border-purple-200', text: 'text-purple-900', iconBg: 'bg-purple-500', iconColor: 'text-white' },
        slate: { bg: 'bg-slate-50/80', border: 'border-slate-200', text: 'text-slate-900', iconBg: 'bg-slate-500', iconColor: 'text-white' },
    };
    const c = colorStyles[color] || colorStyles.slate;

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${c.bg} ${c.border} shadow-2xs`}>
            <div className={`p-1 rounded-lg ${c.iconBg} ${c.iconColor}`}>
                <Icon size={13} fill={color === 'rose' ? 'currentColor' : 'none'} />
            </div>
            <span className={`text-[11px] font-black ${c.text}`}>{count} {label}</span>
        </div>
    );
};

const HistoryItem = ({ icon: Icon, title, desc, date, color }: { icon: any, title: string, desc: string, date: string, color: string }) => (
    <div className="relative">
        <div className={`absolute -left-[29px] top-0 w-6 h-6 rounded-full bg-white border-2 border-${color}-500 flex items-center justify-center z-10 shadow-sm`}>
            <Icon size={12} className={`text-${color}-600`} />
        </div>
        <div>
            <div className="flex justify-between items-start mb-1">
                <h5 className="text-xs font-black text-slate-800 leading-none">{title}</h5>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{date}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 leading-tight">{desc}</p>
        </div>
    </div>
);

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
    isHighlighted?: boolean;
    stbmRecords?: STBMRecord[];
}

const HouseCard: React.FC<HouseCardProps> = ({ 
    house, 
    hasIssue, 
    officialRole, 
    isAdmin, 
    iuranPayments, 
    activePanicAlert, 
    onClick, 
    showHeatmap = false, 
    activeLayers = ['Security', 'Social', 'Financial', 'STBM'], 
    isHighlighted = false,
    stbmRecords = []
}) => {
    const { getPaymentStatus, getArrearsForHouse } = useFinancial();
    const formattedRole = officialRole ? formatRole(officialRole) : null;
    
    const statusAir = getPaymentStatus(house, 'Air');
    const statusSampah = getPaymentStatus(house, 'Sampah');
    const arrears = getArrearsForHouse(house);
    const hasArrears = arrears.length > 0;

    const houseStbm = stbmRecords.find(s => {
        const sHid = formatHouseId(s.houseId);
        const curHid = formatHouseId(house.id);
        const curBlockNum = formatHouseId(`${house.block}-${house.number}`);
        return sHid === curHid || sHid === curBlockNum;
    });
    const hasStbmIssue = houseStbm ? (houseStbm.needsFollowUp || houseStbm.isBABS) : false;
    const isStbmLayerActive = activeLayers.includes('STBM');

    const getHouseColor = () => {
        if (showHeatmap) {
          const occupants = isHouseTrulyOccupied(house) ? (house.occupants || 1) : (house.occupants || 0);
          if (occupants > 5) return "bg-rose-500 border-rose-700 text-white";
          if (occupants > 3) return "bg-orange-400 border-orange-600 text-white";
          if (occupants > 0) return "bg-emerald-400 border-emerald-600 text-white";
          return "bg-slate-200 border-slate-300 text-slate-400";
        }

        if (hasIssue && activeLayers.includes('Security')) return "bg-rose-50 border-rose-500 text-rose-700 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse ring-2 ring-rose-400 z-20";
        if (isStbmLayerActive && hasStbmIssue) return "bg-rose-50 border-rose-500 text-rose-800 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse ring-2 ring-rose-400 z-20";
        if (officialRole) return "bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 border-amber-400 text-white shadow-lg shadow-indigo-500/40 z-10 ring-2 ring-amber-300";
        if (house.status === 'Visiting') return "bg-gradient-to-br from-sky-50 to-indigo-150 border-sky-400 text-sky-900 shadow-2xs";
        if (!isHouseTrulyOccupied(house)) return "bg-slate-100 border-slate-300 text-slate-400 border-dashed opacity-70";
        if (house.status === 'Business') return "bg-purple-50 border-purple-300 text-purple-700";
        if (house.residenceType === 'Sewa') return "bg-gradient-to-br from-amber-100 to-orange-200 border-amber-500 text-amber-900";
        if (isStbmLayerActive) return "bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-500 text-emerald-950";
        return "bg-gradient-to-br from-emerald-100 to-teal-200 border-emerald-500 text-emerald-900";
    };

    const showSocial = activeLayers.includes('Social');
    const showFinancial = activeLayers.includes('Financial');

    return (
        <div className="relative hover:z-[999] group/card w-full">
            <button 
                id={`house-${house.id}`}
                onClick={onClick} 
                className={`relative flex flex-col items-center justify-center p-1 rounded-lg border transition-all duration-300 min-h-[60px] w-full hover:shadow-md hover:-translate-y-0.5 ${getHouseColor()} ${
                    activePanicAlert ? 'animate-pulsating-glow ring-2 ring-rose-500 z-30' : ''
                } ${
                    isHighlighted ? 'ring-4 ring-indigo-500 ring-offset-2 z-30 scale-105 shadow-xl' : ''
                }`}
            >
                {activePanicAlert && (
                    <span className="absolute -top-2 -right-2 flex h-4 w-4 z-40">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[8px] font-black text-white items-center justify-center">🚨</span>
                    </span>
                )}
                {isHighlighted && (
                    <div className="absolute -inset-1 bg-indigo-500/20 rounded-xl animate-pulse -z-10"></div>
                )}
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
                            {(house.residenceType === 'Sewa') ? <Key size={10} className="opacity-80 text-amber-800" /> : 
                             (house.status === 'Visiting') ? <Clock size={10} className="opacity-80 text-indigo-800" /> :
                             <Home size={10} className="opacity-80"/>}
                        </div>
                    )}
                </div>

                {/* Mini STBM Layer Tag */}
                {isStbmLayerActive && (
                    <div className="mt-1">
                        {hasStbmIssue ? (
                            <span className="text-[7px] font-black uppercase px-1 py-0.5 bg-rose-600 text-white rounded shadow-xs animate-pulse">
                                ⚠️ STBM
                            </span>
                        ) : (
                            <span className="text-[7px] font-black uppercase px-1 py-0.5 bg-emerald-700 text-white rounded shadow-xs">
                                ODF
                            </span>
                        )}
                    </div>
                )}
            </button>

            {/* Glassmorphism Quick Hover Preview Card */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border border-white/20 shadow-2xl opacity-0 group-hover/card:opacity-100 transition-all duration-300 pointer-events-none group-hover/card:pointer-events-auto z-[999] scale-95 group-hover/card:scale-100 hidden md:block">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-amber-300">{house.block}-{house.number}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          house.status === 'Visiting' ? 'bg-sky-500 text-white' :
                          isHouseTrulyOccupied(house) ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                        }`}>
                            {house.status === 'Visiting' ? 'Rutin Dikunjungi' : 
                             isHouseTrulyOccupied(house) ? 'Dihuni' : 'Kosong'}
                        </span>
                    </div>
                    {officialRole && (
                        <span className="text-[8px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30">Pengurus</span>
                    )}
                </div>

                <div className="space-y-1.5 text-left text-xs">
                    <p className="font-bold text-slate-200 truncate flex items-center gap-1.5">
                        <User size={12} className="text-indigo-400 shrink-0" />
                        <span>{house.status === 'Visiting' ? `Pemilik: ${house.headOfFamily || house.ownerName || 'Warga'}` : isHouseTrulyOccupied(house) ? (house.headOfFamily || 'Warga') : 'Belum Berpenghuni (Kosong)'}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>{house.status === 'Visiting' ? 'Status Hunian:' : 'Total Penghuni:'}</span>
                        <span className="font-black text-white">{house.status === 'Visiting' ? 'Rumah Singgah / Pemantauan Rutin' : `${house.occupants || 0} Jiwa`}</span>
                    </p>
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/10">
                        <span className="text-slate-400">Iuran Air & Sampah:</span>
                        <span className={`font-black ${statusAir === PaymentStatus.PAID && statusSampah === PaymentStatus.PAID ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {statusAir === PaymentStatus.PAID && statusSampah === PaymentStatus.PAID ? 'Lunas 🟢' : 'Tunggakan 🔴'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/10">
                        <span className="text-slate-400">Sanitasi &amp; STBM:</span>
                        <span className={`font-black ${hasStbmIssue ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {hasStbmIssue ? 'Perlu Tindak Lanjut ⚠️' : '100% ODF (Biotank) 🟢'}
                        </span>
                    </div>
                </div>

                {house.phone && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[9px] text-slate-400 font-mono">{house.phone}</span>
                        <a 
                            href={`https://wa.me/${house.phone.replace(/^0/, '62').replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            onClick={(e) => e.stopPropagation()} 
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black flex items-center gap-1 transition-all"
                        >
                            <MessageCircle size={10} /> WhatsApp
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

interface BlockRendererProps {
    blockCode: string; houses: House[]; reports: Report[]; officials: Official[]; isAdmin: boolean; iuranPayments?: any[]; activePanicAlerts?: PanicAlert[]; onSelect: (h: House) => void; className?: string;
    showHeatmap?: boolean;
    activeLayers?: string[];
    highlightedId?: string | null;
    stbmRecords?: STBMRecord[];
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ blockCode, houses, reports, officials, isAdmin, iuranPayments, activePanicAlerts = [], onSelect, className, showHeatmap, activeLayers, highlightedId, stbmRecords = [] }) => {
    const sortByNumber = (a: House, b: House) => parseInt(a.number, 10) - parseInt(b.number, 10);
    const sortByNumberDesc = (a: House, b: House) => parseInt(b.number, 10) - parseInt(a.number, 10);
    const sortedHouses = [...houses].sort(sortByNumber);
    const splitIndex = Math.ceil(sortedHouses.length / 2);
    const leftSide = sortedHouses.slice(0, splitIndex); 
    const rightSide = sortedHouses.slice(splitIndex).sort(sortByNumberDesc); 
    const getOfficialRole = (hid: string) => officials.find(o => formatHouseId(o.houseId) === formatHouseId(hid))?.role;
    const getPanicAlert = (hid: string) => activePanicAlerts.find(a => formatHouseId(a.houseId) === formatHouseId(hid));

    return (
        <div id={`block-${blockCode}`} className={`flex flex-col bg-white border-2 border-slate-800 shadow-[8px_8px_0px_0px_rgba(15,23,42,0.15)] rounded-[2rem] ${className || 'h-full'} transition-all hover:shadow-[12px_12px_0px_0px_rgba(15,23,42,0.2)] hover:-translate-y-1 hover:z-[50] relative`}>
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-center py-3 border-b-2 border-slate-800 relative overflow-hidden shrink-0 rounded-t-[1.8rem] flex items-center justify-between px-5">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                 <div className="flex items-center gap-2 relative z-10">
                     <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm"></span>
                     <h3 className="text-xl md:text-2xl font-black tracking-tighter drop-shadow-md text-amber-300">BLOK {blockCode}</h3>
                 </div>
                 <span className="relative z-10 text-[9px] font-black uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-full border border-white/20 text-slate-200">
                     {houses.length} Rumah &bull; {houses.filter(h => !isHouseTrulyOccupied(h)).length} Kosong
                 </span>
            </div>
            <div className="flex-1 bg-slate-50/50 p-3 relative">
                 <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed border-slate-200 z-0"></div>
                 <div className="flex gap-4 relative z-10 h-full">
                    <div className="flex-1 flex flex-col gap-2">
                        {leftSide.map(house => {
                            const houseReports = reports.filter(r => 
                                (formatHouseId(r.houseId || '') === formatHouseId(house.id) || 
                                 formatHouseId(r.reporterHouseId || '') === formatHouseId(house.id)) && 
                                 r.status !== 'Selesai'
                            );
                            const hasIssue = houseReports.length > 0;
                            
                            return (
                                <HouseCard 
                                    key={house.id} 
                                    house={house} 
                                    isAdmin={isAdmin} 
                                    iuranPayments={iuranPayments} 
                                    hasIssue={hasIssue} 
                                    officialRole={getOfficialRole(house.id)} 
                                    activePanicAlert={getPanicAlert(house.id)} 
                                    onClick={() => onSelect(house)} 
                                    showHeatmap={showHeatmap} 
                                    activeLayers={activeLayers} 
                                    isHighlighted={highlightedId === house.id} 
                                    stbmRecords={stbmRecords}
                                />
                            );
                        })}
                    </div>
                     <div className="flex-1 flex flex-col gap-2">
                        {rightSide.map(house => {
                            const houseReports = reports.filter(r => 
                                (formatHouseId(r.houseId || '') === formatHouseId(house.id) || 
                                 formatHouseId(r.reporterHouseId || '') === formatHouseId(house.id)) && 
                                 r.status !== 'Selesai'
                            );
                            const hasIssue = houseReports.length > 0;
                            
                            return (
                                <HouseCard 
                                    key={house.id} 
                                    house={house} 
                                    isAdmin={isAdmin} 
                                    iuranPayments={iuranPayments} 
                                    hasIssue={hasIssue} 
                                    officialRole={getOfficialRole(house.id)} 
                                    activePanicAlert={getPanicAlert(house.id)} 
                                    onClick={() => onSelect(house)} 
                                    showHeatmap={showHeatmap} 
                                    activeLayers={activeLayers} 
                                    isHighlighted={highlightedId === house.id} 
                                    stbmRecords={stbmRecords}
                                />
                            );
                        })}
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
    renderBlock: (
        blockCode: string, 
        houses?: House[], 
        reports?: Report[], 
        officials?: Official[], 
        isAdmin?: boolean, 
        iuranPayments?: any[], 
        activePanicAlerts?: PanicAlert[], 
        onSelect?: (h: House) => void, 
        showHeatmap?: boolean, 
        activeLayers?: string[], 
        highlightedId?: string | null,
        stbmRecords?: STBMRecord[]
    ) => React.ReactNode;
    className?: string;
    showHeatmap?: boolean;
    activeLayers?: string[];
    mapPoints?: MapPoint[];
    highlightedId?: string | null;
    stbmRecords?: STBMRecord[];
}

export const MapLayout: React.FC<MapLayoutProps> = ({ houses, reports = [], officials = [], isAdmin = false, iuranPayments = [], activePanicAlerts = [], onSelect = () => {}, renderBlock, className, showHeatmap, activeLayers, mapPoints = [], highlightedId, stbmRecords = [] }) => {
    const getBlockHouses = (code: string) => houses.filter(h => (h.block || '').trim().toUpperCase() === code.toUpperCase());
    const securityPost = mapPoints.find(p => p.type === 'Security');
    
    return (
        <div className="flex flex-col gap-4 pt-4 md:pt-8">
            {/* Main Road - North Side (Highway Style) with Sidewalks */}
            <div className="relative">
                {/* North Sidewalk */}
                <div className="h-6 bg-slate-400 border-t-2 border-slate-500 rounded-t-xl relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(90deg, #1e293b 1px, transparent 1px), linear-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
                    {/* Curb (Kerb) - Yellow/Black stripes common in Indonesia */}
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-800 flex border-t border-slate-600">
                        {Array.from({ length: 60 }).map((_, i) => (
                            <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-amber-400' : 'bg-slate-900'}`}></div>
                        ))}
                    </div>
                </div>
                
                <div className="flex items-center justify-between px-6 md:px-12 py-8 bg-slate-800 border-y-4 border-slate-700 relative overflow-hidden group shadow-2xl shadow-slate-900/40">
                    {/* Asphalt Texture */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asphalt-dark.png')] opacity-50 pointer-events-none"></div>
                    
                    {/* Lane Markings - Top & Bottom Shoulder */}
                    <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-white/40"></div>
                    <div className="absolute bottom-1.5 left-0 right-0 h-0.5 bg-white/40"></div>
                    
                    {/* Center Lane Divider (Dashed) */}
                    <div className="absolute top-1/2 left-0 right-0 h-1.5 border-t-4 border-dashed border-amber-400/80 -translate-y-1/2 shadow-[0_0_8px_rgba(251,191,36,0.4)]"></div>
                    
                    {/* Zebra Cross Marking Left Side */}
                    <div className="relative z-10 flex gap-1.5 h-12 items-center bg-white/10 px-2 rounded-lg border border-white/10">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="w-2.5 h-10 bg-white shadow-sm rounded-xs"></div>
                        ))}
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="flex flex-col items-center bg-black/40 px-6 py-2 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <span className="text-xs font-black uppercase tracking-[0.6em] text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-1">Jl. Pue Lombe (Utama)</span>
                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-300">
                                <span>Gerbang Masuk RT 02</span>
                                <ChevronRight size={12} className="text-amber-400 animate-pulse" />
                                <ChevronRight size={12} className="text-amber-400 animate-pulse delay-75" />
                                <ChevronRight size={12} className="text-amber-400 animate-pulse delay-150" />
                            </div>
                        </div>
                    </div>

                    {/* Zebra Cross Marking Right Side */}
                    <div className="relative z-10 flex gap-1.5 h-12 items-center bg-white/10 px-2 rounded-lg border border-white/10">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="w-2.5 h-10 bg-white shadow-sm rounded-xs"></div>
                        ))}
                    </div>
                </div>

                {/* South Sidewalk */}
                <div className="h-6 bg-slate-400 border-b-2 border-slate-500 rounded-b-xl relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(90deg, #1e293b 1px, transparent 1px), linear-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
                    {/* Curb (Kerb) */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-slate-800 flex border-b border-slate-600">
                        {Array.from({ length: 60 }).map((_, i) => (
                            <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-amber-400' : 'bg-slate-900'}`}></div>
                        ))}
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
                {renderBlock('C5', getBlockHouses('C5'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers, highlightedId, stbmRecords)}
            </div>
            <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                {renderBlock('C7', getBlockHouses('C7'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers, highlightedId, stbmRecords)}
                {renderBlock('C8', getBlockHouses('C8'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers, highlightedId, stbmRecords)}
            </div>
            <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                {renderBlock('C9', getBlockHouses('C9'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers, highlightedId, stbmRecords)}
                {renderBlock('C10', getBlockHouses('C10'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers, highlightedId, stbmRecords)}
            </div>
            <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                {renderBlock('C11', getBlockHouses('C11'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers, highlightedId, stbmRecords)}
                {renderBlock('C12', getBlockHouses('C12'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers, highlightedId, stbmRecords)}
            </div>
        </div>

        {/* Alternative Road - South Side (Secondary Road Style) with Sidewalks */}
        <div className="relative">
            {/* North Sidewalk (Alternative Road) */}
            <div className="h-4 bg-slate-200 border-t-2 border-slate-300 rounded-t-lg relative overflow-hidden">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(90deg, #94a3b8 1px, transparent 1px), linear-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
            </div>

            <div className="flex items-center justify-center px-12 py-4 bg-slate-700 border-y-2 border-slate-600 relative overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asphalt-dark.png')] opacity-20 pointer-events-none"></div>
                <div className="absolute top-1/2 left-0 right-0 h-0.5 border-t border-dashed border-slate-500/50 -translate-y-1/2"></div>
                <div className="flex items-center gap-3 relative z-10">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Jalan Alternatif</span>
                </div>
            </div>

            {/* South Sidewalk (Alternative Road) */}
            <div className="h-4 bg-slate-200 border-b-2 border-slate-300 rounded-b-lg relative overflow-hidden">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(90deg, #94a3b8 1px, transparent 1px), linear-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
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
  const [stbmRecords, setStbmRecords] = useState<STBMRecord[]>([]);

  useEffect(() => {
    const unsub = subscribeToCheckpoints((data) => {
      setCheckpoints(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubSTBM = subscribeToSTBMRecords((data) => {
      setStbmRecords(data || []);
    });
    return () => unsubSTBM();
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
  const totalOccupied = houses.filter(h => isHouseTrulyOccupied(h)).length;
  const totalVisiting = houses.filter(h => h.status === 'Visiting').length;
  const totalPermanent = houses.filter(h => isHouseTrulyOccupied(h) && h.status === 'Occupied' && h.residenceType !== 'Sewa').length;
  const totalSewa = houses.filter(h => isHouseTrulyOccupied(h) && (h.residenceType === 'Sewa' || h.status === 'Business')).length;
  const totalEmpty = houses.filter(h => !isHouseTrulyOccupied(h)).length;
  const totalIssues = reports.filter(r => r.status !== 'Selesai').length;
  
  // Demografi Totals
  const totalBaby = houses.reduce((acc, h) => acc + (h.babyCount || 0), 0);
  const totalToddler = houses.reduce((acc, h) => acc + (h.toddlerCount || 0), 0);
  const totalElderly = houses.reduce((acc, h) => acc + (h.elderlyCount || 0), 0);
  const totalPregnant = houses.reduce((acc, h) => acc + (h.pregnantCount || 0), 0);
  const totalWidow = houses.reduce((acc, h) => acc + (h.widowCount || 0), 0);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeLayers, setActiveLayers] = useState<string[]>(['Security', 'Social', 'Financial', 'Facility', 'STBM', 'Evakuasi']);
  const [bmkgQuake, setBmkgQuake] = useState<BMKGQuakeData | null>(null);
  const [safetyChecked, setSafetyChecked] = useState(false);
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
      if (containerRef.current) {
        containerRef.current.style.height = originalHeight;
        containerRef.current.style.overflow = originalOverflow;
        containerRef.current.style.width = originalWidth;
      }
      if (printLegend) printLegend.classList.add('hidden');
      
      const link = document.createElement('a');
      link.download = `denah-digital-rt02-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      toast.error('Gagal mengunduh denah.');
    }
  };

  const [statusFilter, setStatusFilter] = useState<'All' | 'Occupied' | 'Visiting' | 'Sewa' | 'Empty'>('All');

  const filteredHouses = useMemo(() => {
    let result = houses;

    // Filter berdasarkan status filter chip jika dipilih
    if (statusFilter === 'Occupied') {
      result = result.filter(h => isHouseTrulyOccupied(h) && h.status === 'Occupied' && h.residenceType !== 'Sewa');
    } else if (statusFilter === 'Visiting') {
      result = result.filter(h => h.status === 'Visiting');
    } else if (statusFilter === 'Sewa') {
      result = result.filter(h => isHouseTrulyOccupied(h) && (h.residenceType === 'Sewa' || h.status === 'Business'));
    } else if (statusFilter === 'Empty') {
      result = result.filter(h => !isHouseTrulyOccupied(h));
    }

    // Filter berdasarkan kata kunci pencarian teks (jika ada)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(h => {
        const fullHouseId = `${h.block}-${h.number}`.toLowerCase();
        const fullHouseIdNoDash = `${h.block}${h.number}`.toLowerCase();
        
        return h.number.toLowerCase().includes(query) || 
               h.headOfFamily.toLowerCase().includes(query) ||
               h.block.toLowerCase().includes(query) ||
               fullHouseId.includes(query) ||
               fullHouseIdNoDash.includes(query);
      });
    }

    return result;
  }, [houses, statusFilter, searchQuery]);

  const highlightedHouseId = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return null;
    const query = searchQuery.toLowerCase();
    
    // Exact match for block-number (e.g. C5-10)
    const exactMatch = houses.find(h => `${h.block}-${h.number}`.toLowerCase() === query);
    if (exactMatch) return exactMatch.id;

    // If only one house is filtered, highlight it
    if (filteredHouses.length === 1) return filteredHouses[0].id;
    
    return null;
  }, [houses, filteredHouses, searchQuery]);

  useEffect(() => {
    if (highlightedHouseId) {
      const el = document.getElementById(`house-${highlightedHouseId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }
  }, [highlightedHouseId]);

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
                 {isAdmin && (
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
                 )}
               </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[9px] md:text-xs font-bold bg-slate-50 p-2 rounded-2xl border border-slate-200/80 w-full md:w-auto no-print print:hidden">
                <button 
                  onClick={() => setStatusFilter('All')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${statusFilter === 'All' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
                >
                  Semua ({houses.length})
                </button>
                <button 
                  onClick={() => setStatusFilter('Occupied')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${statusFilter === 'Occupied' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Dihuni Tetap ({totalPermanent})
                </button>
                <button 
                  onClick={() => setStatusFilter('Visiting')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${statusFilter === 'Visiting' ? 'bg-sky-600 text-white shadow-sm font-black' : 'text-sky-700 bg-sky-50 hover:bg-sky-100'}`}
                >
                  <Clock size={10} /> Rutin Dikunjungi ({totalVisiting})
                </button>
                <button 
                  onClick={() => setStatusFilter('Sewa')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${statusFilter === 'Sewa' ? 'bg-amber-600 text-white shadow-sm font-black' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'}`}
                >
                  <Key size={10} /> Sewa/Usaha ({totalSewa})
                </button>
                <button 
                  onClick={() => setStatusFilter('Empty')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${statusFilter === 'Empty' ? 'bg-slate-700 text-white shadow-sm font-black' : 'text-slate-600 bg-slate-200/60 hover:bg-slate-200'}`}
                >
                  <Home size={10} /> Benar-benar Kosong ({totalEmpty})
                </button>
                <button onClick={() => setShowCheckpoints(!showCheckpoints)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-l border-slate-200 whitespace-nowrap cursor-pointer ${showCheckpoints ? 'text-indigo-600 font-black' : 'text-slate-500'}`}>
                    <ShieldCheck size={12}/> Patroli
                </button>
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

          {/* Filter Layer Section (Admin Only) */}
          {isAdmin && (
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Settings2 size={12} /> Filter Layer
              </h4>
              <div className="space-y-2">
                {[
                  { id: 'Security', label: 'Keamanan', desc: 'CCTV, APAR, Pos Satpam' },
                  { id: 'Social', label: 'Sosial', desc: 'Status Mudik, Tamu, Isoman' },
                  { id: 'Financial', label: 'Keuangan', desc: 'Status Iuran Sampah' },
                  { id: 'Facility', label: 'Fasilitas', desc: 'Masjid, Lapangan, Balai' },
                  { id: 'STBM', label: 'Sanitasi & STBM', desc: 'ODF & Biotank Sehat' },
                  { id: 'Evakuasi', label: 'Jalur Evakuasi Gempa', desc: 'Titik Kumpul & Mitigasi Tondo' }
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
          )}

          {/* Map Legend Section */}
          <div className="space-y-6 pt-2">
            {/* STBM Legend Box */}
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 mb-3 flex items-center justify-between">
                <span>Sanitasi &amp; 5 Pilar STBM</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                  <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center font-black text-[8px] shrink-0">ODF</div>
                  <span className="text-[9px] font-extrabold text-emerald-950 uppercase tracking-tight">100% ODF (Biotank PUPR Sehat)</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-rose-100 shadow-2xs">
                  <div className="w-5 h-5 rounded-md bg-rose-500 text-white flex items-center justify-center font-black text-[8px] shrink-0 animate-pulse">!</div>
                  <span className="text-[9px] font-extrabold text-rose-800 uppercase tracking-tight">Kendala Sanitasi / Perlu Cek</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3.5 flex items-center justify-between">
                <span>Fasilitas &amp; Keamanan</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0"><Video size={12} strokeWidth={2.5}/></div>
                  <span className="text-[10px] font-extrabold text-slate-800 tracking-tight">TITIK CCTV LINGKUNGAN</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0"><Shield size={12} strokeWidth={2.5}/></div>
                  <span className="text-[10px] font-extrabold text-slate-800 tracking-tight">POS KEAMANAN / SATPAM</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0"><Flame size={12} strokeWidth={2.5}/></div>
                  <span className="text-[10px] font-extrabold text-slate-800 tracking-tight">TITIK APAR PEMADAM</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0"><Users size={12} strokeWidth={2.5}/></div>
                  <span className="text-[10px] font-extrabold text-slate-800 tracking-tight">TITIK KUMPUL EVAKUASI</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0"><ArrowRight size={12} strokeWidth={2.5}/></div>
                  <span className="text-[10px] font-extrabold text-slate-800 tracking-tight">JALUR EVAKUASI BENCANA</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0"><Droplets size={12} strokeWidth={2.5}/></div>
                  <span className="text-[10px] font-extrabold text-slate-800 tracking-tight">HYDRANT / SUMBER AIR</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3.5 flex items-center justify-between">
                <span>Status Hunian Kavling</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <div className="w-4 h-4 rounded-md bg-emerald-500/20 border-2 border-emerald-500 shrink-0" />
                  <span className="text-[10px] font-extrabold text-slate-800 tracking-tight">RUMAH TETAP (TERISI)</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <div className="w-4 h-4 rounded-md bg-sky-500/20 border-2 border-sky-500 shrink-0" />
                  <span className="text-[10px] font-extrabold text-slate-800 tracking-tight">RUTIN DIKUNJUNGI (SINGGAH)</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <div className="w-4 h-4 rounded-md bg-amber-500/20 border-2 border-amber-500 shrink-0" />
                  <span className="text-[10px] font-extrabold text-slate-800 tracking-tight">RUMAH SEWA / KONTRAK</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <div className="w-4 h-4 rounded-md bg-slate-100 border-2 border-dashed border-slate-400 shrink-0" />
                  <span className="text-[10px] font-extrabold text-slate-800 tracking-tight">RUMAH KOSONG (BELUM DIHUNI)</span>
                </div>
              </div>
            </div>

            {showHeatmap && (
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Kepadatan Penghuni</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/60">
                    <div className="w-3.5 h-3.5 rounded-md bg-rose-500 shrink-0" />
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase">&gt; 5 Orang</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/60">
                    <div className="w-3.5 h-3.5 rounded-md bg-orange-400 shrink-0" />
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase">3 - 5 Orang</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/60">
                    <div className="w-3.5 h-3.5 rounded-md bg-emerald-400 shrink-0" />
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase">1 - 2 Orang</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3.5 flex items-center justify-between">
                <span>Kelompok Rentan &amp; Proteksi</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-rose-100 shadow-2xs hover:border-rose-200 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                      <Baby size={13} className="text-rose-600" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight truncate">BAYI</span>
                  </div>
                  <span className="text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg shrink-0 font-mono">{totalBaby}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-100 shadow-2xs hover:border-amber-200 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <Baby size={13} className="text-amber-600" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight truncate">BALITA</span>
                  </div>
                  <span className="text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg shrink-0 font-mono">{totalToddler}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-indigo-100 shadow-2xs hover:border-indigo-200 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Accessibility size={13} className="text-indigo-600" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight truncate">LANSIA</span>
                  </div>
                  <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg shrink-0 font-mono">{totalElderly}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-pink-100 shadow-2xs hover:border-pink-200 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                      <Heart size={13} className="text-pink-600" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight truncate">IBU HAMIL</span>
                  </div>
                  <span className="text-[11px] font-black text-pink-700 bg-pink-50 border border-pink-200 px-2.5 py-0.5 rounded-lg shrink-0 font-mono">{totalPregnant}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <User size={13} className="text-slate-600" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight truncate">JANDA / DUDA SENIOR</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg shrink-0 font-mono">{totalWidow}</span>
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
        <div className="flex-1 relative overflow-auto p-4 md:p-12 print:p-0 print:overflow-visible print:h-auto bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] bg-fixed">
          <div className="min-w-[1100px] mx-auto relative print:min-w-0 print:w-full print:transform print:scale-[0.85] print:origin-top">
              <div 
                  ref={mapRef}
                  onClick={handleMapClick}
                  className={`border-[8px] border-slate-200 bg-white/80 backdrop-blur-sm p-16 md:p-24 rounded-[5rem] relative transition-all duration-500 shadow-2xl print:border-none print:bg-white print:p-0 print:rounded-none ${isManageMode ? 'cursor-crosshair ring-8 ring-rose-500/20 border-rose-400/50' : ''}`}
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
                            highlightedId={highlightedHouseId}
                            stbmRecords={stbmRecords}
                            renderBlock={(code, bHouses = [], bReports = [], bOfficials = [], bIsAdmin = false, bIuran = [], bAlerts = [], bOnSelect = () => {}, bHeatmap = false, bLayers = [], bHighlight = null, bStbm = []) => (
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
                                highlightedId={bHighlight}
                                stbmRecords={bStbm}
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
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600 flex items-center justify-center"><Flame size={8} className="text-white"/></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Titik APAR</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-600 flex items-center justify-center"><Users size={8} className="text-white"/></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Titik Kumpul</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-teal-500 flex items-center justify-center"><ArrowRight size={8} className="text-white"/></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Jalur Evakuasi</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center"><Droplets size={8} className="text-white"/></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Hydrant / Air</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-600 flex items-center justify-center"><MapIcon size={8} className="text-white"/></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Fasilitas Umum</span></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Status Hunian</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-500"></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Tetap (Dihuni)</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-sky-100 border border-sky-500"></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Rutin Dikunjungi / Singgah</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-500"></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Sewa / Kontrak</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-100 border border-slate-300 border-dashed"></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Kosong (Belum Dihuni)</span></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Demografi (Total)</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2"><Baby size={10} className="text-rose-500"/> <span className="text-[10px] font-bold text-slate-600 uppercase">Bayi</span></div>
                                            <span className="text-[10px] font-black text-rose-600">{totalBaby}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2"><Baby size={10} className="text-orange-500"/> <span className="text-[10px] font-bold text-slate-600 uppercase">Balita</span></div>
                                            <span className="text-[10px] font-black text-orange-600">{totalToddler}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2"><Accessibility size={10} className="text-indigo-500"/> <span className="text-[10px] font-bold text-slate-600 uppercase">Lansia</span></div>
                                            <span className="text-[10px] font-black text-indigo-600">{totalElderly}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2"><Heart size={10} className="text-rose-400"/> <span className="text-[10px] font-bold text-slate-600 uppercase">Hamil</span></div>
                                            <span className="text-[10px] font-black text-rose-600">{totalPregnant}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2"><User size={10} className="text-slate-500"/> <span className="text-[10px] font-bold text-slate-600 uppercase">Janda/Duda</span></div>
                                            <span className="text-[10px] font-black text-slate-600">{totalWidow}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Keterangan & Heatmap</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2"><Droplets size={10} className="text-blue-500"/> <span className="text-[10px] font-bold text-slate-600 uppercase">OP Air</span></div>
                                        <div className="flex items-center gap-2"><Trash2 size={10} className="text-slate-500"/> <span className="text-[10px] font-bold text-slate-600 uppercase">Sampah</span></div>
                                        <div className="flex items-center gap-2"><Compass size={10} className="text-rose-600"/> <span className="text-[10px] font-bold text-slate-600 uppercase">Utara</span></div>
                                        
                                        {showHeatmap && (
                                          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Kepadatan:</p>
                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-rose-500"></div> <span className="text-[8px] font-bold text-slate-500 uppercase">&gt; 5 Jiwa</span></div>
                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-orange-400"></div> <span className="text-[8px] font-bold text-slate-500 uppercase">3-5 Jiwa</span></div>
                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-emerald-400"></div> <span className="text-[8px] font-bold text-slate-500 uppercase">1-2 Jiwa</span></div>
                                          </div>
                                        )}
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
                              if (activeLayers.length > 0) {
                                  if (point.type === 'CCTV' && !activeLayers.includes('Security')) return null;
                                  if (point.type === 'PJU' && !activeLayers.includes('Security')) return null;
                                  if (point.type === 'Hydrant' && !activeLayers.includes('Security')) return null;
                                  if (point.type === 'APAR' && !activeLayers.includes('Security')) return null;
                                  if (point.type === 'Security' && !activeLayers.includes('Security')) return null;
                                  if (point.type === 'Trash' && !activeLayers.includes('Social')) return null;
                                  if (point.type === 'Facility' && !activeLayers.includes('Facility')) return null;
                                  if ((point.type === 'AssemblyPoint' || point.type === 'EvacuationRoute') && !activeLayers.includes('Evakuasi')) return null;
                              }

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
                                  className={`absolute z-50 flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-all ${draggingId === point.id && draggingType === 'mappoint' ? 'scale-125 z-60' : 'hover:scale-125 hover:z-60'} ${isManageMode ? 'cursor-pointer' : 'cursor-pointer'}`}
                                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                              >
                                  <div className={`p-2 rounded-full shadow-lg ${
                                      draggingId === point.id && draggingType === 'mappoint' ? 'bg-rose-500 ring-4 ring-rose-200' :
                                      point.type === 'Gate' ? 'bg-amber-500 shadow-amber-500/50' :
                                      point.type === 'Security' ? 'bg-blue-500 shadow-blue-500/50' :
                                      point.type === 'Block' ? 'bg-emerald-500 shadow-emerald-500/50' :
                                      point.type === 'PJU' ? 'bg-yellow-500 shadow-yellow-500/50' :
                                      point.type === 'CCTV' ? 'bg-rose-600 ring-2 ring-rose-300 shadow-rose-600/50 animate-pulse' :
                                      point.type === 'Hydrant' ? 'bg-rose-500 shadow-rose-500/50' :
                                      point.type === 'APAR' ? 'bg-red-600 shadow-red-600/50' :
                                      point.type === 'AssemblyPoint' ? 'bg-green-600 shadow-green-600/50' :
                                      point.type === 'EvacuationRoute' ? 'bg-teal-500 shadow-teal-500/50' :
                                      point.type === 'Trash' ? 'bg-orange-500 shadow-orange-500/50' :
                                      point.type === 'Facility' ? 'bg-purple-600 shadow-purple-600/50' :
                                      'bg-slate-500'
                                  } text-white border-2 border-white`}>
                                      {point.type === 'Gate' ? <Move size={14} /> : 
                                       point.type === 'Security' ? <Shield size={14} /> : 
                                       point.type === 'PJU' ? <Lightbulb size={14} /> :
                                       point.type === 'CCTV' ? <Video size={14} /> :
                                       point.type === 'Hydrant' ? <Droplets size={14} /> :
                                       point.type === 'APAR' ? <Flame size={14} /> :
                                       point.type === 'AssemblyPoint' ? <Users size={14} /> :
                                       point.type === 'EvacuationRoute' ? <ArrowRight size={14} /> :
                                       point.type === 'Trash' ? <Trash size={14} /> :
                                       point.type === 'Facility' ? (
                                           point.label.toLowerCase().includes('masjid') ? (
                                               <div className="relative">
                                                   <MapIcon size={14} className="text-emerald-200" />
                                                   <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                                               </div>
                                           ) : <MapIcon size={14} />
                                       ) :
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

                          {/* Active Patrol Location with Smooth Transition */}
                          {activePatrol?.currentLocation && (
                              <motion.div 
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ 
                                    scale: 1, 
                                    opacity: 1,
                                    left: `${activePatrol.currentLocation.x}%`, 
                                    top: `${activePatrol.currentLocation.y}%` 
                                  }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 100,
                                    damping: 15,
                                    mass: 1
                                  }}
                                  className="absolute z-50 flex flex-col items-center -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                              >
                                  <div className="relative">
                                      <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-35 scale-150"></div>
                                      <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 text-white p-3 md:p-4 rounded-full shadow-2xl shadow-indigo-400 ring-4 ring-white relative z-10">
                                          <Navigation size={24} fill="currentColor" className="animate-pulse" />
                                      </div>
                                  </div>
                                  <div className="mt-2 bg-slate-900 text-white px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl border-2 border-indigo-400 whitespace-nowrap flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
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
      {selectedHouse && (
        <HouseDetailModal 
          house={selectedHouse} 
          onClose={() => setSelectedHouse(null)} 
          reports={reports} 
          isAdmin={isAdmin} 
          officials={officials} 
          iuranPayments={iuranPayments} 
          stbmRecords={stbmRecords}
          onEditHouse={onEditHouse} 
          onPayDues={onPayDues} 
          onReportHouse={onReportHouse}
          onSendWhatsApp={(house) => {
            if (house.phone) {
              window.open(`https://wa.me/${house.phone.replace(/^0/, '62').replace(/\D/g, '')}`, '_blank');
            }
          }}
        />
      )}
      
      {/* CCTV Modal */}
      {activeCctv && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-800 text-white flex flex-col"
          >
            {/* Header Toolbar */}
            <div className="bg-slate-950/90 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                  <Video size={22} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${activeCctv.cctvStatus === 'Offline' ? 'bg-rose-600' : activeCctv.cctvStatus === 'Maintenance' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-400">
                      {activeCctv.cctvStatus ? `SURVEILLANCE CAM • ${activeCctv.cctvStatus.toUpperCase()}` : 'SURVEILLANCE CAM LIVE'}
                    </span>
                  </div>
                  <h3 className="font-black text-lg md:text-xl text-white tracking-tight leading-tight">{activeCctv.label}</h3>
                </div>
              </div>
              <button 
                onClick={() => setActiveCctv(null)} 
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Stage */}
            <div className="aspect-video bg-black relative flex items-center justify-center group overflow-hidden">
              {activeCctv.cctvUrl ? (
                activeCctv.cctvUrl.match(/\.(mp4|webm|m3u8)$/i) ? (
                  <video 
                    src={activeCctv.cctvUrl}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <iframe 
                    src={activeCctv.cctvUrl} 
                    className="w-full h-full border-none"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    title={`Live Stream ${activeCctv.label}`}
                  />
                )
              ) : (
                <div className="text-center p-8 max-w-sm">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-800 text-rose-500/80 shadow-inner">
                    <VideoOff size={32} />
                  </div>
                  <h4 className="text-white font-black uppercase tracking-wider text-sm">KAMERA STANDBY / UNCONFIGURED</h4>
                  <p className="text-slate-400 text-xs mt-1.5 font-medium leading-relaxed">
                    Pengurus RT belum menginput URL Streaming RTSP / iFrame untuk titik lokasi CCTV ini.
                  </p>
                </div>
              )}

              {/* Overlay Status Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-rose-600/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-rose-400/40 shadow-md">
                <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                LIVE STREAMING &bull; {activeCctv.cctvResolution || '1080P FULL HD'}
              </div>
            </div>

            {/* Footer Status Bar */}
            <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap justify-between items-center gap-3 text-xs">
              <div className="flex items-center gap-5 text-slate-400 font-mono text-[11px] font-bold">
                <div className="flex items-center gap-1.5">
                  <Activity size={14} className="text-emerald-400" />
                  <span className="text-slate-300">BITRATE: 4.8 Mbps</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-rose-400" />
                  <span className="text-slate-300">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WITA</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider">
                  ZONA: {activeCctv.cctvLocationZone || 'POS SATPAM RT 02'}
                </span>
                {activeCctv.cctvOperatorContact && (
                  <a 
                    href={`tel:${activeCctv.cctvOperatorContact}`}
                    className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <Phone size={12} /> {activeCctv.cctvOperatorContact}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Facility Info Modal */}
      {selectedFacility && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm pointer-events-auto">
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
        </div>,
        document.body
      )}
    </div>
  );
};
