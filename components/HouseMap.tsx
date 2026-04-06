import React, { useState, useEffect, useRef, useMemo } from 'react';
import { House, PaymentStatus, Report, Official, Checkpoint, MapPoint, PatrolSession, PanicAlert } from '../types';
import { Home, Map as MapIcon, MapPin, Store, X, AlertTriangle, User, Edit, DollarSign, ShieldAlert, ChevronRight, Info, CheckCircle, ShieldCheck, Star, Baby, Heart, Accessibility, Smile, Users, GraduationCap, Key, Briefcase as BriefcaseIcon, Phone, MessageCircle, Droplets, Trash2, Settings2, Save, Move, Shield, Lightbulb, Video, Trash, Navigation, Bell, Search, MousePointer2, VideoOff, Activity, Clock, Filter, Flame, CreditCard, Compass, Thermometer, UserPlus, Printer, Download, ArrowRight, AlertCircle } from 'lucide-react';
import { domToPng } from 'modern-screenshot';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
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
    onEditHouse, 
    onPayDues, 
    onReportHouse,
    onSendWhatsApp
}) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'finance' | 'history'>('profile');

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
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white w-full max-w-sm md:max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden ring-1 ring-slate-200 flex flex-col max-h-[90vh]"
            >
                {/* Header Section with Photo Support */}
                <div className={`relative h-44 md:h-52 shrink-0 transition-colors duration-500 ${isSafe ? (officialData ? 'bg-slate-900' : 'bg-indigo-600') : 'bg-rose-600'}`}>
                    {house.housePhotoUrl ? (
                        <div className="absolute inset-0">
                            <img 
                                src={house.housePhotoUrl} 
                                alt="Foto Rumah" 
                                className="w-full h-full object-cover opacity-70"
                                referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 pointer-events-none"></div>
                    )}
                    
                    <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-all backdrop-blur-md border border-white/20 shadow-lg"><X size={20}/></button>
                    
                    <div className="absolute bottom-6 left-8 text-white z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${house.status === 'Occupied' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                {house.status === 'Occupied' ? 'Dihuni' : 'Kosong'}
                            </span>
                            {officialData && <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-indigo-500">Pengurus</span>}
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none drop-shadow-2xl">{house.block}-{house.number}</h2>
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.4em] mt-1">Digital Twin Property ID: {house.id.slice(0,8)}</p>
                    </div>
                </div>

                {/* Modern Tab Navigation */}
                <div className="flex p-2 bg-slate-50 border-b border-slate-100 shrink-0">
                    {[
                        { id: 'profile', label: 'Profil', icon: User },
                        { id: 'finance', label: 'Keuangan', icon: DollarSign },
                        { id: 'history', label: 'Riwayat', icon: Clock }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Section */}
                <div className="overflow-y-auto custom-scrollbar flex-1 bg-white">
                    <div className="p-6">
                        {activeTab === 'profile' && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                {/* Emergency Alert Banner */}
                                {!isSafe && (
                                    <div className="bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-5 flex items-start gap-4 animate-pulse">
                                        <div className="bg-rose-600 p-3 rounded-2xl text-white shadow-xl shadow-rose-200">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-rose-700 text-xs uppercase tracking-widest">Laporan Aktif</h4>
                                            <ul className="text-[11px] text-rose-600 mt-1 list-disc pl-4 font-bold space-y-0.5">
                                                {activeReports.map(r => (<li key={r.id}>{r.type}: {r.description}</li>))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Family Info Card */}
                                <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><User size={120} /></div>
                                    <div className="flex items-center gap-5 mb-6 relative z-10">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-black text-3xl shadow-md border border-slate-100">
                                            {house.headOfFamily.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] leading-none mb-1.5">Kepala Keluarga</p>
                                            <h3 className="font-black text-slate-900 text-xl truncate leading-tight">{house.headOfFamily}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                                                    <Phone size={10} className="text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-600">{house.phone || '-'}</span>
                                                </div>
                                                {house.phone && (
                                                    <a href={`https://wa.me/${house.phone.replace(/^0/, '62').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors border border-emerald-100">
                                                        <MessageCircle size={14} fill="currentColor" className="opacity-80" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Penghuni</p>
                                            <p className="text-lg font-black text-slate-900">{house.occupants || 0} <span className="text-xs font-bold text-slate-400">Jiwa</span></p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Hunian</p>
                                            <p className="text-lg font-black text-slate-900">{house.residenceType || 'Milik'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Kelompok Rentan Badges */}
                                {(house.pregnantCount || house.babyCount || house.toddlerCount || house.elderlyCount || house.widowCount) ? (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kelompok Rentan</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {house.pregnantCount ? <VulnerabilityBadge icon={Heart} label="Ibu Hamil" count={house.pregnantCount} color="rose" /> : null}
                                            {house.babyCount ? <VulnerabilityBadge icon={Baby} label="Bayi" count={house.babyCount} color="blue" /> : null}
                                            {house.toddlerCount ? <VulnerabilityBadge icon={Baby} label="Balita" count={house.toddlerCount} color="amber" /> : null}
                                            {house.elderlyCount ? <VulnerabilityBadge icon={Accessibility} label="Lansia" count={house.elderlyCount} color="indigo" /> : null}
                                            {house.widowCount ? <VulnerabilityBadge icon={User} label="Janda" count={house.widowCount} color="slate" /> : null}
                                        </div>
                                    </div>
                                ) : null}

                                {/* Official Data */}
                                {officialData && (
                                    <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-slate-200">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Star size={80} fill="currentColor" /></div>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Profil Pengurus</p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl border-2 border-indigo-500/30 p-1">
                                                <img src={officialData.photo || `https://ui-avatars.com/api/?name=${officialData.name}&background=random`} className="w-full h-full rounded-xl object-cover" alt="" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg leading-none">{officialData.role}</h4>
                                                <p className="text-xs text-slate-400 mt-1 font-bold">{officialData.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'finance' && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="bg-indigo-600 rounded-[2rem] p-8 text-white text-center relative overflow-hidden shadow-xl shadow-indigo-200">
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">Total Tunggakan</p>
                                    <h3 className="text-4xl font-black">{arrears.length} <span className="text-sm font-bold opacity-60 uppercase tracking-widest">Bulan</span></h3>
                                    <div className="mt-6 flex justify-center gap-4">
                                        <div className="text-center">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 border-2 ${statusAir === PaymentStatus.PAID ? 'bg-emerald-500/20 border-emerald-400' : 'bg-rose-500/20 border-rose-400'}`}>
                                                <Droplets size={20} className={statusAir === PaymentStatus.PAID ? 'text-emerald-300' : 'text-rose-300'} />
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Iuran Air</p>
                                        </div>
                                        <div className="text-center">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 border-2 ${statusSampah === PaymentStatus.PAID ? 'bg-emerald-500/20 border-emerald-400' : 'bg-rose-500/20 border-rose-400'}`}>
                                                <Trash2 size={20} className={statusSampah === PaymentStatus.PAID ? 'text-emerald-300' : 'text-rose-300'} />
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Iuran Sampah</p>
                                        </div>
                                    </div>
                                </div>

                                {arrears.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detail Tunggakan</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {arrears.map(month => (
                                                <div key={month} className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                                                    <span className="text-xs font-bold text-rose-700">{month}</span>
                                                    <AlertCircle size={12} className="text-rose-400" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isAdmin && (
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Bantuan Sosial</p>
                                        <div className="flex flex-wrap gap-2">
                                            {house.isPKH && <span className="px-3 py-1.5 bg-white text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-100 shadow-sm">PKH</span>}
                                            {house.isBLT && <span className="px-3 py-1.5 bg-white text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-100 shadow-sm">BLT</span>}
                                            {house.isBansosLain && <span className="px-3 py-1.5 bg-white text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-100 shadow-sm">{house.bansosLainName || 'Bansos'}</span>}
                                            {(!house.isPKH && !house.isBLT && !house.isBansosLain) && <span className="text-xs font-bold text-slate-400 italic">Tidak ada data bantuan</span>}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'history' && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                    {/* Mock History Items - In real app, fetch from database */}
                                    <HistoryItem icon={DollarSign} title="Pembayaran Iuran" desc="Iuran bulan Maret berhasil dicatat" date="2 jam yang lalu" color="emerald" />
                                    <HistoryItem icon={ShieldAlert} title="Laporan Keamanan" desc="Laporan lampu jalan mati di depan rumah" date="Kemarin, 14:20" color="rose" />
                                    <HistoryItem icon={Edit} title="Pembaruan Data" desc="Perubahan jumlah penghuni rumah" date="3 hari yang lalu" color="indigo" />
                                </div>
                                {house.specialNotes && (
                                    <div className="p-5 bg-amber-50 border border-amber-100 rounded-[2rem] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10"><Info size={40} className="text-amber-600" /></div>
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Catatan Khusus</p>
                                        <p className="text-xs font-bold text-slate-700 italic leading-relaxed">"{house.specialNotes}"</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 p-6 border-t border-slate-100 shrink-0">
                    {isAdmin ? (
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => { onClose(); onEditHouse?.(house); }} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-200"><Edit size={18}/> Edit</button>
                            <button onClick={() => { onClose(); onPayDues?.(house); }} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-500 active:scale-95 transition-all shadow-xl shadow-indigo-200"><DollarSign size={18}/> Iuran</button>
                        </div>
                    ) : (
                        <button onClick={() => { onClose(); onReportHouse?.(house); }} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-500 active:scale-95 transition-all"><ShieldAlert size={20}/> Lapor Masalah</button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// --- Sub-components for Detail Modal ---

const VulnerabilityBadge = ({ icon: Icon, label, count, color }: { icon: any, label: string, count: number, color: string }) => (
    <div className={`flex items-center gap-2 px-3 py-2 bg-white rounded-2xl shadow-sm border border-${color}-100`}>
        <div className={`p-1.5 bg-${color}-50 text-${color}-500 rounded-lg`}>
            <Icon size={14} fill={color === 'rose' ? 'currentColor' : 'none'} />
        </div>
        <span className="text-[10px] font-black text-slate-700">{count} {label}</span>
    </div>
);

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
}

const HouseCard: React.FC<HouseCardProps> = ({ house, hasIssue, officialRole, isAdmin, iuranPayments, activePanicAlert, onClick, showHeatmap = false, activeLayers = ['Security', 'Social', 'Financial'], isHighlighted = false }) => {
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
        <button 
            id={`house-${house.id}`}
            onClick={onClick} 
            className={`relative flex flex-col items-center justify-center p-1 rounded-lg border transition-all duration-300 min-h-[60px] w-full hover:shadow-md hover:-translate-y-0.5 ${getHouseColor()} ${
                isHighlighted ? 'ring-4 ring-indigo-500 ring-offset-2 z-30 scale-105 shadow-xl' : ''
            }`}
        >
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
    highlightedId?: string | null;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ blockCode, houses, reports, officials, isAdmin, iuranPayments, activePanicAlerts = [], onSelect, className, showHeatmap, activeLayers, highlightedId }) => {
    const sortByNumber = (a: House, b: House) => parseInt(a.number, 10) - parseInt(b.number, 10);
    const sortByNumberDesc = (a: House, b: House) => parseInt(b.number, 10) - parseInt(a.number, 10);
    const sortedHouses = [...houses].sort(sortByNumber);
    const splitIndex = Math.ceil(sortedHouses.length / 2);
    const leftSide = sortedHouses.slice(0, splitIndex); 
    const rightSide = sortedHouses.slice(splitIndex).sort(sortByNumberDesc); 
    const getOfficialRole = (hid: string) => officials.find(o => formatHouseId(o.houseId) === formatHouseId(hid))?.role;
    const getPanicAlert = (hid: string) => activePanicAlerts.find(a => formatHouseId(a.houseId) === formatHouseId(hid));

    return (
        <div id={`block-${blockCode}`} className={`flex flex-col bg-white border-2 border-slate-800 shadow-[8px_8px_0px_0px_rgba(15,23,42,0.15)] rounded-[2rem] ${className || 'h-full'} transition-all hover:shadow-[12px_12px_0px_0px_rgba(15,23,42,0.2)] hover:-translate-y-1`}>
            <div className="bg-slate-900 text-white text-center py-3 border-b-2 border-slate-800 relative overflow-hidden shrink-0 rounded-t-[1.8rem]">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                 <h3 className="text-2xl font-black tracking-tighter relative z-10 drop-shadow-md">{blockCode}</h3>
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
        highlightedId?: string | null
    ) => React.ReactNode;
    className?: string;
    showHeatmap?: boolean;
    activeLayers?: string[];
    mapPoints?: MapPoint[];
    highlightedId?: string | null;
}

export const MapLayout: React.FC<MapLayoutProps> = ({ houses, reports = [], officials = [], isAdmin = false, iuranPayments = [], activePanicAlerts = [], onSelect = () => {}, renderBlock, className, showHeatmap, activeLayers, mapPoints = [], highlightedId }) => {
    const getBlockHouses = (code: string) => houses.filter(h => h.block === code);
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
                
                <div className="flex items-center justify-center px-8 md:px-12 py-8 bg-slate-800 border-y-4 border-slate-700 relative overflow-hidden group shadow-2xl shadow-slate-900/40">
                    {/* Asphalt Texture */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asphalt-dark.png')] opacity-50 pointer-events-none"></div>
                    
                    {/* Lane Markings - Top & Bottom Shoulder */}
                    <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-white/40"></div>
                    <div className="absolute bottom-1.5 left-0 right-0 h-0.5 bg-white/40"></div>
                    
                    {/* Center Lane Divider (Dashed) */}
                    <div className="absolute top-1/2 left-0 right-0 h-1.5 border-t-4 border-dashed border-amber-400/80 -translate-y-1/2 shadow-[0_0_8px_rgba(251,191,36,0.4)]"></div>
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-black uppercase tracking-[0.6em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-1">Jl. Pue Lombe</span>
                            <div className="flex items-center gap-1">
                                <ChevronRight size={12} className="text-amber-400 animate-pulse" />
                                <ChevronRight size={12} className="text-amber-400 animate-pulse delay-75" />
                                <ChevronRight size={12} className="text-amber-400 animate-pulse delay-150" />
                            </div>
                        </div>
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
                {renderBlock('C5', getBlockHouses('C5'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers, highlightedId)}
            </div>
            <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                {renderBlock('C7', getBlockHouses('C7'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers, highlightedId)}
                {renderBlock('C8', getBlockHouses('C8'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers, highlightedId)}
            </div>
            <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                {renderBlock('C9', getBlockHouses('C9'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers, highlightedId)}
                {renderBlock('C10', getBlockHouses('C10'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers, highlightedId)}
            </div>
            <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                {renderBlock('C11', getBlockHouses('C11'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers, highlightedId)}
                {renderBlock('C12', getBlockHouses('C12'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers, highlightedId)}
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
  const [activeLayers, setActiveLayers] = useState<string[]>(['Security', 'Social', 'Financial', 'Facility']);
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

  const filteredHouses = useMemo(() => {
    if (!searchQuery) return houses;
    const query = searchQuery.toLowerCase();
    return houses.filter(h => {
      const fullHouseId = `${h.block}-${h.number}`.toLowerCase();
      const fullHouseIdNoDash = `${h.block}${h.number}`.toLowerCase();
      
      return h.number.toLowerCase().includes(query) || 
             h.headOfFamily.toLowerCase().includes(query) ||
             h.block.toLowerCase().includes(query) ||
             fullHouseId.includes(query) ||
             fullHouseIdNoDash.includes(query);
    });
  }, [houses, searchQuery]);

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
                  { id: 'Facility', label: 'Fasilitas', desc: 'Masjid, Lapangan, Balai' }
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
                  <div className="w-3 h-3 rounded-full bg-red-600 flex items-center justify-center shadow-sm shadow-red-200"><Flame size={8} className="text-white"/></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Titik APAR</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-600 flex items-center justify-center shadow-sm shadow-green-200"><Users size={8} className="text-white"/></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Titik Kumpul</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-teal-500 flex items-center justify-center shadow-sm shadow-teal-200"><ArrowRight size={8} className="text-white"/></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Jalur Evakuasi</span>
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
                            renderBlock={(code, bHouses = [], bReports = [], bOfficials = [], bIsAdmin = false, bIuran = [], bAlerts = [], bOnSelect = () => {}, bHeatmap = false, bLayers = [], bHighlight = null) => (
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
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-500"></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Tetap</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-500"></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Kontrak</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-cyan-100 border border-cyan-500"></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Kost</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-100 border border-slate-300 border-dashed"></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Kosong</span></div>
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
                              if (point.type === 'CCTV' && !activeLayers.includes('Security')) return null;
                              if (point.type === 'PJU' && !activeLayers.includes('Security')) return null;
                              if (point.type === 'Hydrant' && !activeLayers.includes('Security')) return null;
                              if (point.type === 'APAR' && !activeLayers.includes('Security')) return null;
                              if (point.type === 'Security' && !activeLayers.includes('Security')) return null;
                              if (point.type === 'Trash' && !activeLayers.includes('Social')) return null;
                              if (point.type === 'Facility' && !activeLayers.includes('Facility')) return null;

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
                                      point.type === 'APAR' ? 'bg-red-600' :
                                      point.type === 'AssemblyPoint' ? 'bg-green-600' :
                                      point.type === 'EvacuationRoute' ? 'bg-teal-500' :
                                      point.type === 'Trash' ? 'bg-orange-500' :
                                      point.type === 'Facility' ? 'bg-purple-600' :
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
      {selectedHouse && (
        <HouseDetailModal 
          house={selectedHouse} 
          onClose={() => setSelectedHouse(null)} 
          reports={reports} 
          isAdmin={isAdmin} 
          officials={officials} 
          iuranPayments={iuranPayments} 
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
