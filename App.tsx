
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { 
  Home, FileText, Megaphone, AlertTriangle, User, Users, Menu, X, 
  LayoutDashboard, Send, Bot, Trash2, Clock, CheckCircle, XCircle, Search, Edit2, Plus,
  Shield, Phone, Wallet, Moon, Sun, 
  LogOut, Download, Package, ShoppingBag,
  ArrowUpRight, ArrowDownRight, ShieldCheck, FileDown, Target, HelpCircle, MapPin as MapIcon,
  Briefcase, Store, Archive, History, BarChart3, Grid, List, Upload, Printer,
  RefreshCw, Calendar, DollarSign, Settings, Filter, Heart, Baby, Smile, GraduationCap, Accessibility, Key, MessageCircle, ImageIcon, Lock, Eye, EyeOff, Save, Sparkles, Loader2, CheckSquare, Bell, Vote, PieChart, LocateFixed, ShoppingCart, ChevronRight
} from 'lucide-react';
import { CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

const { HashRouter, Routes, Route, useNavigate, useLocation, useSearchParams } = ReactRouterDOM;

import { Logo, generateHouses, MOCK_ANNOUNCEMENTS, MOCK_UMKM, MOCK_RONDA, MOCK_CASHFLOW, MOCK_GALLERY, INITIAL_OFFICIALS, DEFAULT_PDF_CONFIG, MOCK_INVENTORY, INITIAL_REPORTS, INITIAL_LETTERS, MOCK_POLLS, MOCK_RONDA_LOGS } from './constants';
import { House, Announcement, Report, LetterRequest, PaymentStatus, UMKM, CashFlow, Official, RondaSchedule, PdfConfig, InventoryItem, AppNotification, Poll, PollOption, RondaCheckLog, MarketItem } from './types';
import { HouseMap } from './components/HouseMap';
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

// --- Reusable Components ---
const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }: any) => {
  const base = "rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 border border-transparent",
    outline: "border-2 border-slate-200 bg-white text-slate-700 hover:border-slate-800 hover:text-slate-900",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200",
    success: "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200"
  };
  return <button className={`${base} ${sizes[size as keyof typeof sizes]} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>{children}</button>;
};

const Card = ({ children, className = '', title, subtitle, action, icon: Icon }: any) => (
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

// New components to fix "Cannot find name" errors
const PublicVoting = ({ polls }: { polls: Poll[] }) => (
  <div className="max-w-4xl mx-auto px-4 py-8 mb-24 animate-fade-in">
    <h1 className="text-3xl font-black text-slate-800 mb-6">Voting Warga</h1>
    <div className="space-y-6">
      {polls.map(p => (
        <Card key={p.id} title={p.title} subtitle={`Deadline: ${p.deadline}`}>
          <p className="text-sm text-slate-600 mb-4">{p.description}</p>
          <div className="space-y-2">
            {p.options.map(o => (
              <button key={o.id} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-sm">
                {o.text}
              </button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const PublicMarket = ({ items }: { items: MarketItem[] }) => (
  <div className="max-w-7xl mx-auto px-4 py-8 mb-24 animate-fade-in">
    <h1 className="text-3xl font-black text-slate-800 mb-6">Bursa Warga</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map(i => (
        <Card key={i.id} title={i.title} subtitle={i.sellerName}>
          <div className="h-40 bg-slate-100 rounded-xl mb-4 overflow-hidden">
             <img src={i.image} className="w-full h-full object-cover" alt={i.title} />
          </div>
          <p className="font-bold text-emerald-600">Rp {i.price.toLocaleString()}</p>
        </Card>
      ))}
    </div>
  </div>
);

const PublicServices = () => (
  <div className="max-w-4xl mx-auto px-4 py-8 mb-24 animate-fade-in">
    <h1 className="text-3xl font-black text-slate-800 mb-6">Layanan Digital</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Surat Pengantar" subtitle="KTP, KK, Domisili, dll" icon={FileText}>
         <p className="text-sm text-slate-500 mb-4">Ajukan pembuatan surat pengantar secara mandiri.</p>
         <Button className="w-full">Mulai Pengajuan</Button>
      </Card>
      <Card title="Lapor Masalah" subtitle="Keamanan & Fasilitas" icon={AlertTriangle}>
         <p className="text-sm text-slate-500 mb-4">Laporkan gangguan lingkungan ke pengurus RT.</p>
         <Button variant="danger" className="w-full">Buat Laporan</Button>
      </Card>
    </div>
  </div>
);

const PublicUMKM = ({ umkmData }: { umkmData: UMKM[] }) => (
  <div className="max-w-7xl mx-auto px-4 py-8 mb-24 animate-fade-in">
    <h1 className="text-3xl font-black text-slate-800 mb-6">UMKM Warga</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {umkmData.map(u => (
        <Card key={u.id} title={u.name} subtitle={u.owner}>
           <img src={u.image} className="h-48 w-full object-cover rounded-xl mb-4" alt={u.name} />
           <p className="text-sm text-slate-600 line-clamp-3">{u.description}</p>
        </Card>
      ))}
    </div>
  </div>
);

const PublicInfo = ({ officials, cashFlow, ronda, rondaLogs }: any) => (
  <div className="max-w-7xl mx-auto px-4 py-8 mb-24 animate-fade-in space-y-8">
    <h1 className="text-3xl font-black text-slate-800">Informasi Publik RT 002</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card title="Struktur Pengurus" icon={Users}>
         <div className="space-y-4">
            {officials.map((o:any) => (
              <div key={o.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                 <div><p className="font-bold text-sm">{o.name}</p><p className="text-xs text-slate-500">{o.role}</p></div>
                 <span className="text-xs font-bold text-slate-400">{o.houseId}</span>
              </div>
            ))}
         </div>
      </Card>
      <Card title="Arus Kas" icon={Wallet}>
         <div className="h-40 flex items-center justify-center text-slate-400 italic">Data Keuangan Real-time</div>
      </Card>
    </div>
  </div>
);

// --- Mobile Bottom Nav ---
const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { path: '/', icon: Home, label: 'Beranda' },
    { path: '/voting', icon: Vote, label: 'Voting' }, 
    { path: '/market', icon: ShoppingCart, label: 'Pasar' },
    { path: '/services', icon: FileText, label: 'Layanan' },
    { path: '/info', icon: Shield, label: 'Info' },
  ];
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-50 pb-safe-area-pb shadow-lg">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-brand-blue' : 'text-slate-400'}`}>
              <item.icon size={20} className={isActive ? 'fill-current' : ''} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const PublicHeader = ({ notifications }: any) => {
  const navigate = useNavigate();
  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 h-16 flex items-center px-4 md:px-8">
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        <div className="cursor-pointer" onClick={() => navigate('/')}><Logo /></div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-1">
            <button onClick={() => navigate('/')} className="px-3 py-2 rounded-lg text-sm font-bold text-slate-600 hover:text-brand-blue">Beranda</button>
            <button onClick={() => navigate('/voting')} className="px-3 py-2 rounded-lg text-sm font-bold text-slate-600 hover:text-brand-blue">E-Voting</button>
            <button onClick={() => navigate('/market')} className="px-3 py-2 rounded-lg text-sm font-bold text-slate-600 hover:text-brand-blue">Pasar</button>
            <button onClick={() => navigate('/services')} className="px-3 py-2 rounded-lg text-sm font-bold text-slate-600 hover:text-brand-blue">Layanan</button>
          </div>
          <Button onClick={() => navigate('/admin')} variant="outline" size="sm" className="hidden md:flex">Admin</Button>
        </div>
      </div>
    </nav>
  );
};

const PublicHome = ({ houses, announcements, ronda, reports, officials }: any) => {
  const navigate = useNavigate();
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-8 animate-fade-in">
      <HeroSection />
      <HouseMap houses={houses} isAdmin={false} reports={reports} officials={officials} />
    </div>
  );
};

const HeroSection = () => (
  <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-8 md:p-16 text-white relative overflow-hidden shadow-xl shadow-blue-200">
    <div className="relative z-10">
      <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 inline-block">Digital RT 002</span>
      <h1 className="text-4xl md:text-6xl font-black mb-4">TERAS RT 002</h1>
      <p className="text-blue-50 max-w-xl text-sm md:text-lg">Teknologi • Ekraf • Rukun • Aman • Sinergi. Transformasi pelayanan warga menuju lingkungan yang harmonis dan transparan.</p>
    </div>
  </div>
);

const AdminDashboard = (props: any) => {
  const [activeTab, setActiveTab] = useState('overview');
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <div className="mb-10"><Logo /></div>
        <nav className="space-y-1">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${activeTab==='overview'?'bg-brand-blue':'text-slate-400 hover:text-white'}`}><LayoutDashboard size={20}/> Dashboard</button>
          <button onClick={() => setActiveTab('residents')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${activeTab==='residents'?'bg-brand-blue':'text-slate-400 hover:text-white'}`}><Users size={20}/> Warga</button>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'overview' && <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Warga Terdata" subtitle="Total KK"><h3 className="text-3xl font-black">{props.houses.length}</h3></Card>
          <Card title="Saldo Kas" subtitle="Total Pemasukan - Pengeluaran"><h3 className="text-3xl font-black text-emerald-600">Rp 12.500.000</h3></Card>
          <Card title="Laporan Baru" subtitle="Butuh Tindak Lanjut"><h3 className="text-3xl font-black text-rose-600">{props.reports.filter((r:any)=>r.status==='Baru').length}</h3></Card>
        </div>}
      </main>
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
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [rondaLogs, setRondaLogs] = useState<RondaCheckLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubHouses = subscribeToCollection('houses', setHouses);
    const unsubAnnouncements = subscribeToCollection('announcements', setAnnouncements);
    const unsubCash = subscribeToCollection('cashFlow', setCashFlow);
    const unsubOfficials = subscribeToCollection('officials', setOfficials);
    const unsubReports = subscribeToCollection('reports', setReports);
    const unsubLetters = subscribeToCollection('letters', setLetters);
    const unsubRonda = subscribeToCollection('ronda', setRonda);
    const unsubInventory = subscribeToCollection('inventory', setInventory);
    const unsubUmkm = subscribeToCollection('umkm', setUmkm);
    const unsubPolls = subscribeToCollection('polls', setPolls);
    const unsubMarket = subscribeToMarketItems(setMarketItems);
    const unsubRondaLogs = subscribeToRondaLogs(setRondaLogs);
    const unsubNotifs = subscribeToNotifications(setNotifications);

    return () => {
      unsubHouses(); unsubAnnouncements(); unsubCash(); unsubOfficials(); 
      unsubReports(); unsubLetters(); unsubRonda(); unsubInventory(); 
      unsubUmkm(); unsubPolls(); unsubMarket(); unsubRondaLogs(); unsubNotifs();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-0">
        <Routes>
          <Route path="/admin/*" element={
            <AdminRouteWrapper isAdmin={isAdmin} onLogin={() => setIsAdmin(true)}>
              <AdminDashboard 
                houses={houses} announcements={announcements} cashFlow={cashFlow}
                officials={officials} reports={reports} letters={letters}
                ronda={ronda} inventory={inventory} umkm={umkm} polls={polls}
                marketItems={marketItems} rondaLogs={rondaLogs}
              />
            </AdminRouteWrapper>
          }/>
          <Route path="*" element={
            <>
              <PublicHeader notifications={notifications} />
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<PublicHome houses={houses} announcements={announcements} ronda={ronda} reports={reports} officials={officials} />} />
                  <Route path="/voting" element={<PublicVoting polls={polls} />} />
                  <Route path="/market" element={<PublicMarket items={marketItems} />} />
                  <Route path="/services" element={<PublicServices />} />
                  <Route path="/umkm" element={<PublicUMKM umkmData={umkm} />} />
                  <Route path="/info" element={<PublicInfo officials={officials} cashFlow={cashFlow} ronda={ronda} rondaLogs={rondaLogs} />} />
                </Routes>
              </div>
              <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
              <MobileBottomNav />
            </>
          } />
        </Routes>
      </div>
    </HashRouter>
  );
};
