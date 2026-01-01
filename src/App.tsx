
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { 
  Home, FileText, Megaphone, AlertTriangle, User, Users, Menu, X, 
  LayoutDashboard, Send, Bot, Trash2, Clock, CheckCircle, XCircle, Search, Edit2, Plus,
  Shield, Phone, Wallet, Moon, Sun, CloudRain, 
  LogOut, Download, Package, ShoppingBag,
  ArrowUpRight, ArrowDownRight, ShieldCheck, FileDown, Target, HelpCircle, MapPin as MapIcon,
  Briefcase, Store, Archive, History, BarChart3, Grid, List, Upload, Printer,
  RefreshCw, Calendar, DollarSign, Settings, Filter, Heart, Baby, Smile, GraduationCap, Accessibility, Key, MessageCircle, ImageIcon, AlertCircle, Wrench, ChevronRight,
  Database, Lock, Eye, EyeOff, Save, Trash, Sparkles, Loader2, CheckSquare, Bell, Vote, PieChart, LocateFixed, ShoppingCart, Wand2, Droplets, Trash2 as TrashIcon
} from 'lucide-react';
import { CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

const { HashRouter, Routes, Route, useNavigate, useLocation, useSearchParams } = ReactRouterDOM;

import { Logo, generateHouses, MOCK_ANNOUNCEMENTS, MOCK_UMKM, MOCK_RONDA, MOCK_CASHFLOW, MOCK_GALLERY, INITIAL_OFFICIALS, DEFAULT_PDF_CONFIG, MOCK_INVENTORY, INITIAL_REPORTS, MOCK_POLLS, MOCK_RONDA_LOGS } from '@/constants';
import { House, Announcement, Report, LetterRequest, PaymentStatus, UMKM, CashFlow, Official, RondaSchedule, PdfConfig, InventoryItem, AppNotification, Poll, PollOption, RondaCheckLog, MarketItem } from './types';
import { HouseMap } from './components/HouseMap';
import { SmartImage } from './components/SmartImage';
import { generateAnnouncementDraft, generateDashboardSummary } from './services/geminiService';
import { generateSuratPengantar, generateResidentReportPDF } from './services/pdfService';
import { AdminRouteWrapper } from './components/AdminComponents'; 
import { ChatBot } from './components/ChatBot';

import { auth } from './services/firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";
import { 
  subscribeToCollection, 
  subscribeToNotifications,
  addAnnouncementToDb, 
  deleteAnnouncementFromDb,
  addTransactionToDb, 
  updateTransactionInDb, 
  deleteTransactionFromDb,
  addOfficialToDb,
  updateOfficialInDb,
  deleteOfficialFromDb,
  addReportToDb,
  updateReportStatus,
  deleteReportFromDb,
  addLetterToDb,
  updateLetterStatus,
  deleteLetterFromDb,
  updateHouseData,
  deleteHouseFromDb,
  addInventoryToDb,
  updateInventoryInDb,
  deleteInventoryFromDb,
  updateRondaSchedule,
  addUMKMToDb,
  updateUMKMInDb,
  deleteUMKMFromDb,
  batchUpdateHouses,
  logoutAdmin,
  seedDatabase,
  updateAdminPassword,
  addNotificationToDb,
  addPollToDb,
  deletePollFromDb,
  updatePollStatus,
  submitVote,
  addRondaLog,
  subscribeToRondaLogs,
  validateResidentAccess,
  subscribeToMarketItems,
  addMarketItem,
  deleteMarketItem,
  updateMarketItemStatus
} from './services/databaseService';

// --- Shared UI Components ---
const Button = ({ children, variant = 'primary', size = 'md', className, ...props }: any) => {
  const base = "rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
  const variants: any = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 border border-transparent",
    outline: "border-2 border-slate-200 bg-white text-slate-700 hover:border-slate-800 hover:text-slate-900",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200",
    success: "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200"
  };
  return <button className={`${base} ${sizes[size as keyof typeof sizes]} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>{children}</button>;
};

const Card = ({ children, className, title, subtitle, action, icon: Icon }: any) => (
  <div className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4 items-center">
            {Icon && <div className="p-3 rounded-2xl bg-slate-50 text-slate-600 border border-slate-100"><Icon size={24}/></div>}
            <div>
                {title && <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>}
                {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
            </div>
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children, headerColor }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 animate-slide-up overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        <div className={`px-6 py-5 border-b border-slate-100 flex justify-between items-center ${headerColor || 'bg-white'}`}>
          <h3 className="text-lg font-black tracking-tight text-slate-800">{title}</h3>
          <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/50">{children}</div>
      </div>
    </div>
  );
};

// --- Notification Components ---
const NotificationToast = ({ notification, onClose }: { notification: AppNotification, onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, []);

    const bgColor = notification.type === 'Alert' ? 'bg-rose-50 border-rose-200' : notification.type === 'Success' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200';
    const textColor = notification.type === 'Alert' ? 'text-rose-800' : notification.type === 'Success' ? 'text-emerald-800' : 'text-slate-800';
    const Icon = notification.type === 'Alert' ? AlertTriangle : notification.type === 'Success' ? CheckCircle : Bell;

    return (
        <div className={`fixed top-4 right-4 z-[100] w-80 p-4 rounded-2xl shadow-2xl border flex items-start gap-3 animate-slide-in-right ${bgColor}`}>
            <div className={`p-2 rounded-full bg-white/50 shrink-0`}>
                <Icon size={18} className={textColor}/>
            </div>
            <div className="flex-1">
                <h4 className={`font-bold text-sm ${textColor}`}>{notification.title}</h4>
                <p className={`text-xs mt-1 ${textColor} opacity-80 line-clamp-2`}>{notification.message}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
        </div>
    );
};

const NotificationCenter = ({ notifications, onMarkRead }: { notifications: AppNotification[], onMarkRead: (id: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
                <Bell size={20}/>
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>}
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
                    <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center"><h4 className="font-bold text-sm">Notifikasi</h4></div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? notifications.map(n => (
                            <div key={n.id} className={`p-4 border-b hover:bg-slate-50 cursor-pointer ${n.isRead ? 'opacity-60' : 'bg-blue-50/30'}`} onClick={() => onMarkRead(n.id)}>
                                <h5 className="text-xs font-bold">{n.title}</h5>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                            </div>
                        )) : <div className="p-8 text-center text-slate-400 text-xs">Belum ada notifikasi.</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

const PanicButton = () => (
    <a href="https://wa.me/?text=DARURAT!%20Bantuan%20di%20RT%20002!" target="_blank" rel="noreferrer" className="fixed bottom-10 right-10 z-[45] bg-red-600 text-white p-4 rounded-full shadow-2xl animate-bounce-slow ring-4 ring-red-100 hover:scale-110 transition-transform"><Phone size={24} /></a>
);

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [{ path: '/', icon: Home, label: 'Beranda' }, { path: '/voting', icon: Vote, label: 'Voting' }, { path: '/market', icon: ShoppingCart, label: 'Pasar' }, { path: '/services', icon: FileText, label: 'Layanan' }, { path: '/info', icon: Shield, label: 'Info' }];
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-50 flex justify-around items-center h-16 pb-safe">
      {navItems.map(item => (
        <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.pathname === item.path ? 'text-brand-blue' : 'text-slate-400'}`}>
          <item.icon size={20} /><span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

const PublicHeader = ({ notifications, onMarkRead }: any) => {
  const navigate = useNavigate();
  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 h-16 flex items-center px-4 justify-between max-w-7xl mx-auto w-full">
        <div className="cursor-pointer" onClick={() => navigate('/')}><Logo /></div>
        <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center space-x-2 mr-4">
              {['/', '/voting', '/market', '/services', '/umkm', '/info'].map(path => (
                <button key={path} onClick={() => navigate(path)} className={`px-3 py-2 rounded-lg text-sm font-medium ${window.location.hash === `#${path}` ? 'text-brand-blue bg-blue-50' : 'text-slate-600'}`}>
                    {path === '/' ? 'Beranda' : path.slice(1).toUpperCase()}
                </button>
              ))}
            </div>
            <NotificationCenter notifications={notifications} onMarkRead={onMarkRead} />
            <Button onClick={() => navigate('/admin')} variant="outline" size="sm" className="hidden md:flex">Login Admin</Button>
        </div>
      </nav>
      <MobileBottomNav />
    </>
  );
};

const HeroSection = () => (
    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-8 md:p-12 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">Huntap Tondo 2</span>
            <h1 className="text-4xl md:text-6xl font-black mb-4">TERAS RT 002</h1>
            <p className="text-blue-50 text-lg max-w-xl">Transformasi digital menuju lingkungan yang lebih harmonis, rukun, dan sinergi.</p>
        </div>
        <Bot size={120} className="absolute -bottom-10 -right-10 text-white/10" />
    </div>
);

// --- Public View Components ---
const PublicHome = ({ houses, announcements, ronda, reports, officials }: any) => {
    const navigate = useNavigate();
    const today = new Date().toLocaleDateString('id-ID', {weekday:'long'});
    const todayRonda = ronda.find((r:any) => r.day === today);
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 mb-20 animate-fade-in">
            <HeroSection />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[{l:'Surat', i:FileText, c:'blue', p:'/services'}, {l:'Pasar', i:ShoppingCart, c:'emerald', p:'/market'}, {l:'Voting', i:Vote, c:'indigo', p:'/voting'}, {l:'Lapor', i:AlertTriangle, c:'rose', p:'/services?tab=lapor'}].map(a => (
                    <button key={a.l} onClick={() => navigate(a.p)} className="bg-white p-4 rounded-2xl shadow-sm border hover:shadow-md transition-all flex flex-col items-center gap-2">
                        <div className={`p-3 bg-${a.c}-50 text-${a.c}-600 rounded-full`}><a.i size={24}/></div>
                        <span className="font-bold text-sm">{a.l}</span>
                    </button>
                ))}
            </div>
            <div className="mb-8"><HouseMap houses={houses} isAdmin={false} reports={reports} officials={officials} /></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Megaphone className="text-brand-blue"/> Pengumuman Terbaru</h2>
                    {announcements.map((ann:any) => (
                        <div key={ann.id} className="bg-white p-5 rounded-2xl border shadow-sm">
                            <span className="text-[10px] font-bold uppercase text-slate-400">{new Date(ann.date).toLocaleDateString()}</span>
                            <h3 className="font-bold text-lg mt-1">{ann.title}</h3>
                            <p className="text-slate-600 text-sm mt-2">{ann.content}</p>
                        </div>
                    ))}
                </div>
                <Card title="Ronda Malam Ini" icon={Moon} className="bg-slate-900 text-white border-0">
                    <p className="text-2xl font-black text-emerald-400 mb-4">{today}</p>
                    <div className="space-y-2">
                        {todayRonda?.members.map((m:string, i:number) => (
                            <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10 text-sm">
                                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">{i+1}</span>
                                {m}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const PublicVoting = ({ polls }: any) => (
    <div className="max-w-4xl mx-auto px-4 py-8 mb-20 animate-fade-in text-center">
        <h1 className="text-4xl font-black mb-4">E-Voting Warga</h1>
        <p className="text-slate-500 mb-8">Gunakan hak suara Anda untuk keputusan bersama.</p>
        <div className="space-y-6 text-left">
            {polls.map((p:any) => (
                <div key={p.id} className="bg-white p-6 rounded-3xl border shadow-sm">
                    <h3 className="text-xl font-bold">{p.title}</h3>
                    <p className="text-sm text-slate-500 mb-4">{p.description}</p>
                    <div className="space-y-2">
                        {p.options.map((o:any) => (
                            <div key={o.id} className="p-4 bg-slate-50 rounded-xl border font-bold text-sm flex justify-between items-center">
                                {o.text} <span className="text-xs text-slate-400">{o.votes} Suara</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const PublicMarket = ({ items }: any) => (
    <div className="max-w-7xl mx-auto px-4 py-8 mb-20 animate-fade-in">
        <h1 className="text-4xl font-black mb-8 text-center">Bursa Warga</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item:any) => (
                <div key={item.id} className="bg-white rounded-2xl border overflow-hidden flex flex-col group">
                    <div className="h-48 bg-slate-100 relative">
                        <SmartImage src={item.image} alt={item.title} className="w-full h-full" />
                        <span className="absolute top-2 left-2 bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">{item.category}</span>
                    </div>
                    <div className="p-4 flex-1">
                        <h3 className="font-bold text-sm">{item.title}</h3>
                        <p className="text-emerald-600 font-black mt-2">Rp {item.price.toLocaleString()}</p>
                        <a href={`https://wa.me/${item.sellerContact}`} className="mt-4 w-full block py-2 bg-emerald-500 text-white rounded-xl text-center text-xs font-bold">Beli Sekarang</a>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const PublicServices = ({ pdfConfig }: any) => (
    <div className="max-w-4xl mx-auto px-4 py-8 mb-20 animate-fade-in">
        <h1 className="text-4xl font-black text-center mb-10">Layanan Warga</h1>
        <div className="bg-white rounded-3xl border shadow-xl p-8">
            <p className="text-center text-slate-500 italic">Formulir layanan sedang dalam pemeliharaan. Hubungi Ketua RT untuk pengajuan manual.</p>
        </div>
    </div>
);

const PublicUMKM = ({ umkmData }: any) => (
    <div className="max-w-7xl mx-auto px-4 py-8 mb-20 animate-fade-in">
        <h1 className="text-4xl font-black text-center mb-10">UMKM Warga</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {umkmData.map((u:any) => (
                <div key={u.id} className="bg-white rounded-3xl border overflow-hidden shadow-sm group">
                    <div className="h-56 relative"><SmartImage src={u.image} alt={u.name} className="w-full h-full" /></div>
                    <div className="p-6">
                        <h3 className="font-bold text-xl">{u.name}</h3>
                        <p className="text-slate-500 text-sm mt-2">{u.description}</p>
                        <Button className="w-full mt-6 bg-emerald-500 border-0 hover:bg-emerald-600">Hubungi Penjual</Button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const PublicInfo = ({ officials, cashFlow, ronda, rondaLogs }: any) => (
    <div className="max-w-7xl mx-auto px-4 py-8 mb-20 animate-fade-in space-y-10">
        <h1 className="text-4xl font-black text-center mb-4">Informasi Transparan</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Saldo Kas RT" icon={Wallet} className="bg-emerald-600 text-white">
                <h3 className="text-3xl font-black">Rp {cashFlow.reduce((a:any,c:any)=>c.type==='Income'?a+c.amount:a-c.amount,0).toLocaleString()}</h3>
            </Card>
            <Card title="Pengurus RT" icon={Users}>
                <h3 className="text-3xl font-black">{officials.length} Personil</h3>
            </Card>
            <Card title="Jadwal Ronda" icon={Moon}>
                <h3 className="text-3xl font-black">Aktif 24/7</h3>
            </Card>
        </div>
    </div>
);

// --- Admin Dashboard ---
const AdminDashboard = ({ 
  houses, announcements, cashFlow, officials, reports, letters, ronda, inventory, umkm, polls, pdfConfig, setPdfConfig, rondaLogs 
}: any) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<any>('announcement');
  const navigate = useNavigate();

  const [searchResident, setSearchResident] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Multi-dues state
  const [duesHouseId, setDuesHouseId] = useState('');
  const [duesType, setDuesType] = useState<'Keamanan' | 'Air' | 'Sampah'>('Keamanan');
  const [duesAmount, setDuesAmount] = useState('25000');
  const [duesStatus, setDuesStatus] = useState<PaymentStatus>(PaymentStatus.PAID);

  const resetForms = () => {
    setDuesType('Keamanan'); setDuesAmount('25000'); setDuesStatus(PaymentStatus.PAID);
  };

  const openDuesModal = (h: House) => {
    setDuesHouseId(h.id);
    resetForms();
    setModalType('dues');
    setIsModalOpen(true);
  };

  const handleSaveDues = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duesHouseId) return;
    const updates: any = {};
    if (duesType === 'Keamanan') updates.paymentStatus = duesStatus;
    else if (duesType === 'Air') updates.paymentStatusAir = duesStatus;
    else if (duesType === 'Sampah') updates.paymentStatusSampah = duesStatus;

    await updateHouseData(duesHouseId, updates);
    if (duesStatus === PaymentStatus.PAID) {
      await addTransactionToDb({
        description: `Iuran ${duesType} - ${duesHouseId}`,
        amount: parseInt(duesAmount),
        type: 'Income',
        category: `Iuran ${duesType}`,
        date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(false);
  };

  const filteredHouses = houses.filter((h: House) => {
    const matchSearch = h.headOfFamily.toLowerCase().includes(searchResident.toLowerCase()) || h.id.toLowerCase().includes(searchResident.toLowerCase());
    const matchStatus = filterStatus === 'All' || h.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleLogout = async () => { await logoutAdmin(); navigate('/'); };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <div className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 fixed h-full z-30">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3"><div className="bg-slate-900 text-white p-2 rounded-xl"><Shield size={24}/></div><div><h1 className="font-black text-xl text-slate-900 tracking-tight">TERAS Admin</h1></div></div>
          <nav className="flex-1 px-4 py-6 space-y-1">
             {['overview', 'residents', 'finance', 'announcements'].map(t => (
               <button key={t} onClick={() => setActiveTab(t)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold ${activeTab === t ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                 {t === 'overview' ? <LayoutDashboard size={18}/> : t === 'residents' ? <Users size={18}/> : t === 'finance' ? <DollarSign size={18}/> : <Megaphone size={18}/>}
                 <span className="capitalize text-sm">{t}</span>
               </button>
             ))}
          </nav>
          <div className="p-4 border-t border-slate-100"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg"><LogOut size={14}/> Logout</button></div>
      </div>

      <div className="flex-1 md:ml-72 p-4 md:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-800">Dashboard Utama</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card className="border-l-4 border-l-blue-500" title="Total Warga" subtitle="KK Terdaftar"><h3 className="text-3xl font-black">{houses.length} KK</h3></Card>
                 <Card className="border-l-4 border-l-emerald-500" title="Kas RT" subtitle="Saldo Saat Ini"><h3 className="text-3xl font-black">Rp {cashFlow.reduce((acc:any, c:any) => c.type==='Income'?acc+c.amount:acc-c.amount,0).toLocaleString()}</h3></Card>
                 <Card className="border-l-4 border-l-rose-500" title="Laporan" subtitle="Baru Masuk"><h3 className="text-3xl font-black">{reports.filter((r:any)=>r.status==='Baru').length}</h3></Card>
              </div>
            </div>
          )}

          {activeTab === 'residents' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-800">Data Warga & Iuran</h2>
                  <div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input className="pl-10 pr-4 py-2 border rounded-xl text-sm" placeholder="Cari..." value={searchResident} onChange={e=>setSearchResident(e.target.value)}/></div></div>
               </div>
               <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                        <tr><th className="px-6 py-4">Rumah</th><th className="px-6 py-4">Kepala Keluarga</th><th className="px-6 py-4 text-center">🛡️ Keamanan</th><th className="px-6 py-4 text-center">💧 Air</th><th className="px-6 py-4 text-center">🗑️ Sampah</th><th className="px-6 py-4 text-center">Aksi</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredHouses.map((h: House) => (
                          <tr key={h.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-black">{h.block}-{h.number}</td>
                            <td className="px-6 py-4 font-bold">{h.headOfFamily}</td>
                            <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${h.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{h.paymentStatus}</span></td>
                            <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${(h.paymentStatusAir || PaymentStatus.UNPAID) === PaymentStatus.PAID ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>{h.paymentStatusAir || 'Menunggak'}</span></td>
                            <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${(h.paymentStatusSampah || PaymentStatus.UNPAID) === PaymentStatus.PAID ? 'bg-slate-200 text-slate-700' : 'bg-rose-100 text-rose-700'}`}>{h.paymentStatusSampah || 'Menunggak'}</span></td>
                            <td className="px-6 py-4 text-center"><button onClick={() => openDuesModal(h)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><DollarSign size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </Card>
            </div>
          )}

          {isModalOpen && (
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalType === 'dues' ? "Pencatatan Iuran Warga" : "Pesan"}>
               {modalType === 'dues' && (
                 <form onSubmit={handleSaveDues} className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-xl text-center"><p className="text-xs font-bold text-blue-400 uppercase">Rumah</p><p className="text-xl font-black text-blue-800">{duesHouseId}</p></div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Jenis Iuran</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'Keamanan', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                          { id: 'Air', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
                          { id: 'Sampah', icon: TrashIcon, color: 'text-slate-500', bg: 'bg-slate-100' }
                        ].map(type => (
                          <button key={type.id} type="button" onClick={() => { setDuesType(type.id as any); setDuesAmount(type.id === 'Keamanan' ? '25000' : '15000'); }} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${duesType === type.id ? 'border-slate-800 bg-white shadow-md' : 'border-transparent bg-slate-50 opacity-60'}`}>
                             <type.icon className={type.color} size={20}/><span className="text-[10px] font-bold">{type.id}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1.5">Nominal (Rp)</label><input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl" value={duesAmount} onChange={e=>setDuesAmount(e.target.value)} required/></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1.5">Status Pembayaran</label><select className="w-full p-3 bg-white border border-slate-200 rounded-xl" value={duesStatus} onChange={e=>setDuesStatus(e.target.value as any)}><option value={PaymentStatus.PAID}>Lunas</option><option value={PaymentStatus.PENDING}>Belum Lunas</option><option value={PaymentStatus.UNPAID}>Menunggak</option></select></div>
                    <Button type="submit" className="w-full py-3 bg-emerald-600 text-white">Simpan</Button>
                 </form>
               )}
            </Modal>
          )}
      </div>
    </div>
  );
};

export const App = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [ronda, setRonda] = useState<RondaSchedule[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [umkm, setUmkm] = useState<UMKM[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [rondaLogs, setRondaLogs] = useState<RondaCheckLog[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pdfConfig, setPdfConfig] = useState<PdfConfig>(() => { try { const saved = localStorage.getItem('pdf_config'); return saved ? JSON.parse(saved) : DEFAULT_PDF_CONFIG; } catch { return DEFAULT_PDF_CONFIG; } });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubHouses = subscribeToCollection('houses', (data) => setHouses(data));
    const unsubAnnouncements = subscribeToCollection('announcements', (data) => setAnnouncements(data));
    const unsubCash = subscribeToCollection('cashFlow', (data) => setCashFlow(data));
    const unsubOfficials = subscribeToCollection('officials', (data) => setOfficials(data));
    const unsubReports = subscribeToCollection('reports', (data) => setReports(data));
    const unsubLetters = subscribeToCollection('letters', (data) => setLetters(data));
    const unsubRonda = subscribeToCollection('ronda', (data) => setRonda(data));
    const unsubInventory = subscribeToCollection('inventory', (data) => setInventory(data));
    const unsubUmkm = subscribeToCollection('umkm', (data) => setUmkm(data));
    const unsubPolls = subscribeToCollection('polls', (data) => setPolls(data));
    const unsubMarket = subscribeToMarketItems((data) => setMarketItems(data));
    const unsubRondaLogs = subscribeToRondaLogs((data) => setRondaLogs(data));
    const unsubNotifs = subscribeToNotifications((data) => setNotifications(data));
    return () => {
      unsubHouses(); unsubAnnouncements(); unsubCash(); unsubOfficials(); 
      unsubReports(); unsubLetters(); unsubRonda(); unsubInventory(); 
      unsubUmkm(); unsubPolls(); unsubMarket(); unsubRondaLogs(); unsubNotifs();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => { setIsAdmin(!!user); });
    return () => unsubscribe();
  }, []);

  return (
    <HashRouter>
        <Routes>
            <Route path="/admin" element={
                <AdminRouteWrapper isAdmin={isAdmin} onLogin={() => setIsAdmin(true)}>
                    <AdminDashboard houses={houses} announcements={announcements} cashFlow={cashFlow} officials={officials} reports={reports} letters={letters} ronda={ronda} inventory={inventory} umkm={umkm} polls={polls} rondaLogs={rondaLogs} pdfConfig={pdfConfig} setPdfConfig={setPdfConfig} />
                </AdminRouteWrapper>
            }/>
            <Route path="*" element={
                <>
                    <PublicHeader notifications={notifications} onMarkRead={() => {}} />
                    <Routes>
                        <Route path="/" element={<PublicHome houses={houses} announcements={announcements} ronda={ronda} reports={reports} officials={officials} />} />
                        <Route path="/voting" element={<PublicVoting polls={polls} />} />
                        <Route path="/market" element={<PublicMarket items={marketItems} />} />
                        <Route path="/services" element={<PublicServices pdfConfig={pdfConfig} />} />
                        <Route path="/umkm" element={<PublicUMKM umkmData={umkm} />} />
                        <Route path="/info" element={<PublicInfo officials={officials} cashFlow={cashFlow} ronda={ronda} rondaLogs={rondaLogs} />} />
                    </Routes>
                    <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
                    <PanicButton />
                </>
            } />
        </Routes>
    </HashRouter>
  );
};
