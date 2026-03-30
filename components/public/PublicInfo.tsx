import React, { useState, useEffect } from 'react';
import { Wallet, ShieldCheck, Shield, ArrowUpRight, ArrowDownRight, Briefcase, Moon, Users, Home, Phone, CheckCircle, AlertTriangle, Target, Lightbulb, TrendingUp, Calendar, MapPin, Megaphone, Clock, Map as MapIcon, CheckCircle2, Image, HelpCircle, ArrowLeftRight, User, MessageSquare, Heart, Baby, Receipt, DollarSign, AlertCircle, X } from 'lucide-react';
import { QrReader } from 'react-qr-reader';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  getIndonesianMonthYear, 
  generateMonthOptions, 
  isMonthMatch 
} from '../../src/utils/dateUtils';
import { Official, CashFlow, RondaSchedule, RondaCheckLog, House, Announcement, PatrolSession, GalleryItem, FAQItem, RondaSwapRequest, Checkpoint, PaymentStatus } from '../../types';
import { addRondaLog, startPatrolSession, visitCheckpoint, finishPatrolSession, subscribeToActivePatrols, addRondaSwapRequest, subscribeToCheckpoints, getHouseDisplayLabel } from '../../services/databaseService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { EmergencyContacts } from './EmergencyContacts';
import { PublicRules } from './PublicRules';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { useFinancial } from '../../context/FinancialContext';
import { toast } from 'sonner';

interface PublicInfoProps {
  officials: Official[];
  cashFlow: CashFlow[];
  ronda: RondaSchedule[];
  rondaLogs: RondaCheckLog[];
  rondaSwapRequests: RondaSwapRequest[];
  houses: House[];
  announcements: Announcement[];
  galleryItems: GalleryItem[];
  faqItems: FAQItem[];
  activePatrol: PatrolSession | null;
}

export const PublicInfo: React.FC<PublicInfoProps> = ({ officials, cashFlow, ronda, rondaLogs, rondaSwapRequests, houses, announcements, galleryItems, faqItems, activePatrol }) => {
    const { summaries, getPaymentStatus, selectedMonth, setSelectedMonth } = useFinancial();
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search');

    const totalIncome = cashFlow.filter(c => c.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = cashFlow.filter(c => c.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    const currentBalance = totalIncome - totalExpense;
    
    // Statistics
    const totalResidents = houses.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + h.occupants, 0);
    const totalHouseholds = houses.filter(h => h.status === 'Occupied').length;
    const occupancyRate = Math.round((totalHouseholds / houses.length) * 100);

    // Detailed Statistics
    const occupiedCount = houses.filter(h => h.status === 'Occupied').length;
    const emptyCount = houses.filter(h => h.status === 'Empty').length;
    const businessCount = houses.filter(h => h.status === 'Business').length;

    const tetapCount = houses.filter(h => h.residenceType === 'Tetap').length;
    const kontrakCount = houses.filter(h => h.residenceType === 'Kontrak').length;
    const kostCount = houses.filter(h => h.residenceType === 'Kost').length;

    const pregnantTotal = houses.reduce((acc, h) => acc + (h.pregnantCount || 0), 0);
    const babyTotal = houses.reduce((acc, h) => acc + (h.babyCount || 0), 0);
    const toddlerTotal = houses.reduce((acc, h) => acc + (h.toddlerCount || 0), 0);
    const elderlyTotal = houses.reduce((acc, h) => acc + (h.elderlyCount || 0), 0);
    const vehicleTotal = houses.reduce((acc, h) => acc + (h.vehicleCount || 0), 0);
    const pkhTotal = houses.filter(h => h.isPKH).length;
    const bltTotal = houses.filter(h => h.isBLT).length;
    const bansosTotal = houses.filter(h => h.isPKH || h.isBLT || h.isBansosLain).length;

    const maleTotal = houses.filter(h => h.status === 'Occupied' && h.gender === 'Laki-laki').length;
    const femaleTotal = houses.filter(h => h.status === 'Occupied' && h.gender === 'Perempuan').length;
    // Note: gender in House is for Head of Family. For all residents we'd need familyMembers but let's use what we have.
    
    const totalPatrols = rondaLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return logDate >= thirtyDaysAgo;
    }).length;

    // Financial Chart Data
    const expenseCategories = cashFlow
        .filter(c => c.type === 'Expense')
        .reduce((acc: any, curr) => {
            const cat = curr.category || 'Lainnya';
            acc[cat] = (acc[cat] || 0) + curr.amount;
            return acc;
        }, {});

    const pieData = Object.keys(expenseCategories).map(name => ({
        name,
        value: expenseCategories[name]
    }));

    const COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

    // Monthly Trend Data
    const monthlyTrend = cashFlow.reduce((acc: any, curr) => {
        const date = new Date(curr.date);
        const month = date.toLocaleString('id-ID', { month: 'short' });
        if (!acc[month]) acc[month] = { month, income: 0, expense: 0 };
        if (curr.type === 'Income') acc[month].income += curr.amount;
        else acc[month].expense += curr.amount;
        return acc;
    }, {});

    const trendData = Object.values(monthlyTrend);

    const upcomingEvents = announcements
        .filter(a => a.type === 'Event' && new Date(a.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

    const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const roleHierarchy = ['Ketua RT', 'Sekretaris', 'Bendahara', 'Bendahara RW', 'Koord. Keamanan', 'Seksi'];
    const sortedOfficials = [...officials].sort((a, b) => { 
        const indexA = roleHierarchy.findIndex(r => a.role.includes(r)); 
        const indexB = roleHierarchy.findIndex(r => b.role.includes(r)); 
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB); 
    });

    const airManager = officials.find(o => o.role.toLowerCase().includes('air'));
    const sampahManager = officials.find(o => o.role.toLowerCase().includes('sampah') || o.role.toLowerCase().includes('kebersihan'));

    const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
    const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
    const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isOfficialModalOpen, setIsOfficialModalOpen] = useState(false);
    const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [checkLocation, setCheckLocation] = useState('');
    const [checkOfficer, setCheckOfficer] = useState('');
    const [checkPin, setCheckPin] = useState('');
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    // activePatrol is now a prop

    useEffect(() => {
        const unsubscribe = subscribeToCheckpoints((data) => {
            setCheckpoints(data);
        });
        return () => unsubscribe();
    }, []);

    // Status Check State
    const [statusSearchId, setStatusSearchId] = useState(initialSearch || '');
    const [foundHouse, setFoundHouse] = useState<House | null>(null);

    useEffect(() => {
        if (initialSearch) {
            const house = houses.find(h => h.id.toLowerCase() === initialSearch.toLowerCase());
            if (house) {
                setFoundHouse(house);
                setIsStatusModalOpen(true);
            }
        }
    }, [initialSearch, houses]);

    // Swap Request Form State
    const [swapRequester, setSwapRequester] = useState('');
    const [swapHouseId, setSwapHouseId] = useState('');
    const [swapFromDay, setSwapFromDay] = useState('');
    const [swapToDay, setSwapToDay] = useState('');
    const [swapReason, setSwapReason] = useState('');
    const [isSubmittingSwap, setIsSubmittingSwap] = useState(false);

    // useEffect for activePatrol removed as it is now passed as prop

    const handleStartPatrol = async () => {
        if (!checkOfficer) { 
            toast.error("Nama petugas wajib diisi!"); 
            return; 
        }
        if (!checkPin) { 
            toast.error("PIN wajib diisi!"); 
            return; 
        }
        
        // Find house/resident by name to verify PIN
        // In a real app, this would be a secure backend check
        const resident = houses.find(h => h.headOfFamily.toLowerCase() === checkOfficer.toLowerCase());
        
        if (!resident) {
            toast.error("Nama petugas tidak ditemukan dalam data warga.");
            return;
        }

        if (resident.accessCode !== checkPin) {
            toast.error("PIN salah! Silakan coba lagi.");
            return;
        }

        await startPatrolSession(checkOfficer);
        setIsCheckModalOpen(false);
        setCheckPin(''); // Reset PIN
    };

    const handleFinishPatrol = async () => {
        if (!activePatrol) return;
        if (activePatrol.visitedCheckpoints.length < checkpoints.length) {
            toast.warning("Patroli belum selesai!", {
                description: "Kunjungi semua titik sebelum menyelesaikan patroli."
            });
            return;
        }
        await finishPatrolSession(activePatrol.id);
        setIsCheckModalOpen(false);
    };
    
    const handleCheckSubmit = async (type: 'Start' | 'End' | 'Report', status: 'Aman' | 'Mencurigakan' | 'Insiden', note?: string) => {
        if (!checkOfficer || !checkLocation) { 
            toast.error("Nama petugas dan lokasi wajib diisi!"); 
            return; 
        }
        
        const photoUrl = (window as any).tempPhoto;
        (window as any).tempPhoto = null; // Clear temp storage

        const newLog: any = {
            officerName: checkOfficer,
            location: checkLocation,
            type,
            status,
            timestamp: new Date().toISOString(),
            note: note || (status === 'Aman' ? 'Kondisi aman terkendali.' : 'Perlu pemantauan lebih lanjut.'),
            photoUrl
        };
        await addRondaLog(newLog);
        toast.success(`Laporan patroli (${type} - ${status}) tercatat!`);
        setIsCheckModalOpen(false);
        setCheckLocation('');
    };

    const handleSwapSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!swapRequester || !swapHouseId || !swapFromDay || !swapToDay) {
            toast.error("Mohon lengkapi semua data permintaan!");
            return;
        }

        setIsSubmittingSwap(true);
        try {
            await addRondaSwapRequest({
                requesterName: swapRequester,
                requesterHouseId: swapHouseId,
                fromDay: swapFromDay,
                toDay: swapToDay,
                reason: swapReason,
                status: 'Pending',
                timestamp: new Date().toISOString()
            });
            toast.success("Permintaan tukar jadwal berhasil dikirim!", {
                description: "Admin akan segera meninjau permintaan Anda."
            });
            setIsSwapModalOpen(false);
            setSwapRequester('');
            setSwapHouseId('');
            setSwapFromDay('');
            setSwapToDay('');
            setSwapReason('');
        } catch (error) {
            console.error("Error submitting swap request:", error);
            toast.error("Gagal mengirim permintaan. Silakan coba lagi.");
        } finally {
            setIsSubmittingSwap(false);
        }
    };

    const handleCheckStatus = (e: React.FormEvent) => {
        e.preventDefault();
        const house = houses.find(h => h.id.toLowerCase() === statusSearchId.toLowerCase());
        if (house) {
            setFoundHouse(house);
        } else {
            toast.error("No. Rumah tidak ditemukan.", {
                description: "Pastikan format benar (Contoh: A1-01)"
            });
            setFoundHouse(null);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };
    
    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto px-4 py-8 mb-24 space-y-12"
        >
            {/* Hero Section */}
            <motion.div variants={itemVariants} className="relative rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl shadow-slate-900/20 min-h-[400px] flex items-center justify-center text-center px-6 py-12 group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900"></div>
                
                <div className="relative z-10 max-w-4xl mx-auto space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-widest uppercase backdrop-blur-md animate-pulse">
                        <ShieldCheck size={14} /> Transparansi & Akuntabilitas
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
                        Wajah Baru <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">RT 02</span>
                    </h1>
                    <p className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium drop-shadow-md">
                        Mewujudkan lingkungan yang aman, nyaman, dan harmonis melalui digitalisasi layanan dan keterbukaan informasi.
                    </p>
                    <div className="flex justify-center gap-4 pt-4">
                        <Link to="/services?tab=surat" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                            <Briefcase size={18} /> Layanan Warga
                        </Link>
                        <Link to="/peta" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold text-sm transition-all backdrop-blur-sm flex items-center gap-2">
                            <MapIcon size={18} /> Peta Wilayah
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Emergency Contacts & Events */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Emergency Contacts */}
                <motion.div variants={itemVariants} className="lg:col-span-2 h-full">
                    <EmergencyContacts />
                </motion.div>

                {/* Upcoming Events */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Calendar size={24}/></div>
                            Agenda Kegiatan
                        </h2>
                        <Link to="/" className="text-xs font-bold text-indigo-600 hover:underline uppercase tracking-wider">Lihat Semua</Link>
                    </div>
                    
                    {upcomingEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upcomingEvents.map((event) => (
                                <div key={event.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10">
                                        <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wide mb-3">
                                            {new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <h3 className="text-lg font-black text-slate-800 mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors">{event.title}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-2 mb-4">{event.content}</p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                            <Clock size={14} />
                                            <span>08:00 WIB</span>
                                            <span className="mx-1">•</span>
                                            <MapPin size={14} />
                                            <span>Balai Warga</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Tidak Ada Agenda</h3>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">Belum ada kegiatan atau acara yang dijadwalkan dalam waktu dekat.</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* News & Announcements Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pengumuman (Urgent) */}
                <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><AlertTriangle size={24}/></div>
                        <h2 className="text-2xl font-black text-slate-800">Pengumuman Penting</h2>
                    </div>
                    <div className="space-y-4">
                        {announcements.filter(a => a.type === 'Urgent').map(a => (
                            <div key={a.id} onClick={() => setSelectedAnnouncement(a)} className="p-6 bg-rose-50 rounded-3xl border border-rose-100 hover:border-rose-200 transition-colors group cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-rose-100 text-rose-700">Penting</span>
                                    <span className="text-xs font-bold text-rose-400">{new Date(a.date).toLocaleDateString('id-ID')}</span>
                                </div>
                                <h4 className="font-black text-slate-800 text-lg group-hover:text-rose-700 transition-colors">{a.title}</h4>
                            </div>
                        ))}
                        {announcements.filter(a => a.type === 'Urgent').length === 0 && (
                            <p className="text-sm text-slate-400 italic">Tidak ada pengumuman penting saat ini.</p>
                        )}
                    </div>
                </motion.div>

                {/* Berita & Kegiatan (General/Event) */}
                <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Megaphone size={24}/></div>
                        <h2 className="text-2xl font-black text-slate-800">Berita & Kegiatan</h2>
                    </div>
                    <div className="space-y-4">
                        {announcements.filter(a => a.type !== 'Urgent').map(a => (
                            <div key={a.id} onClick={() => setSelectedAnnouncement(a)} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-100 transition-colors group cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${a.type === 'Event' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {a.type}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">{new Date(a.date).toLocaleDateString('id-ID')}</span>
                                </div>
                                <h4 className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{a.title}</h4>
                                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{a.content}</p>
                            </div>
                        ))}
                        {announcements.filter(a => a.type !== 'Urgent').length === 0 && (
                            <p className="text-sm text-slate-400 italic">Tidak ada berita atau kegiatan saat ini.</p>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Rules Section */}
            <motion.div variants={itemVariants}>
                <PublicRules />
            </motion.div>

            {/* Digital Services Section */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Link to="/kegiatan" className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Calendar size={120} />
                    </div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <CheckCircle2 size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 mb-1">Presensi Kegiatan</h3>
                            <p className="text-slate-500 text-sm font-medium">Digital Guest Book & Absensi QR Code untuk setiap kegiatan warga.</p>
                        </div>
                    </div>
                </Link>
                <Link to="/kesehatan" className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Heart size={120} />
                    </div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
                            <Baby size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 mb-1">Posyandu Digital</h3>
                            <p className="text-slate-500 text-sm font-medium">Monitoring kesehatan Bayi, Balita, Remaja, Dewasa, Ibu Hamil, dan Lansia secara digital.</p>
                        </div>
                    </div>
                </Link>

                <Link to="/forum" className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <MessageSquare size={120} />
                    </div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="p-4 bg-amber-50 text-amber-600 rounded-3xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <Lightbulb size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 mb-1">Musyawarah Digital</h3>
                            <p className="text-slate-500 text-sm font-medium">Sampaikan ide, usulan, dan aspirasi Anda untuk kemajuan RT 02 secara terbuka.</p>
                        </div>
                    </div>
                </Link>

                <Link to="/donasi" className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={120} />
                    </div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Heart size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 mb-1">Donasi Sosial</h3>
                            <p className="text-slate-500 text-sm font-medium">Salurkan bantuan sosial, kas kematian, dan donasi darurat untuk warga yang membutuhkan.</p>
                        </div>
                    </div>
                </Link>
            </motion.div>

            {/* Bansos & Vulnerable Groups Section */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><Users size={24}/></div>
                            Manajemen Bansos & Kelompok Rentan
                        </h2>
                        <p className="text-slate-500 font-medium">Informasi penerima bantuan dan perlindungan warga rentan</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><ShieldCheck size={20}/></div>
                            <h3 className="font-black text-slate-800">Penerima Bansos</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">PKH (Program Keluarga Harapan)</span>
                                <span className="font-bold text-slate-800">{houses.filter(h => h.isPKH).length} KK</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">BLT (Bantuan Langsung Tunai)</span>
                                <span className="font-bold text-slate-800">{houses.filter(h => h.isBLT).length} KK</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Bantuan Pangan Non-Tunai</span>
                                <span className="font-bold text-slate-800">{houses.filter(h => h.isBPNT).length} KK</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><Heart size={20}/></div>
                            <h3 className="font-black text-slate-800">Kelompok Rentan</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Lansia (60+ Tahun)</span>
                                <span className="font-bold text-slate-800">{houses.reduce((acc, h) => acc + (h.elderlyCount || 0), 0)} Jiwa</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Penyandang Disabilitas</span>
                                <span className="font-bold text-slate-800">{houses.reduce((acc, h) => acc + (h.disabilityCount || 0), 0)} Jiwa</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Anak Yatim/Piatu</span>
                                <span className="font-bold text-slate-800">{houses.reduce((acc, h) => acc + (h.orphanCount || 0), 0)} Jiwa</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Target size={20}/></div>
                            <h3 className="font-black text-slate-800">Status Ekonomi</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Keluarga Pra-Sejahtera</span>
                                <span className="font-bold text-slate-800">{houses.filter(h => h.economicStatus === 'Pra-Sejahtera').length} KK</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Keluarga Sejahtera</span>
                                <span className="font-bold text-slate-800">{houses.filter(h => h.economicStatus === 'Sejahtera').length} KK</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Keluarga Mampu</span>
                                <span className="font-bold text-slate-800">{houses.filter(h => h.economicStatus === 'Mampu').length} KK</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex flex-col md:flex-row items-center gap-6">
                    <div className="p-4 bg-white text-indigo-600 rounded-2xl shadow-sm">
                        <AlertCircle size={32} />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-800 mb-1">Butuh Bantuan atau Ingin Melapor?</h4>
                        <p className="text-slate-600 text-sm">Jika Anda atau tetangga Anda membutuhkan bantuan sosial darurat atau belum terdata, silakan hubungi pengurus RT melalui fitur Lapor.</p>
                    </div>
                    <Link to="/lapor" className="ml-auto px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-colors whitespace-nowrap">
                        Lapor Sekarang
                    </Link>
                </div>
            </motion.div>

            {/* Financial Report */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={24}/></div>
                            Transparansi Keuangan
                        </h2>
                        <p className="text-slate-500 font-medium">Visualisasi alokasi dana dan tren kas RT 02</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Alokasi Pengeluaran</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => `Rp ${value.toLocaleString()}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {pieData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-[10px] font-bold text-slate-600 truncate">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Tren Arus Kas Bulanan</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} tickFormatter={(value) => `Rp ${value/1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => `Rp ${value.toLocaleString()}`}
                                    />
                                    <Area type="monotone" dataKey="income" stroke="#6366f1" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={0} strokeWidth={3} strokeDasharray="5 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                                <span className="text-[10px] font-bold text-slate-600">Pemasukan</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                <span className="text-[10px] font-bold text-slate-600">Pengeluaran</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Gallery */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Image size={24}/></div>
                    <h2 className="text-2xl font-black text-slate-800">Galeri Kegiatan</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {galleryItems.map(g => (
                        <div key={g.id} className="group relative aspect-square rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                            <img src={g.image} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <p className="text-white font-bold text-sm">{g.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* FAQ */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><HelpCircle size={24}/></div>
                    <h2 className="text-2xl font-black text-slate-800">Pertanyaan Umum (FAQ)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {faqItems.map(f => (
                        <div key={f.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <h4 className="font-black text-slate-800 text-sm mb-2">{f.question}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{f.answer}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Vision & Mission */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                        <Target size={180} />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                            <Target size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-4">Visi Kami</h2>
                        <p className="text-slate-600 leading-relaxed">
                            "Menjadikan RT 02 sebagai lingkungan hunian yang mandiri, aman, dan guyub rukun berbasis teknologi informasi serta gotong royong dengan semangat <strong>TERAS RT 02 : Teknologi • Ekraf • Rukun • Aman • Sinergi</strong>."
                        </p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                        <Lightbulb size={180} />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                            <Lightbulb size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-4">Misi Utama</h2>
                        <ul className="space-y-3 text-slate-600">
                            <li className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                <span><strong>Teknologi:</strong> Digitalisasi pelayanan administrasi warga.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                <span><strong>Ekraf:</strong> Pengembangan Ekonomi Kreatif warga.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                <span><strong>Rukun:</strong> Mempererat tali silaturahmi dan gotong royong.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                <span><strong>Aman:</strong> Peningkatan keamanan lingkungan terpadu (Siskamling).</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                <span><strong>Sinergi:</strong> Transparansi pengelolaan dana sosial dan pembangunan.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </motion.div>

            {/* Key Statistics & Status Check */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><TrendingUp size={24}/></div>
                        <h2 className="text-2xl font-bold text-slate-800">Statistik Lingkungan</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Penduduk</p>
                            <h3 className="text-3xl font-black text-slate-800">{totalResidents}</h3>
                            <p className="text-xs text-slate-400 mt-1">Jiwa</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Kepala Keluarga</p>
                            <h3 className="text-3xl font-black text-slate-800">{totalHouseholds}</h3>
                            <p className="text-xs text-slate-400 mt-1">KK Terdaftar</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Unit Rumah</p>
                            <h3 className="text-3xl font-black text-slate-800">{houses.length}</h3>
                            <p className="text-xs text-slate-400 mt-1">Total Unit</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Okupansi</p>
                            <h3 className="text-3xl font-black text-emerald-600">{occupancyRate}%</h3>
                            <p className="text-xs text-slate-400 mt-1">Tingkat Hunian</p>
                        </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Home size={12} /> Status Hunian
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-600">Dihuni</span>
                                    <span className="text-xs font-black text-blue-600">{occupiedCount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-600">Kosong</span>
                                    <span className="text-xs font-black text-slate-400">{emptyCount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-600">Usaha</span>
                                    <span className="text-xs font-black text-purple-600">{businessCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Users size={12} /> Jenis Tinggal
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-600">Milik Sendiri</span>
                                    <span className="text-xs font-black text-indigo-600">{tetapCount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-600">Kontrak/Sewa</span>
                                    <span className="text-xs font-black text-amber-600">{kontrakCount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-600">Kost</span>
                                    <span className="text-xs font-black text-cyan-600">{kostCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Heart size={12} /> Kelompok Khusus
                            </h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500">Ibu Hamil</span>
                                    <span className="text-xs font-black text-pink-600">{pregnantTotal}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500">Bayi</span>
                                    <span className="text-xs font-black text-blue-500">{babyTotal}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500">Balita</span>
                                    <span className="text-xs font-black text-emerald-500">{toddlerTotal}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500">Lansia</span>
                                    <span className="text-xs font-black text-orange-500">{elderlyTotal}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Users size={12} /> Demografi & Bantuan Sosial
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Laki-laki</p>
                                    <p className="text-lg font-black text-slate-700">{maleTotal} <span className="text-[10px] font-normal text-slate-400">KK</span></p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Perempuan</p>
                                    <p className="text-lg font-black text-slate-700">{femaleTotal} <span className="text-[10px] font-normal text-slate-400">KK</span></p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Penerima PKH</p>
                                    <p className="text-lg font-black text-emerald-600">{pkhTotal} <span className="text-[10px] font-normal text-slate-400">Unit</span></p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Penerima BLT</p>
                                    <p className="text-lg font-black text-blue-600">{bltTotal} <span className="text-[10px] font-normal text-slate-400">Unit</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Shield size={12} /> Keamanan & Fasilitas
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Patroli (30hr)</p>
                                    <p className="text-lg font-black text-indigo-600">{totalPatrols} <span className="text-[10px] font-normal text-slate-400">Kali</span></p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Kendaraan</p>
                                    <p className="text-lg font-black text-slate-700">{vehicleTotal} <span className="text-[10px] font-normal text-slate-400">Unit</span></p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Status Keamanan</p>
                                    <p className="text-lg font-black text-emerald-600">Aman</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1 bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><CheckCircle2 size={120} /></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black mb-2">Cek Status Iuran Mandiri</h3>
                        <p className="text-xs text-indigo-100 mb-6 font-medium">Verifikasi status pembayaran iuran air dan sampah rumah Anda secara mandiri.</p>
                        <form onSubmit={handleCheckStatus} className="space-y-3">
                            <input 
                                type="text" 
                                placeholder="No. Rumah (Contoh: A1-01)" 
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-bold placeholder:text-indigo-200 outline-none focus:bg-white/20 transition-all"
                                value={statusSearchId}
                                onChange={e => setStatusSearchId(e.target.value)}
                            />
                            <button type="submit" className="w-full py-3 bg-white text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg">
                                Periksa Sekarang
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>

            {/* Air Dues Summary */}
            <motion.div variants={itemVariants}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><Receipt size={24}/></div>
                        <h2 className="text-2xl font-bold text-slate-800">Ringkasan Iuran Air</h2>
                    </div>
                    {airManager && (
                        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                            <User size={14} className="text-blue-600" />
                            <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Pengurus: {airManager.name}</p>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign size={80}/></div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Terkumpul (Air)</p>
                        <h3 className="text-3xl font-black text-slate-800">Rp {summaries.air.totalCollected.toLocaleString()}</h3>
                        <p className="text-[10px] text-blue-600 font-bold mt-2 flex items-center gap-1">
                            <CheckCircle size={12}/> Bulan Berjalan
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Users size={80}/></div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Belum Bayar (Air)</p>
                        <h3 className="text-3xl font-black text-rose-600">{summaries.air.unpaidCount}</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-2">Rumah / KK</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={80}/></div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Estimasi Piutang (Air)</p>
                        <h3 className="text-3xl font-black text-blue-600">Rp {summaries.air.estimatedReceivables.toLocaleString()}</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-2">Bulan Berjalan</p>
                    </div>
                </div>
            </motion.div>

            {/* Sampah Dues Summary */}
            <motion.div variants={itemVariants}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600"><Receipt size={24}/></div>
                        <h2 className="text-2xl font-bold text-slate-800">Ringkasan Iuran Sampah</h2>
                    </div>
                    {sampahManager && (
                        <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
                            <User size={14} className="text-orange-600" />
                            <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Pengurus: {sampahManager.name}</p>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign size={80}/></div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Terkumpul (Sampah)</p>
                        <h3 className="text-3xl font-black text-slate-800">Rp {summaries.sampah.totalCollected.toLocaleString()}</h3>
                        <p className="text-[10px] text-orange-600 font-bold mt-2 flex items-center gap-1">
                            <CheckCircle size={12}/> Bulan Berjalan
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Users size={80}/></div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Belum Bayar (Sampah)</p>
                        <h3 className="text-3xl font-black text-rose-600">{summaries.sampah.unpaidCount}</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-2">Rumah / KK</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={80}/></div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Estimasi Piutang (Sampah)</p>
                        <h3 className="text-3xl font-black text-orange-600">Rp {summaries.sampah.estimatedReceivables.toLocaleString()}</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-2">Bulan Berjalan</p>
                    </div>
                </div>
            </motion.div>

            {/* Total Arrears Summary */}
            <motion.div variants={itemVariants} className="mb-12">
                <div className="bg-amber-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-amber-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><AlertTriangle size={120}/></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-200 mb-2">Informasi Tunggakan</p>
                            <h3 className="text-3xl font-black tracking-tight">Total Tunggakan Kolektif</h3>
                            <p className="text-sm text-amber-100 font-medium mt-2">Akumulasi iuran air & sampah yang belum terbayar dari periode sebelumnya.</p>
                        </div>
                        <div className="text-right space-y-2">
                            <h3 className="text-4xl font-black">Rp {summaries.totalArrearsAmount.toLocaleString()}</h3>
                            <div className="flex flex-col items-end gap-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-100">Air: {summaries.air.arrearsHouseCount} Unit Rumah (Rp {summaries.air.totalArrearsAmount.toLocaleString()})</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-100">Sampah: {summaries.sampah.arrearsHouseCount} Unit Rumah (Rp {summaries.sampah.totalArrearsAmount.toLocaleString()})</p>
                            </div>
                            <p className="text-[10px] font-bold text-amber-200 uppercase tracking-widest">{summaries.totalArrearsHouseCount} Total Rumah Tertunggak</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Financial Report */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={200}/></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <p className="text-slate-400 font-medium text-sm uppercase tracking-wider mb-1">Laporan Keuangan</p>
                                <h2 className="text-3xl font-black text-white">Kas RT 02</h2>
                            </div>
                            <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-500/30">
                                Update: {new Date().toLocaleDateString('id-ID', {month: 'long', year: 'numeric'})}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                                <p className="text-slate-400 text-xs font-bold uppercase mb-2">Saldo Saat Ini</p>
                                <h3 className="text-3xl font-black text-white">Rp {currentBalance.toLocaleString()}</h3>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                                    <div className="p-1 bg-emerald-500/20 rounded-full"><ArrowUpRight size={12}/></div>
                                    <p className="text-xs font-bold uppercase">Pemasukan</p>
                                </div>
                                <h3 className="text-2xl font-black text-white">Rp {totalIncome.toLocaleString()}</h3>
                            </div>
                            <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2 text-rose-400">
                                    <div className="p-1 bg-rose-500/20 rounded-full"><ArrowDownRight size={12}/></div>
                                    <p className="text-xs font-bold uppercase">Pengeluaran</p>
                                </div>
                                <h3 className="text-2xl font-black text-white">Rp {totalExpense.toLocaleString()}</h3>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Riwayat Transaksi Terakhir</h4>
                                <button onClick={() => setIsFinanceModalOpen(true)} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest">Detail Lengkap</button>
                            </div>
                            <div className="space-y-3">
                                {cashFlow.slice(0, 3).map((flow) => (
                                    <div key={flow.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${flow.type === 'Income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                {flow.type === 'Income' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white">{flow.description}</p>
                                                <p className="text-xs text-slate-400">{new Date(flow.date).toLocaleDateString('id-ID')}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-sm ${flow.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {flow.type === 'Income' ? '+' : '-'} Rp {flow.amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Security Schedule */}
                <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-slate-400 font-medium text-xs uppercase tracking-wider mb-1">Jadwal Siskamling</p>
                            <h2 className="text-2xl font-black text-slate-800">Minggu Ini</h2>
                        </div>
                        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
                            <Moon size={24} />
                        </div>
                    </div>
                    
                    {activePatrol && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ShieldCheck size={48} className="text-emerald-600"/>
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        Patroli Aktif
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-500 bg-white/50 px-2 py-0.5 rounded-full">
                                        {new Date(activePatrol.startTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <p className="font-bold text-slate-800 text-sm mb-3">{activePatrol.officerName}</p>
                                <div className="w-full bg-emerald-200 rounded-full h-1.5 mb-1">
                                    <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(activePatrol.visitedCheckpoints.length / checkpoints.length) * 100}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-medium text-emerald-600">
                                    <span>Progress</span>
                                    <span>{activePatrol.visitedCheckpoints.length} / {checkpoints.length} Titik</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex flex-col gap-2 mb-6">
                        <button onClick={() => { setIsCheckModalOpen(true); }} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                            <ShieldCheck size={18} /> Mulai Ronda
                        </button>
                        <button onClick={() => { setIsSwapModalOpen(true); }} className="w-full py-3 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                            <ArrowLeftRight size={18} /> Tukar Jadwal
                        </button>
                        <button onClick={() => { setIsCheckModalOpen(true); }} className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2">
                            <AlertTriangle size={18} /> Lapor Kejadian
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                        {ronda.map((schedule, idx) => {
                            const isToday = schedule.day === new Date().toLocaleDateString('id-ID', {weekday:'long'});
                            return (
                                <div key={idx} className={`p-4 rounded-2xl border transition-all ${isToday ? 'bg-indigo-50 border-indigo-100 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className={`font-black text-sm ${isToday ? 'text-indigo-700' : 'text-slate-700'}`}>{schedule.day}</h4>
                                        {isToday && <span className="px-2 py-0.5 bg-indigo-200 text-indigo-700 text-[10px] font-bold rounded-full uppercase">Hari Ini</span>}
                                    </div>
                                    
                                    {schedule.shifts ? (
                                        <div className="space-y-3">
                                            {schedule.shifts.map((shift) => (
                                                <div key={shift.id} className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Clock size={10} /> {shift.time}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {shift.members.map((member, i) => (
                                                            <span key={i} className={`text-[10px] px-2 py-1 rounded-lg font-bold ${isToday ? 'bg-white text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                                                {member}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {schedule.members.map((member, i) => (
                                                <span key={i} className={`text-xs px-2 py-1 rounded-lg font-medium ${isToday ? 'bg-white text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                                    {member}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
            
            {/* Officials Section */}
            <motion.div variants={itemVariants} className="pt-8 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600"><Users size={24}/></div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Struktur Pengurus RT</h2>
                        <p className="text-sm text-slate-500">Periode Jabatan 2023 - 2026</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedOfficials.map(o => (
                        <div 
                            key={o.id} 
                            onClick={() => { setSelectedOfficial(o); setIsOfficialModalOpen(true); }}
                            className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer"
                        >
                            <div className={`h-24 relative ${o.role.includes('Ketua') ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-slate-800'}`}>
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            </div>
                            <div className="px-6 pb-6 text-center -mt-12 relative">
                                <div className="inline-block p-1.5 bg-white rounded-full shadow-lg">
                                    <img src={o.photo||`https://ui-avatars.com/api/?name=${o.name}&background=random&size=128`} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 bg-slate-100" alt={o.name}/>
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg mt-3">{o.name}</h3>
                                <div className="mt-1 mb-4">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${o.role.includes('Ketua') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                        {o.role}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-2 text-left">
                                    <div className="bg-slate-50 p-2 rounded-xl">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Domisili</p>
                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1"><Home size={10}/> {getHouseDisplayLabel(o.houseId, houses)}</p>
                                    </div>
                                    <div className="bg-green-50 p-2 rounded-xl">
                                        <p className="text-[10px] text-green-600 font-bold uppercase">Kontak</p>
                                        <p className="text-xs font-bold text-green-700 flex items-center gap-1"><Phone size={10}/> WhatsApp</p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover:underline">Lihat Profil Lengkap</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        
            <Modal isOpen={isOfficialModalOpen} onClose={() => setIsOfficialModalOpen(false)} title="Profil Pengurus RT" maxWidth="max-w-2xl">
                {selectedOfficial && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                            <img 
                                src={selectedOfficial.photo || `https://ui-avatars.com/api/?name=${selectedOfficial.name}&background=random&size=128`} 
                                className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-white shrink-0" 
                                alt={selectedOfficial.name}
                            />
                            <div className="text-center sm:text-left">
                                <h3 className="text-xl font-black text-slate-800">{selectedOfficial.name}</h3>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                                        {selectedOfficial.role}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">{getHouseDisplayLabel(selectedOfficial.houseId, houses)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kontak Personil</p>
                                <div className="space-y-3">
                                    <a href={`https://wa.me/${selectedOfficial.phone}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                                        <div className="p-2 bg-emerald-50 rounded-lg shrink-0"><Phone size={14}/></div>
                                        <span className="truncate">{selectedOfficial.phone}</span>
                                    </a>
                                    {selectedOfficial.email && (
                                        <a href={`mailto:${selectedOfficial.email}`} className="flex items-center gap-3 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                                            <div className="p-2 bg-indigo-50 rounded-lg shrink-0"><MessageSquare size={14}/></div>
                                            <span className="truncate" title={selectedOfficial.email}>{selectedOfficial.email}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Masa Jabatan</p>
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400 shrink-0"><Calendar size={14}/></div>
                                    <span>{selectedOfficial.termStart ? new Date(selectedOfficial.termStart).getFullYear() : '2023'} - {selectedOfficial.termEnd ? new Date(selectedOfficial.termEnd).getFullYear() : '2026'}</span>
                                </div>
                            </div>
                        </div>

                        {selectedOfficial.duties && selectedOfficial.duties.length > 0 && (
                            <div className="p-5 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10"><Target size={80}/></div>
                                <div className="relative z-10">
                                    <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Lightbulb size={14} /> Tugas & Tanggung Jawab
                                    </h4>
                                    <ul className="space-y-3">
                                        {selectedOfficial.duties.map((duty, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm font-medium text-indigo-50">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-1.5 shrink-0" />
                                                {duty}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button onClick={() => setIsOfficialModalOpen(false)} className="sm:flex-1 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-none shadow-none py-3 transition-all">
                                Tutup
                            </Button>
                            <a 
                                href={`https://wa.me/${selectedOfficial.phone}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="sm:flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                            >
                                <Phone size={18} /> Hubungi via WhatsApp
                            </a>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isCheckModalOpen} onClose={() => setIsCheckModalOpen(false)} title="Laporan Patroli Digital">
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                        <p className="text-xs font-bold text-slate-500 uppercase">Waktu Check-In</p>
                        <p className="text-xl font-black text-slate-800 font-mono mt-1">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })} WITA</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-700">Nama Petugas</label>
                        <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" placeholder="Nama Anda" value={checkOfficer} onChange={e => setCheckOfficer(e.target.value)} />
                    </div>
                    {activePatrol ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-indigo-50 rounded-xl">
                                <p className="text-xs font-bold text-indigo-600 mb-1">Progress Patroli</p>
                                <div className="w-full bg-indigo-200 rounded-full h-2.5">
                                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${(activePatrol.visitedCheckpoints.length / checkpoints.length) * 100}%` }}></div>
                                </div>
                                <p className="text-xs text-indigo-800 mt-1">{activePatrol.visitedCheckpoints.length} / {checkpoints.length} Titik Tercapai</p>
                            </div>
                            <div className="w-full aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                                <QrReader
                                    constraints={{ facingMode: 'environment' }}
                                    onResult={(result, error) => {
                                        if (result) {
                                            const checkpoint = checkpoints.find(cp => cp.qrCode === result.getText());
                                            if (checkpoint) {
                                                visitCheckpoint(activePatrol.id, checkpoint.id);
                                                toast.success("Titik tercapai!", {
                                                    description: checkpoint.name
                                                });
                                            } else {
                                                toast.error("QR tidak valid!");
                                            }
                                        }
                                    }}
                                    className="w-full h-full"
                                />
                            </div>
                            <button onClick={handleFinishPatrol} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/20">
                                Selesai Patroli
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Nama Petugas</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        placeholder="Masukkan nama Anda"
                                        value={checkOfficer}
                                        onChange={(e) => setCheckOfficer(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">PIN Keamanan</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="password" 
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        placeholder="Masukkan PIN Akses"
                                        value={checkPin}
                                        onChange={(e) => setCheckPin(e.target.value)}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">* Gunakan Kode Akses Rumah Anda sebagai PIN.</p>
                            </div>
                            <button onClick={handleStartPatrol} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20">
                                Mulai Patroli Baru
                            </button>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal isOpen={isSwapModalOpen} onClose={() => setIsSwapModalOpen(false)} title="Permintaan Tukar Jadwal">
                <form onSubmit={handleSwapSubmit} className="space-y-6">
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl text-amber-600 shadow-sm"><ArrowLeftRight size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Tukar Jadwal Ronda</p>
                            <p className="text-[10px] text-amber-600 font-medium">Ajukan permohonan tukar jadwal kepada admin.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Nama Anda</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    placeholder="Nama Lengkap"
                                    value={swapRequester}
                                    onChange={e => setSwapRequester(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">No. Rumah</label>
                            <select 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                value={swapHouseId}
                                onChange={e => setSwapHouseId(e.target.value)}
                            >
                                <option value="">Pilih Rumah</option>
                                {houses.filter(h => h.status === 'Occupied').map(h => (
                                    <option key={h.id} value={h.id}>{h.id} - {h.headOfFamily}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Jadwal Asal</label>
                            <select 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                value={swapFromDay}
                                onChange={e => setSwapFromDay(e.target.value)}
                            >
                                <option value="">Pilih Hari</option>
                                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Tukar Ke Hari</label>
                            <select 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                value={swapToDay}
                                onChange={e => setSwapToDay(e.target.value)}
                            >
                                <option value="">Pilih Hari</option>
                                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Alasan (Opsional)</label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 text-slate-400" size={14} />
                            <textarea 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none h-24"
                                placeholder="Contoh: Ada acara keluarga, dinas luar kota, dll."
                                value={swapReason}
                                onChange={e => setSwapReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsSwapModalOpen(false)} className="flex-1 py-3 border-rose-200 text-rose-600 hover:bg-rose-50">Batal</Button>
                        <Button type="submit" disabled={isSubmittingSwap} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                            {isSubmittingSwap ? 'Mengirim...' : 'Kirim Permintaan'}
                        </Button>
                    </div>
                </form>
            </Modal>
            <Modal isOpen={!!selectedAnnouncement} onClose={() => setSelectedAnnouncement(null)} title={selectedAnnouncement?.title || ''}>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${selectedAnnouncement?.type === 'Event' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {selectedAnnouncement?.type}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{selectedAnnouncement && new Date(selectedAnnouncement.date).toLocaleDateString('id-ID')}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedAnnouncement?.content}</p>
                    <Button onClick={() => setSelectedAnnouncement(null)} className="w-full mt-4 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-none">Tutup</Button>
                </div>
            </Modal>

            <Modal isOpen={isFinanceModalOpen} onClose={() => setIsFinanceModalOpen(false)} title="Laporan Keuangan Detail">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Pemasukan</p>
                            <p className="text-lg font-black text-emerald-700">Rp {totalIncome.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Pengeluaran</p>
                            <p className="text-lg font-black text-rose-700">Rp {totalExpense.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {cashFlow.map((flow) => (
                            <div key={flow.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${flow.type === 'Income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {flow.type === 'Income' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-800">{flow.description}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(flow.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <span className={`font-black text-sm ${flow.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {flow.type === 'Income' ? '+' : '-'} Rp {flow.amount.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                    <Button onClick={() => setIsFinanceModalOpen(false)} className="w-full py-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-none">Tutup Laporan</Button>
                </div>
            </Modal>

            <Modal isOpen={!!foundHouse} onClose={() => setFoundHouse(null)} title={`Status Iuran: Rumah ${foundHouse?.id}`}>
                <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center flex flex-col sm:flex-row items-center sm:text-left gap-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                            <Home size={32} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-900">{foundHouse?.headOfFamily}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Blok {foundHouse?.block} No. {foundHouse?.number}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border border-slate-100 rounded-[2rem]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Bulan Tagihan</p>
                                <select 
                                    className="bg-transparent text-sm font-black text-indigo-600 outline-none cursor-pointer"
                                    value={selectedMonth}
                                    onChange={e => setSelectedMonth(e.target.value)}
                                >
                                    {generateMonthOptions(12, 36).map((m: string) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {[
                            { label: 'Iuran Air', status: foundHouse ? getPaymentStatus(foundHouse, 'Air') : PaymentStatus.PENDING },
                            { label: 'Iuran Sampah', status: foundHouse ? getPaymentStatus(foundHouse, 'Sampah') : PaymentStatus.PENDING },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                    item.status === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                }`}>
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Riwayat 6 Bulan Terakhir</p>
                        <div className="grid grid-cols-3 gap-2">
                            {Array.from({ length: 6 }).map((_, i) => {
                                const d = new Date();
                                d.setMonth(d.getMonth() - i);
                                const m = getIndonesianMonthYear(d);
                                const isPaid = foundHouse && 
                                               getPaymentStatus(foundHouse, 'Air', m) === PaymentStatus.PAID && 
                                               getPaymentStatus(foundHouse, 'Sampah', m) === PaymentStatus.PAID;
                                return (
                                    <div key={m} className={`p-2 rounded-xl border text-center ${
                                        isPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                                    }`}>
                                        <p className="text-[8px] font-black text-slate-400 uppercase truncate">{m.split(' ')[0]}</p>
                                        <div className={`mt-1 flex justify-center ${isPaid ? 'text-emerald-500' : 'text-slate-300'}`}>
                                            {isPaid ? <CheckCircle size={12} /> : <X size={12} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <p className="text-[10px] text-indigo-600 font-bold leading-relaxed">
                            * Jika terdapat ketidaksesuaian data, silakan hubungi Bendahara RT melalui menu Layanan atau WhatsApp.
                        </p>
                    </div>

                    <Button onClick={() => setFoundHouse(null)} className="w-full py-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-none">Tutup Detail</Button>
                </div>
            </Modal>
        </motion.div>
    );
};
