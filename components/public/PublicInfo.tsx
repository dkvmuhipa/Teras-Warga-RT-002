import React, { useState, useEffect } from 'react';
import { Wallet, ShieldCheck, ArrowUpRight, ArrowDownRight, Briefcase, Moon, Users, Home, CheckCircle, AlertTriangle, Target, TrendingUp, Calendar, MapPin, Megaphone, Clock, Map as MapIcon, CheckCircle2, ArrowLeftRight, User, MessageSquare, Receipt, DollarSign, X, Info, Sparkles, Zap, Droplets, Building2 } from 'lucide-react';
import { QrReader } from 'react-qr-reader';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  getIndonesianMonthYear, 
  generateMonthOptions 
} from '../../src/utils/dateUtils';
import { Official, CashFlow, RondaSchedule, RondaCheckLog, House, Announcement, PatrolSession, GalleryItem, FAQItem, RondaSwapRequest, Checkpoint, PaymentStatus, AppEvent, UMKM, Document, DonationCampaign, News, UtilityOutage } from '../../types';
import { startPatrolSession, visitCheckpoint, finishPatrolSession, addRondaSwapRequest, subscribeToCheckpoints, handleFirestoreError, OperationType, validateOfficerAccessByName, subscribeToCollection } from '../../services/databaseService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { EmergencyContacts } from './EmergencyContacts';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { useFinancial } from '../../context/FinancialContext';
import { toast } from 'sonner';
import { UtilityOutageTrackerModal } from './UtilityOutageTrackerModal';
import { generateCashFlowReportPDF } from '../../services/pdfService';
import { DEFAULT_PDF_CONFIG } from '../../constants';

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
  events: AppEvent[];
  news: News[];
  umkmData: UMKM[];
  documents: Document[];
  donationCampaigns: DonationCampaign[];
  wasteDeposits: any[];
}

export const PublicInfo: React.FC<PublicInfoProps> = ({ 
  officials, cashFlow, ronda, 
  houses, announcements, activePatrol,
  events, news
}) => {
    const { summaries, getPaymentStatus, selectedMonth, setSelectedMonth } = useFinancial();
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search');

    const totalIncome = cashFlow.filter(c => c.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = cashFlow.filter(c => c.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    const currentBalance = totalIncome - totalExpense;

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

    const totalExpenseSum = pieData.reduce((acc, curr) => acc + curr.value, 0) || 1;
    const expenseBreakdown = pieData.map((entry, index) => ({
        ...entry,
        percentage: Math.round((entry.value / totalExpenseSum) * 100),
        color: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);

    const [isDownloadingCashReport, setIsDownloadingCashReport] = useState(false);
    const handleDownloadCashReport = async () => {
        try {
            setIsDownloadingCashReport(true);
            const toastId = toast.loading("Menyiapkan dokumen rekap kas RT...");
            const config = JSON.parse(localStorage.getItem('pdf_config') || 'null') || DEFAULT_PDF_CONFIG;
            await generateCashFlowReportPDF(cashFlow, selectedMonth, config);
            toast.dismiss(toastId);
            toast.success("Laporan Kas RT Berhasil Diunduh!", {
                description: `Periode: ${selectedMonth}`
            });
        } catch (err) {
            console.error("Gagal cetak rekap kas:", err);
            toast.error("Gagal mengunduh laporan arus kas.");
        } finally {
            setIsDownloadingCashReport(false);
        }
    };

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

    const upcomingEventsList = events
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

    const latestNews = news
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

    const airManager = officials.find(o => o.role.toLowerCase().includes('air'));
    const sampahManager = officials.find(o => o.role.toLowerCase().includes('sampah') || o.role.toLowerCase().includes('kebersihan'));

    const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
    const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
    const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [checkOfficer, setCheckOfficer] = useState('');
    const [checkPin, setCheckPin] = useState('');
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [utilityOutages, setUtilityOutages] = useState<UtilityOutage[]>([]);
    const [isOutageModalOpen, setIsOutageModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToCheckpoints((data) => {
            setCheckpoints(data);
        });
        const unsubOutages = subscribeToCollection('utilityOutages', (data) => {
            setUtilityOutages(data as UtilityOutage[]);
        });
        return () => {
            unsubscribe();
            unsubOutages();
        };
    }, []);

    // Status Check State
    const [statusSearchId, setStatusSearchId] = useState(initialSearch || '');
    const [foundHouse, setFoundHouse] = useState<House | null>(null);

    useEffect(() => {
        if (initialSearch) {
            const house = houses.find(h => h.id.toLowerCase() === initialSearch.toLowerCase());
            if (house) {
                setFoundHouse(house);
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

    const handleStartPatrol = async () => {
        if (!checkOfficer) { 
            toast.error("Nama petugas wajib diisi!"); 
            return; 
        }
        if (!checkPin) { 
            toast.error("PIN wajib diisi!"); 
            return; 
        }
        
        const isValid = await validateOfficerAccessByName(checkOfficer, checkPin);
        
        if (!isValid) {
            toast.error("Nama petugas tidak ditemukan atau PIN salah! Silakan coba lagi.");
            return;
        }

        await startPatrolSession(checkOfficer);
        setIsCheckModalOpen(false);
        setCheckPin('');
    };

    const handleFinishPatrol = async () => {
        if (!activePatrol) return;
        if (activePatrol.visitedCheckpoints.length < checkpoints.length) {
            toast.warning("Patroli belum selesai!", {
                description: "Pindai QR di seluruh titik pos ronda sebelum menyelesaikan patroli."
            });
            return;
        }
        await finishPatrolSession(activePatrol.id);
        setIsCheckModalOpen(false);
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
            handleFirestoreError(error, OperationType.CREATE, "rondaSwapRequests");
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
                description: "Pastikan format benar (Contoh: C5-1)"
            });
            setFoundHouse(null);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 }
    };
    
    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto px-4 py-8 mb-24 space-y-10"
        >
            {/* Hero Section */}
            <motion.div variants={itemVariants} className="relative rounded-[2.5rem] overflow-hidden bg-white shadow-md p-8 md:p-12 text-slate-900 flex flex-col items-center justify-center text-center group border border-slate-200/80">
                <div className="relative z-10 max-w-4xl mx-auto space-y-5">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black tracking-widest uppercase shadow-xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <ShieldCheck size={14} className="text-indigo-600" /> Transparansi Kas, Iuran &amp; Keamanan RT 02
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Pusat Transparansi Kas &amp; <span className="text-indigo-600 italic font-serif">Informasi RT 02</span>
                    </h1>
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-medium">
                        Laporan keuangan kas real-time, rekapitulasi iuran air &amp; sampah, jadwal siskamling, serta informasi pemadaman utilitas di lingkungan Huntap Tondo 2.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                        <Link to="/services?tab=surat" className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2">
                            <Briefcase size={15} /> Buat Surat Mandiri
                        </Link>
                        <Link to="/about" className="px-5 py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2">
                            <Building2 size={15} /> Profil, Pengurus &amp; Demografi RT
                        </Link>
                        <Link to="/peta" className="px-5 py-3 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2">
                            <MapIcon size={15} /> Peta Kawasan
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* 1. Unified Financial Report - Transparansi Kas & Audit Finansial RT 02 */}
            <motion.div 
              variants={itemVariants} 
              className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 rounded-[2.5rem] p-6 sm:p-8 md:p-10 text-white border border-emerald-500/40 shadow-xl relative overflow-hidden space-y-8"
            >
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">AKUNTABILITAS KAS WARGA</span>
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black text-white flex items-center gap-3 tracking-tight">
                            Transparansi Kas <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-400 bg-clip-text text-transparent font-serif italic">&amp; Audit Finansial</span>
                        </h2>
                        <p className="text-slate-300 font-medium text-xs md:text-sm mt-1">Laporan arus kas publik real-time &amp; pertanggungjawaban bendahara RT 02</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <button
                            onClick={handleDownloadCashReport}
                            disabled={isDownloadingCashReport}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                        >
                            <Receipt size={14} className="text-emerald-400" />
                            <span>{isDownloadingCashReport ? 'Menyiapkan...' : 'Unduh Rekap Kas PDF'}</span>
                        </button>
                        <button
                            onClick={() => setIsFinanceModalOpen(true)}
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                            <Wallet size={14} />
                            <span>Buku Kas Lengkap</span>
                        </button>
                    </div>
                </div>

                {/* Summary KPI Cards (Merged from the second financial block) */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-white/10 border border-white/15 p-6 rounded-3xl backdrop-blur-sm">
                        <p className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">Saldo Kas Saat Ini</p>
                        <h3 className="text-3xl font-black text-white font-mono tabular-nums">Rp {currentBalance.toLocaleString('id-ID')}</h3>
                    </div>
                    <div className="bg-emerald-500/15 border border-emerald-400/30 p-6 rounded-3xl backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-1.5 text-emerald-300">
                            <ArrowUpRight size={14}/>
                            <p className="text-xs font-bold uppercase tracking-wider">Total Pemasukan</p>
                        </div>
                        <h3 className="text-2xl font-black text-white font-mono tabular-nums">Rp {totalIncome.toLocaleString('id-ID')}</h3>
                    </div>
                    <div className="bg-rose-500/15 border border-rose-400/30 p-6 rounded-3xl backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-1.5 text-rose-300">
                            <ArrowDownRight size={14}/>
                            <p className="text-xs font-bold uppercase tracking-wider">Total Pengeluaran</p>
                        </div>
                        <h3 className="text-2xl font-black text-white font-mono tabular-nums">Rp {totalExpense.toLocaleString('id-ID')}</h3>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between text-slate-900">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <Target size={15} className="text-indigo-600" />
                                    Alokasi Pengeluaran Kas
                                </h3>
                                <span className="text-[11px] font-bold text-slate-500 font-mono tabular-nums">
                                    Total: <strong className="text-slate-900 font-black">Rp {totalExpense.toLocaleString('id-ID')}</strong>
                                </span>
                            </div>

                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {pieData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="space-y-2 mt-4 pt-4 border-t border-slate-200/70">
                            {expenseBreakdown.slice(0, 4).map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-700 flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="truncate">{item.name}</span>
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                                        <span className="font-black text-slate-900">Rp {item.value.toLocaleString('id-ID')}</span>
                                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black text-white" style={{ backgroundColor: item.color }}>
                                            {item.percentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-slate-900 flex flex-col justify-between">
                        <div>
                            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4">Tren Arus Kas Bulanan</h3>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} tickFormatter={(value) => `Rp ${value/1000}k`} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                                        />
                                        <Area type="monotone" dataKey="income" stroke="#6366f1" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={0} strokeWidth={3} strokeDasharray="5 5" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="flex justify-center gap-6 mt-4 pt-3 border-t border-slate-200/70">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                                <span className="text-[11px] font-bold text-slate-600">Pemasukan</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                <span className="text-[11px] font-bold text-slate-600">Pengeluaran</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions Preview */}
                {cashFlow.length > 0 && (
                    <div className="relative z-10 bg-white/5 rounded-3xl p-5 sm:p-6 border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Transaksi Kas Terakhir</h4>
                            <button onClick={() => setIsFinanceModalOpen(true)} className="text-xs font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-wider cursor-pointer">
                                Lihat Semua ({cashFlow.length}) →
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {cashFlow.slice(0, 3).map((flow) => (
                                <div key={flow.id} className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/10">
                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                        <div className={`p-2 rounded-xl shrink-0 ${flow.type === 'Income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                            {flow.type === 'Income' ? <ArrowUpRight size={15}/> : <ArrowDownRight size={15}/>}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-xs text-white truncate">{flow.description}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(flow.date).toLocaleDateString('id-ID')}</p>
                                        </div>
                                    </div>
                                    <span className={`font-black text-xs font-mono tabular-nums shrink-0 ${flow.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {flow.type === 'Income' ? '+' : '-'} Rp {flow.amount.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* 2. Ringkasan Iuran Air, Sampah & Cek Status Iuran Mandiri */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Air & Sampah Summaries */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600"><Receipt size={20}/></div>
                                <h3 className="text-lg font-black text-slate-900">Rekap Iuran Air &amp; Sampah Bulan Ini</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {airManager && (
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-blue-100">
                                        Air: {airManager.name}
                                    </span>
                                )}
                                {sampahManager && (
                                    <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-orange-100">
                                        Sampah: {sampahManager.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Terkumpul (Air)</p>
                                <p className="text-lg font-black text-slate-900 font-mono tabular-nums">Rp {summaries.air.totalCollected.toLocaleString('id-ID')}</p>
                                <p className="text-[10px] text-rose-600 font-bold mt-1">{summaries.air.unpaidCount} KK Belum Bayar</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Piutang (Air)</p>
                                <p className="text-lg font-black text-blue-600 font-mono tabular-nums">Rp {summaries.air.estimatedReceivables.toLocaleString('id-ID')}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">Bulan Berjalan</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Terkumpul (Sampah)</p>
                                <p className="text-lg font-black text-slate-900 font-mono tabular-nums">Rp {summaries.sampah.totalCollected.toLocaleString('id-ID')}</p>
                                <p className="text-[10px] text-rose-600 font-bold mt-1">{summaries.sampah.unpaidCount} KK Belum Bayar</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Piutang (Sampah)</p>
                                <p className="text-lg font-black text-orange-600 font-mono tabular-nums">Rp {summaries.sampah.estimatedReceivables.toLocaleString('id-ID')}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">Bulan Berjalan</p>
                            </div>
                        </div>

                        {/* Total Arrears Banner */}
                        <div className="p-5 bg-amber-50 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Total Tunggakan Kolektif</p>
                                <p className="text-xs text-amber-800 font-medium mt-0.5">
                                    Akumulasi {summaries.totalArrearsHouseCount} unit rumah (Air: {summaries.air.arrearsHouseCount} unit &bull; Sampah: {summaries.sampah.arrearsHouseCount} unit)
                                </p>
                            </div>
                            <p className="text-2xl font-black text-amber-900 font-mono tabular-nums shrink-0">
                                Rp {summaries.totalArrearsAmount.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cek Status Iuran Mandiri Card */}
                <div className="lg:col-span-1 bg-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
                    <div className="relative z-10">
                        <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
                            <CheckCircle2 size={22} />
                        </div>
                        <h3 className="text-xl font-black mb-2">Cek Status Iuran Rumah</h3>
                        <p className="text-xs text-indigo-100 mb-6 font-medium leading-relaxed">
                            Masukkan kode blok rumah Anda untuk memeriksa status pembayaran iuran air dan retribusi sampah 6 bulan terakhir.
                        </p>
                        <form onSubmit={handleCheckStatus} className="space-y-3">
                            <input 
                                type="text" 
                                placeholder="No. Rumah (Contoh: C5-1)" 
                                className="w-full px-4 py-3 bg-white/15 border border-white/25 rounded-xl text-sm font-bold placeholder:text-indigo-200 outline-none focus:bg-white/25 transition-all text-white"
                                value={statusSearchId}
                                onChange={e => setStatusSearchId(e.target.value)}
                            />
                            <button type="submit" className="w-full py-3 bg-white text-indigo-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-md cursor-pointer">
                                Periksa Status Iuran
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>

            {/* 3. Utility Outage Feed (Info Pemadaman PLN & Air) */}
            {utilityOutages.length > 0 && (
                <motion.div id="outages" variants={itemVariants} className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200/80 shadow-xs">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Papan Informasi Pemadaman PLN &amp; Air Bersih</h2>
                                <p className="text-xs text-slate-500 font-medium">Jadwal resmi pemeliharaan jaringan listrik PLN, pipa PDAM, dan jaringan wilayah Huntap Tondo 2</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOutageModalOpen(true)}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                            <AlertTriangle size={14} />
                            <span>Lapor Gangguan &amp; Posko</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {utilityOutages.map((outage) => (
                            <div 
                                key={outage.id} 
                                className={`p-6 bg-white border-2 rounded-3xl shadow-xs flex flex-col justify-between ${
                                    outage.status === 'Ongoing' ? 'border-amber-400 ring-4 ring-amber-50' : 'border-slate-100'
                                }`}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                            outage.type === 'PLN' ? 'bg-amber-100 text-amber-800' :
                                            outage.type === 'PDAM' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                                        }`}>
                                            {outage.type === 'PLN' ? <Zap size={12} /> : <Droplets size={12} />} {outage.type}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                            outage.status === 'Ongoing' ? 'bg-rose-50 text-rose-600 animate-pulse' :
                                            outage.status === 'Scheduled' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                        }`}>
                                            {outage.status === 'Ongoing' ? '⚠️ Sedang Berlangsung' : outage.status === 'Scheduled' ? '🗓️ Terjadwal' : '✓ Normal / Selesai'}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="font-black text-slate-900 text-base">{outage.title}</h4>
                                        <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{outage.description}</p>
                                    </div>

                                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                                        <div className="flex justify-between items-center text-slate-600">
                                            <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Waktu:</span>
                                            <span className="font-black text-slate-800">{outage.startTime} s.d {outage.endTime}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-600">
                                            <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Wilayah:</span>
                                            <span className="font-bold text-slate-800 text-right">{outage.affectedBlocks?.join(', ') || 'Semua Blok RT 02'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 4. Siskamling & Emergency Contacts + Events */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Security Schedule */}
                <motion.div variants={itemVariants} className="lg:col-span-1 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Keamanan Lingkungan</p>
                            <h2 className="text-2xl font-black text-slate-800">Jadwal Siskamling</h2>
                        </div>
                        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
                            <Moon size={22} />
                        </div>
                    </div>
                    
                    {activePatrol && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Patroli Aktif
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-full">
                                        {new Date(activePatrol.startTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <p className="font-bold text-slate-800 text-sm mb-2">{activePatrol.officerName}</p>
                                <div className="w-full bg-emerald-200 rounded-full h-1.5 mb-1">
                                    <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${checkpoints.length > 0 ? (activePatrol.visitedCheckpoints.length / checkpoints.length) * 100 : 0}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold text-emerald-700">
                                    <span>Progress Titik Pos</span>
                                    <span>{activePatrol.visitedCheckpoints.length} / {checkpoints.length} Titik</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2.5 mb-6">
                        <button onClick={() => setIsCheckModalOpen(true)} className="py-3 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
                            <ShieldCheck size={16} /> Patroli QR
                        </button>
                        <button onClick={() => setIsSwapModalOpen(true)} className="py-3 px-3 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                            <ArrowLeftRight size={16} /> Tukar Jadwal
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[420px] custom-scrollbar">
                        {ronda.map((schedule, idx) => {
                            const isToday = schedule.day === new Date().toLocaleDateString('id-ID', {weekday:'long'});
                            return (
                                <div key={idx} className={`p-4 rounded-2xl border transition-all ${isToday ? 'bg-indigo-50/80 border-indigo-200 shadow-2xs' : 'bg-white border-slate-100'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className={`font-black text-sm ${isToday ? 'text-indigo-700' : 'text-slate-700'}`}>{schedule.day}</h4>
                                        {isToday && <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full uppercase">Malam Ini</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(schedule.members || []).map((member, i) => (
                                            <span key={i} className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${isToday ? 'bg-white text-indigo-700 border border-indigo-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                                {member}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Emergency Contacts & Pengumuman/Agenda */}
                <div className="lg:col-span-2 space-y-8">
                    <motion.div variants={itemVariants}>
                        <EmergencyContacts />
                    </motion.div>

                    {/* Pengumuman Penting & Berita */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><AlertTriangle size={18}/></div>
                                <h3 className="text-lg font-black text-slate-900">Pengumuman Penting</h3>
                            </div>
                            <div className="space-y-3">
                                {announcements.filter(a => a.type === 'Urgent').slice(0, 3).map(a => (
                                    <div key={a.id} onClick={() => setSelectedAnnouncement(a)} className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 hover:bg-rose-50 transition-colors cursor-pointer">
                                        <span className="text-[10px] font-bold text-rose-600 block mb-1">
                                            {new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{a.title}</h4>
                                    </div>
                                ))}
                                {announcements.filter(a => a.type === 'Urgent').length === 0 && (
                                    <p className="text-xs font-bold text-slate-400 py-6 text-center bg-slate-50 rounded-2xl">Tidak ada pengumuman darurat saat ini</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Calendar size={18}/></div>
                                    <h3 className="text-lg font-black text-slate-900">Agenda &amp; Berita</h3>
                                </div>
                                <Link to="/kegiatan" className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Semua →</Link>
                            </div>
                            <div className="space-y-3">
                                {upcomingEventsList.slice(0, 2).map((event) => (
                                    <div key={event.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black text-amber-700 uppercase">
                                            {new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} &bull; {event.location}
                                        </span>
                                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{event.title}</h4>
                                    </div>
                                ))}
                                {latestNews.slice(0, 2).map((n) => (
                                    <div key={n.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black text-indigo-600 uppercase">{n.category}</span>
                                        <h4 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">{n.title}</h4>
                                    </div>
                                ))}
                                {upcomingEventsList.length === 0 && latestNews.length === 0 && (
                                    <p className="text-xs font-bold text-slate-400 py-6 text-center bg-slate-50 rounded-2xl">Belum ada agenda/berita terbaru</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isCheckModalOpen} onClose={() => setIsCheckModalOpen(false)} title="Laporan Patroli Siskamling (Scan QR Pos Ronda)">
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                        <p className="text-xs font-bold text-slate-500 uppercase">Waktu Check-In</p>
                        <p className="text-xl font-black text-slate-800 font-mono mt-1">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })} WITA</p>
                    </div>
                    {activePatrol ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-indigo-50 rounded-xl">
                                <p className="text-xs font-bold text-indigo-600 mb-1">Progress Patroli ({activePatrol.officerName})</p>
                                <div className="w-full bg-indigo-200 rounded-full h-2.5">
                                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${checkpoints.length > 0 ? (activePatrol.visitedCheckpoints.length / checkpoints.length) * 100 : 0}%` }}></div>
                                </div>
                                <p className="text-xs text-indigo-800 mt-1">{activePatrol.visitedCheckpoints.length} / {checkpoints.length} Titik Pos Tercapai</p>
                            </div>

                            <div className="w-full max-w-md mx-auto aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                                <QrReader
                                    constraints={{ facingMode: 'environment' }}
                                    onResult={(result) => {
                                        if (result) {
                                            const checkpoint = checkpoints.find(cp => cp.qrCode === result.getText());
                                            if (checkpoint) {
                                                visitCheckpoint(activePatrol.id, checkpoint.id);
                                                toast.success("Titik pos tercapai!", {
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

                            {checkpoints.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Titik Pos Ronda</p>
                                    {checkpoints.map((cp, idx) => {
                                        const isVisited = activePatrol.visitedCheckpoints.includes(cp.id);
                                        return (
                                            <div 
                                                key={cp.id} 
                                                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold ${
                                                    isVisited 
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                                        : 'bg-white border-slate-200 text-slate-600'
                                                }`}
                                            >
                                                <span className="truncate">{idx + 1}. {cp.name}</span>
                                                <span className="text-[10px] uppercase font-black">
                                                    {isVisited ? '✓ Terverifikasi QR' : 'Menunggu Scan'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

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

            <Modal isOpen={isSwapModalOpen} onClose={() => setIsSwapModalOpen(false)} title="Permintaan Tukar Jadwal Ronda">
                <form onSubmit={handleSwapSubmit} className="space-y-6">
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl text-amber-600 shadow-sm"><ArrowLeftRight size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Tukar Jadwal Ronda</p>
                            <p className="text-[10px] text-amber-600 font-medium">Ajukan permohonan tukar jadwal kepada admin.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Nama Anda</label>
                            <input 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                placeholder="Nama Lengkap"
                                value={swapRequester}
                                onChange={e => setSwapRequester(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">No. Rumah</label>
                            <select 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Jadwal Asal</label>
                            <select 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
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
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
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
                        <textarea 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none h-24"
                            placeholder="Contoh: Ada acara keluarga, dinas luar kota, dll."
                            value={swapReason}
                            onChange={e => setSwapReason(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsSwapModalOpen(false)} className="flex-1 py-3">Batal</Button>
                        <Button type="submit" disabled={isSubmittingSwap} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700">
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

            <Modal isOpen={isFinanceModalOpen} onClose={() => setIsFinanceModalOpen(false)} title="Buku Kas & Laporan Keuangan Detail RT 02">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-900 text-white rounded-2xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Saat Ini</p>
                            <p className="text-lg font-black font-mono tabular-nums">Rp {currentBalance.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Pemasukan</p>
                            <p className="text-lg font-black text-emerald-700 font-mono tabular-nums">Rp {totalIncome.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Pengeluaran</p>
                            <p className="text-lg font-black text-rose-700 font-mono tabular-nums">Rp {totalExpense.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
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
                                <span className={`font-black text-sm font-mono tabular-nums ${flow.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {flow.type === 'Income' ? '+' : '-'} Rp {flow.amount.toLocaleString('id-ID')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!foundHouse} onClose={() => setFoundHouse(null)} title={`Status Iuran: Rumah ${foundHouse?.id}`}>
                <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center flex flex-col sm:flex-row items-center sm:text-left gap-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                            <Home size={32} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-900">{foundHouse?.headOfFamily}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Blok {foundHouse?.block} No. {foundHouse?.number}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl">
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
                                    {generateMonthOptions(12, 60).map((m: string) => (
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
                                        <p className="text-[9px] font-black text-slate-500 uppercase truncate">{m.split(' ')[0]}</p>
                                        <div className={`mt-1 flex justify-center ${isPaid ? 'text-emerald-500' : 'text-slate-300'}`}>
                                            {isPaid ? <CheckCircle size={13} /> : <X size={13} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Modal>

            <UtilityOutageTrackerModal 
                isOpen={isOutageModalOpen}
                onClose={() => setIsOutageModalOpen(false)}
                outages={utilityOutages}
            />
        </motion.div>
    );
};
