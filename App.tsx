
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Home, FileText, Megaphone, AlertTriangle, User, Users, LogIn, Menu, X, 
  LayoutDashboard, CreditCard, Send, Bot, Check, Trash2, Clock, CheckCircle, XCircle, Search, Edit2, Plus,
  Shield, Phone, TrendingUp, TrendingDown, Wallet, Calendar, ChevronRight, Moon, Sun, CloudRain, 
  MoreVertical, LogOut, ChevronDown, Filter, Download, Save, RefreshCw, Image as ImageIcon, Printer,
  DollarSign, Briefcase, MapPin, Sparkles, Loader2, Store, Archive, History, BarChart3, List, Grid, Eye,
  Contact, CalendarDays, Map, Settings, Upload, FileImage, Package, PenTool, ShoppingBag, Coins
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { jsPDF } from "jspdf";

// Components & Services
import { Logo, generateHouses, MOCK_ANNOUNCEMENTS, MOCK_UMKM, INITIAL_REPORTS, INITIAL_LETTERS, MOCK_RONDA, MOCK_CASHFLOW, MOCK_GALLERY, RT_ADDRESS, APP_NAME, INITIAL_OFFICIALS, DEFAULT_PDF_CONFIG, MOCK_INVENTORY } from './constants';
import { House, Announcement, Report, LetterRequest, PaymentStatus, UMKM, CashFlow, Official, RondaSchedule, PdfConfig, InventoryItem } from './types';
import { HouseMap } from './components/HouseMap';
import { generateAnnouncementDraft } from './services/geminiService';
import { generateSuratPengantar } from './services/pdfService';
import { AdminRouteWrapper, AdminLogin } from './components/AdminComponents'; 
import { ChatBot } from './components/ChatBot';

// Firebase Services
import { isFirebaseConfigured } from './services/firebaseConfig';
import { 
  subscribeToCollection, 
  addAnnouncementToDb, 
  deleteAnnouncementFromDb, 
  addTransactionToDb, 
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
  seedDatabase,
  addInventoryToDb,
  updateInventoryInDb,
  deleteInventoryFromDb,
  updateRondaSchedule,
  addUMKMToDb,
  updateUMKMInDb,
  deleteUMKMFromDb,
  resetHouseData
} from './services/databaseService';

// --- Shared Components ---

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success' }> = ({ children, variant = 'primary', className, ...props }) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const variants = {
    primary: "bg-brand-blue text-white hover:bg-sky-600 shadow-md shadow-blue-200 border border-transparent",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    success: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Card: React.FC<{ children: React.ReactNode, className?: string, title?: string, action?: React.ReactNode }> = ({ children, className, title, action }) => (
  <div className={`bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-center mb-4 md:mb-6">
        {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </div>
);

// --- Modal Component ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 animate-slide-up overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Panic Button Component ---
const PanicButton = () => {
  return (
    <a 
      href="https://wa.me/?text=TOLONG!%20Ada%20keadaan%20darurat%20di%20RT%20002!"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-24 right-4 md:bottom-10 md:left-10 md:right-auto z-[45] group flex items-center gap-2 animate-bounce-slow"
    >
      <div className="bg-red-600 text-white p-3 md:p-3.5 rounded-full shadow-xl shadow-red-500/40 hover:bg-red-700 hover:scale-110 transition-all ring-4 ring-red-100">
        <Phone size={24} fill="currentColor" />
      </div>
      <span className="bg-white text-red-600 border border-red-100 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-x-4 md:-translate-x-0 group-hover:translate-x-0 whitespace-nowrap hidden sm:block">
        Tombol Darurat
      </span>
    </a>
  );
};

// --- Public Layout Components ---

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Beranda' },
    { path: '/services', icon: FileText, label: 'Layanan' },
    { path: '/umkm', icon: Store, label: 'UMKM' },
    { path: '/info', icon: Shield, label: 'Info RT' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-50 pb-safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-brand-blue' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon size={20} className={isActive ? 'fill-current' : ''} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const PublicHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? "text-brand-blue bg-blue-50" : "text-slate-600 hover:text-brand-blue";

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <Logo />
            </div>
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-1">
              <button onClick={() => navigate('/')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/')}`}>Beranda</button>
              <button onClick={() => navigate('/services')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/services')}`}>Layanan</button>
              <button onClick={() => navigate('/umkm')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/umkm')}`}>UMKM</button>
              <button onClick={() => navigate('/info')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/info')}`}>Info RT</button>
              <Button onClick={() => navigate('/admin')} variant="outline" className="ml-4 text-xs h-9">Login Admin</Button>
            </div>
            
            {/* Mobile Header Action */}
            <div className="flex items-center md:hidden gap-2">
               <button onClick={() => navigate('/admin')} className="p-2 text-slate-400 hover:text-brand-blue">
                 <User size={20}/>
               </button>
            </div>
          </div>
        </div>
      </nav>
      <MobileBottomNav />
    </>
  );
};

const HeroSection = () => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const timeString = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="relative bg-gradient-to-r from-cyan-600 to-blue-700 rounded-3xl overflow-hidden mb-6 md:mb-8 shadow-xl shadow-blue-200 group animate-fade-in">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558036117-15db5275d42b?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay group-hover:scale-105 transition-transform duration-[20s]"></div>
      
      <div className="relative px-6 py-8 md:px-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        <div className="text-center md:text-left text-white max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] md:text-xs font-bold mb-3 tracking-wide uppercase border border-white/30 text-blue-50 shadow-lg">
            RT 002 / RW 020
          </span>
          <h1 className="text-2xl md:text-5xl font-extrabold mb-3 leading-tight drop-shadow-sm">
            Lingkungan Kita,<br/> <span className="text-cyan-200">Keluarga Kita</span>
          </h1>
          <p className="text-blue-50 text-sm md:text-lg font-light leading-relaxed max-w-lg hidden md:block">
            Sistem informasi digital terpadu untuk mewujudkan tetangga rukun, administrasi transparan, dan lingkungan harmonis.
          </p>
        </div>

        {/* Weather & Time Widget - Optimized for Mobile */}
        <div className="w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 md:p-6 text-white w-full md:min-w-[240px] shadow-lg flex flex-row md:flex-col items-center md:items-stretch justify-between gap-4">
               <div className="flex-1 md:flex-none">
                  <p className="text-3xl md:text-4xl font-black tracking-tighter">{timeString}</p>
                  <p className="text-[10px] md:text-xs font-medium text-blue-100 uppercase tracking-widest">{dateString}</p>
               </div>
               <div className="w-px h-10 md:h-px md:w-full bg-white/20"></div>
               <div className="flex flex-col md:flex-row justify-between items-end md:items-center text-right md:text-left">
                  <Sun size={24} className="text-amber-300 animate-spin-slow mb-1 md:mb-0 md:mr-2" />
                  <span className="text-xs font-medium">Cerah 28°C</span>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Public Views ---

const PublicHome = ({ houses, announcements, ronda, reports }: { houses: House[], announcements: Announcement[], ronda: RondaSchedule[], reports: Report[] }) => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 animate-fade-in mb-20 md:mb-20">
      <HeroSection />

      {/* Quick Actions Grid - Horizontal Scroll on Mobile */}
      <div className="flex overflow-x-auto gap-4 pb-4 -mt-2 md:-mt-4 relative z-10 px-1 no-scrollbar snap-x">
        {[
            { label: 'Buat Surat', icon: FileText, color: 'text-brand-blue', bg: 'bg-blue-50', link: '/services' },
            { label: 'Lapor Warga', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50', link: '/services?tab=lapor' },
            { label: 'Info Iuran', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50', link: '/info' },
            { label: 'UMKM', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50', link: '/umkm' },
        ].map((action, idx) => (
             <button key={idx} onClick={() => navigate(action.link)} className="min-w-[100px] flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center gap-2 group snap-start">
                <div className={`p-3 ${action.bg} ${action.color} rounded-full group-hover:scale-110 transition-transform`}>
                    <action.icon size={24} />
                </div>
                <span className="font-bold text-slate-700 text-xs md:text-sm whitespace-nowrap">{action.label}</span>
             </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* House Map - Pass Reports for highlighting issues */}
          <HouseMap 
            houses={houses} 
            isAdmin={false} 
            reports={reports}
            onReportHouse={(house) => navigate(`/services?tab=lapor&houseId=${house.id}`)} 
          />

          {/* Announcements */}
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                <div className="bg-brand-blue/10 p-2 rounded-lg">
                  <Megaphone className="text-brand-blue" size={20} /> 
                </div>
                Info Terbaru
              </h2>
            </div>
            <div className="space-y-4">
              {announcements.map((ann, idx) => (
                <div key={ann.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide ${
                      ann.type === 'Urgent' ? 'bg-rose-100 text-rose-600' :
                      ann.type === 'Event' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ann.type}
                    </span>
                    <span className="text-[10px] md:text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Clock size={12} /> {new Date(ann.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-slate-800 mb-2">{ann.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-xs md:text-sm whitespace-pre-line">{ann.content}</p>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center p-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">Belum ada pengumuman.</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6 md:space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Card title="Ronda Malam Ini" className="bg-gradient-to-b from-slate-800 to-slate-900 text-white border-0 shadow-lg shadow-slate-300">
             <div className="space-y-3">
                {ronda.find(r => r.day === new Date().toLocaleDateString('id-ID', {weekday:'long'}))?.members.map((member, i) => (
                   <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">{i+1}</div>
                      <span className="font-medium text-sm">{member}</span>
                   </div>
                )) || <p className="text-slate-400 text-sm italic py-4 text-center">Tidak ada jadwal ronda hari ini.</p>}
             </div>
             <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <button onClick={() => navigate('/info')} className="text-xs font-bold text-blue-200 hover:text-white transition-colors">Lihat Jadwal Lengkap →</button>
             </div>
          </Card>

          <Card title="Galeri Kegiatan">
             <div className="grid grid-cols-2 gap-2">
                {MOCK_GALLERY.slice(0,4).map(item => (
                   <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                         <span className="text-[10px] text-white font-medium line-clamp-1">{item.title}</span>
                      </div>
                   </div>
                ))}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const PublicServices = ({ pdfConfig }: { pdfConfig: PdfConfig }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'lapor' ? 'lapor' : 'surat';
  const initialHouseId = searchParams.get('houseId') || '';
  
  const [activeTab, setActiveTab] = useState<'surat' | 'lapor' | 'history'>(initialTab as any);
  const [localHistory, setLocalHistory] = useState<any[]>([]);
  
  useEffect(() => {
    try {
      const stored = localStorage.getItem('userRequestHistory');
      if (stored) setLocalHistory(JSON.parse(stored));
    } catch (e) { console.error("Error reading history", e); }
  }, []);

  // Update HouseID if passed from URL
  useEffect(() => {
      if(initialHouseId) {
          if (activeTab === 'lapor') setReportHouseId(initialHouseId);
          if (activeTab === 'surat') setHouseId(initialHouseId);
      }
  }, [initialHouseId, activeTab]);

  const saveToHistory = (item: any) => {
      try {
        const updated = [item, ...localHistory];
        setLocalHistory(updated);
        localStorage.setItem('userRequestHistory', JSON.stringify(updated));
      } catch (e) { console.error("Error saving history", e); }
  };
  
  const [reportType, setReportType] = useState<Report['type']>('Fasilitas');
  const [reportDesc, setReportDesc] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reportHouseId, setReportHouseId] = useState(initialHouseId); 

  const [requestType, setRequestType] = useState<LetterRequest['type']>('Pengantar KTP');
  const [applicantName, setApplicantName] = useState('');
  const [nik, setNik] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'LAKI-LAKI' | 'PEREMPUAN'>('LAKI-LAKI');
  const [religion, setReligion] = useState('Islam');
  const [job, setJob] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<LetterRequest['maritalStatus']>('KAWIN');
  const [addressKtp, setAddressKtp] = useState('');
  const [houseId, setHouseId] = useState(initialHouseId);

  const handleSubmitSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    const letterData: LetterRequest = {
        id: Date.now().toString(),
        type: requestType,
        applicantName, nik, birthPlace, birthDate, gender, religion, job, maritalStatus, addressKtp, houseId,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
    };
    generateSuratPengantar(letterData, pdfConfig);
    await addLetterToDb(letterData);
    saveToHistory({...letterData, category: 'Surat'});
    alert("Permohonan berhasil! Surat telah diunduh.");
    setApplicantName(''); setNik(''); setBirthPlace(''); setBirthDate(''); setJob(''); setAddressKtp(''); setHouseId('');
  };

  const handleSubmitLapor = async (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: any = {
      type: reportType,
      description: reportDesc,
      reporterName: reporterName || "Anonim",
      date: new Date().toISOString().split('T')[0],
      status: 'Baru',
      houseId: reportHouseId ? reportHouseId.toUpperCase() : undefined, // Add House ID to Report
    };
    await addReportToDb(newReport);
    saveToHistory({...newReport, category: 'Laporan', title: `Laporan ${newReport.type}`});
    alert("Laporan berhasil dikirim!");
    setReportDesc(''); setReporterName(''); setReportHouseId('');
  };

  const clearHistory = () => {
      if(confirm("Hapus riwayat lokal?")) {
          setLocalHistory([]);
          localStorage.removeItem('userRequestHistory');
      }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-20">
       <div className="text-center mb-6 md:mb-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2">Layanan Digital</h1>
          <p className="text-sm md:text-base text-slate-500">Urus surat dan laporan warga tanpa perlu antri.</p>
       </div>
       <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[500px]">
          <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-4 md:p-6 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar snap-x">
             <button onClick={() => setActiveTab('surat')} className={`flex-none min-w-[140px] md:min-w-0 p-3 md:p-4 rounded-xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'surat' ? 'bg-white text-brand-blue shadow-md shadow-blue-100 ring-1 ring-blue-100' : 'hover:bg-white hover:shadow-sm text-slate-500'}`}>
                <FileText size={20} className="shrink-0" />
                <div><span className="font-bold block text-sm">Surat Pengantar</span><span className="text-[10px] opacity-70 hidden md:block">KTP, KK, Domisili</span></div>
             </button>
             <button onClick={() => setActiveTab('lapor')} className={`flex-none min-w-[140px] md:min-w-0 p-3 md:p-4 rounded-xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'lapor' ? 'bg-white text-rose-600 shadow-md shadow-rose-100 ring-1 ring-rose-100' : 'hover:bg-white hover:shadow-sm text-slate-500'}`}>
                <AlertTriangle size={20} className="shrink-0" />
                <div><span className="font-bold block text-sm">Lapor Pak RT</span><span className="text-[10px] opacity-70 hidden md:block">Keamanan & Fasilitas</span></div>
             </button>
             <button onClick={() => setActiveTab('history')} className={`flex-none min-w-[140px] md:min-w-0 p-3 md:p-4 rounded-xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'history' ? 'bg-white text-emerald-600 shadow-md shadow-emerald-100 ring-1 ring-emerald-100' : 'hover:bg-white hover:shadow-sm text-slate-500'}`}>
                <History size={20} className="shrink-0" />
                <div><span className="font-bold block text-sm">Riwayat Saya</span><span className="text-[10px] opacity-70 hidden md:block">Log Aktivitas Lokal</span></div>
             </button>
          </div>
          <div className="flex-1 p-6 md:p-8 overflow-y-auto">
             {activeTab === 'surat' && (
                <form onSubmit={handleSubmitSurat} className="space-y-6 animate-fade-in mx-auto md:mx-0">
                   <div className="space-y-4">
                       <h3 className="font-bold text-lg">Buat Surat Pengantar</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <input placeholder="Nama Lengkap" className="p-3 bg-slate-50 border rounded-xl w-full text-sm" value={applicantName} onChange={e=>setApplicantName(e.target.value)} required/>
                           <input placeholder="NIK" type="number" className="p-3 bg-slate-50 border rounded-xl w-full text-sm" value={nik} onChange={e=>setNik(e.target.value)} required/>
                           <input placeholder="Tempat Lahir" className="p-3 bg-slate-50 border rounded-xl w-full text-sm" value={birthPlace} onChange={e=>setBirthPlace(e.target.value)} required/>
                           <input type="date" className="p-3 bg-slate-50 border rounded-xl w-full text-sm" value={birthDate} onChange={e=>setBirthDate(e.target.value)} required/>
                           <input placeholder="Pekerjaan" className="p-3 bg-slate-50 border rounded-xl w-full text-sm" value={job} onChange={e=>setJob(e.target.value)} required/>
                           <select className="p-3 bg-slate-50 border rounded-xl w-full text-sm" value={requestType} onChange={e=>setRequestType(e.target.value as any)}>
                               <option>Pengantar KTP</option><option>Pengantar KK</option><option>Domisili</option><option>Kematian</option><option>Kelahiran</option><option>Surat Keterangan Usaha (SKU)</option>
                           </select>
                           <textarea placeholder="Alamat KTP" className="p-3 bg-slate-50 border rounded-xl w-full text-sm md:col-span-2" value={addressKtp} onChange={e=>setAddressKtp(e.target.value)} required/>
                           <input placeholder="Alamat Domisili (Blok, Cth: C5-01)" className="p-3 bg-slate-50 border rounded-xl w-full text-sm md:col-span-2" value={houseId} onChange={e=>setHouseId(e.target.value)} required/>
                       </div>
                   </div>
                   <Button type="submit" className="w-full py-3">Unduh Surat Pengantar</Button>
                </form>
             )}
             {activeTab === 'lapor' && (
                <form onSubmit={handleSubmitLapor} className="space-y-6 max-w-lg animate-fade-in mx-auto md:mx-0">
                    <div className="space-y-4">
                        <select className="w-full p-3 bg-slate-50 border rounded-xl" value={reportType} onChange={e=>setReportType(e.target.value as any)}><option>Keamanan</option><option>Kebersihan</option><option>Fasilitas</option><option>Lainnya</option></select>
                        <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Lokasi Kejadian / Rumah (Cth: C5-05)" value={reportHouseId} onChange={e=>setReportHouseId(e.target.value)} />
                        <textarea className="w-full p-3 bg-slate-50 border rounded-xl h-32" placeholder="Deskripsi..." value={reportDesc} onChange={e=>setReportDesc(e.target.value)} required></textarea>
                        <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Nama Pelapor (Opsional)" value={reporterName} onChange={e=>setReporterName(e.target.value)} />
                    </div>
                   <Button type="submit" className="w-full py-3 bg-rose-600 text-white">Kirim Laporan</Button>
                </form>
             )}
             {activeTab === 'history' && (
                 <div className="animate-fade-in space-y-3">
                     <div className="flex justify-between items-center mb-4"><h3 className="font-bold">Riwayat Aktivitas</h3><button onClick={clearHistory} className="text-xs text-rose-500">Hapus</button></div>
                     {localHistory.map((item, idx) => (
                         <div key={idx} className="bg-slate-50 p-3 rounded-lg border flex justify-between"><div><p className="font-bold text-sm">{item.type||item.title}</p><p className="text-xs text-slate-500">{item.date}</p></div><CheckCircle size={16} className="text-slate-300"/></div>
                     ))}
                 </div>
             )}
          </div>
       </div>
    </div>
  );
};

const PublicUMKM = ({ umkmData }: { umkmData: UMKM[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    
    // Gunakan data dari props, fallback ke array kosong jika belum ada
    const dataToShow = umkmData.length > 0 ? umkmData : []; 

    const categories = ['All', ...Array.from(new Set(dataToShow.map(u => u.category)))];
    const filteredUMKM = dataToShow.filter(u => (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.description.toLowerCase().includes(searchTerm.toLowerCase())) && (filterCategory === 'All' || u.category === filterCategory));

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-20">
             <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">UMKM & Jasa Tetangga</h1>
             </div>
             <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-sm border mb-6 flex flex-col md:flex-row gap-3">
                 <input type="text" placeholder="Cari..." className="w-full p-2 bg-slate-50 border rounded-xl text-sm" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                 <div className="flex gap-2 overflow-x-auto no-scrollbar">{categories.map(cat => <button key={cat} onClick={()=>setFilterCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-bold border ${filterCategory===cat?'bg-purple-600 text-white':'bg-white text-slate-600'}`}>{cat}</button>)}</div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredUMKM.map(u => (
                    <div key={u.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-all">
                        <div className="h-40 bg-slate-200 relative"><img src={u.image} className="w-full h-full object-cover" onError={(e)=>{(e.target as HTMLImageElement).src='https://via.placeholder.com/300x200?text=No+Image'}}/><span className="absolute top-2 left-2 bg-white/90 px-2 py-1 text-[10px] font-bold rounded">{u.category}</span></div>
                        <div className="p-4"><h3 className="font-bold">{u.name}</h3><p className="text-xs text-slate-500 mb-2">{u.owner}</p><p className="text-sm line-clamp-2 text-slate-600 mb-4">{u.description}</p><a href={`https://wa.me/${u.contact}`} className="block w-full py-2 bg-slate-800 text-white text-center rounded-xl text-xs font-bold">Hubungi</a></div>
                    </div>
                ))}
                {filteredUMKM.length === 0 && <div className="col-span-full text-center py-10 text-slate-400">Belum ada data UMKM.</div>}
             </div>
        </div>
    );
};

const PublicInfo = ({ officials, cashFlow, ronda }: { officials: Official[], cashFlow: CashFlow[], ronda: RondaSchedule[] }) => {
    const totalIncome = cashFlow.filter(c => c.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = cashFlow.filter(c => c.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    const currentBalance = totalIncome - totalExpense;
    return (
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-20 space-y-8">
            <div className="text-center"><h1 className="text-2xl font-bold">Transparansi RT</h1></div>
            <section>
                <h2 className="text-lg font-bold mb-4">Struktur Pengurus</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{officials.map(o=><div key={o.id} className="bg-white p-4 rounded-xl border text-center"><img src={o.photo||`https://ui-avatars.com/api/?name=${o.name}&background=random`} className="w-12 h-12 rounded-full mx-auto mb-2"/><p className="font-bold text-sm">{o.name}</p><p className="text-xs text-brand-blue">{o.role}</p></div>)}</div>
            </section>
            <section>
                 <h2 className="text-lg font-bold mb-4">Laporan Kas (Saldo: Rp {currentBalance.toLocaleString()})</h2>
                 <div className="bg-white rounded-xl border overflow-hidden">
                     <div className="max-h-64 overflow-y-auto">{cashFlow.slice(0,5).map(c=><div key={c.id} className="flex justify-between p-3 border-b text-sm"><span>{c.description}</span><span className={c.type==='Income'?'text-emerald-600':'text-rose-600'}>{c.amount.toLocaleString()}</span></div>)}</div>
                 </div>
            </section>
            <section>
                <h2 className="text-lg font-bold mb-4">Jadwal Ronda</h2>
                <div className="bg-white rounded-xl border p-4 space-y-3">
                    {ronda.map((r,i)=><div key={i} className="flex justify-between border-b last:border-0 pb-2"><span className="font-bold w-20">{r.day}</span><span className="text-sm text-slate-600 text-right">{r.members.join(', ')}</span></div>)}
                </div>
            </section>
        </div>
    );
};

// --- Admin Components ---

const AdminDashboard = ({ 
  houses, 
  announcements, 
  cashFlow,
  officials,
  reports,
  letters,
  ronda, 
  inventory,
  umkm, // New Prop
  pdfConfig,
  setPdfConfig
}: { 
  houses: House[], 
  announcements: Announcement[],
  cashFlow: CashFlow[],
  officials: Official[],
  reports: Report[],
  letters: LetterRequest[],
  ronda: RondaSchedule[],
  inventory: InventoryItem[],
  umkm: UMKM[],
  pdfConfig: PdfConfig,
  setPdfConfig: (config: PdfConfig) => void
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'announcement' | 'cash' | 'official' | 'editHouse' | 'inventory' | 'ronda' | 'umkm' | 'dues'>('announcement');
  
  // -- Resident Management State --
  const [residentView, setResidentView] = useState<'grid' | 'table'>('table');
  const [searchResident, setSearchResident] = useState('');
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [editHouseForm, setEditHouseForm] = useState({ headOfFamily: '', occupants: 0, phone: '', paymentStatus: '' });

  // -- Service Management State --
  const [serviceTab, setServiceTab] = useState<'surat' | 'laporan'>('surat');

  // State Inputs
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<Announcement['type']>('General');
  
  // AI Draft State
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftTopic, setDraftTopic] = useState('');
  
  // Cashflow Inputs
  const [cashDesc, setCashDesc] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashType, setCashType] = useState<'Income' | 'Expense'>('Income');
  const [cashCategory, setCashCategory] = useState('Iuran');

  // Dues (Iuran) Inputs
  const [duesHouseId, setDuesHouseId] = useState('');
  const [duesAmount, setDuesAmount] = useState('25000');
  const [duesStatus, setDuesStatus] = useState<PaymentStatus>(PaymentStatus.PAID);

  // Official Inputs
  const [offId, setOffId] = useState<string | null>(null); 
  const [offName, setOffName] = useState('');
  const [offRole, setOffRole] = useState('');
  const [offPhone, setOffPhone] = useState('');
  const [offHouse, setOffHouse] = useState('');
  const [offPhoto, setOffPhoto] = useState('');

  // Inventory Inputs
  const [invId, setInvId] = useState<string | null>(null);
  const [invName, setInvName] = useState('');
  const [invTotal, setInvTotal] = useState('');
  const [invAvailable, setInvAvailable] = useState('');
  const [invCondition, setInvCondition] = useState<'Baik' | 'Perlu Perbaikan' | 'Rusak'>('Baik');
  const [invNotes, setInvNotes] = useState('');

  // UMKM Inputs
  const [umkmId, setUmkmId] = useState<string | null>(null);
  const [umkmName, setUmkmName] = useState('');
  const [umkmOwner, setUmkmOwner] = useState('');
  const [umkmCategory, setUmkmCategory] = useState('');
  const [umkmDesc, setUmkmDesc] = useState('');
  const [umkmContact, setUmkmContact] = useState('');
  const [umkmImage, setUmkmImage] = useState('');

  // Ronda Edit State
  const [selectedRondaId, setSelectedRondaId] = useState<string | null>(null);
  const [rondaDay, setRondaDay] = useState('');
  const [rondaMembers, setRondaMembers] = useState(''); 

  // Config State (Local Edit)
  const [localConfig, setLocalConfig] = useState<PdfConfig>(pdfConfig);

  // Logout Logic
  const navigate = useNavigate();

  // Handlers
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAnn: any = { title: annTitle, content: annContent, type: annType, date: new Date().toISOString() };
    await addAnnouncementToDb(newAnn);
    setIsModalOpen(false); resetForms();
  };

  const handleDeleteAnnouncement = async (id: string) => { if (confirm("Hapus pengumuman ini?")) await deleteAnnouncementFromDb(id); };

  const handleGenerateDraft = async () => {
    if(!draftTopic) return;
    setIsGenerating(true);
    const draft = await generateAnnouncementDraft(draftTopic);
    setAnnContent(draft); setAnnTitle(draftTopic); setIsGenerating(false);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
     e.preventDefault();
     const newTx: any = { description: cashDesc, amount: parseInt(cashAmount), type: cashType, category: cashCategory, date: new Date().toISOString().split('T')[0] };
     await addTransactionToDb(newTx);
     setIsModalOpen(false); resetForms();
  };
  const handleDeleteTransaction = async (id: string) => { if (confirm("Hapus transaksi ini?")) await deleteTransactionFromDb(id); };

  const handleSaveDues = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duesHouseId) { alert("Pilih nomor rumah terlebih dahulu!"); return; }

    // 1. Update House Status
    await updateHouseData(duesHouseId, { paymentStatus: duesStatus });

    // 2. Add to Cashflow if Status is 'Lunas'
    if (duesStatus === PaymentStatus.PAID) {
        const house = houses.find(h => h.id === duesHouseId);
        const description = `Iuran Warga ${duesHouseId} (${house?.headOfFamily || 'Warga'})`;
        const newTx: any = {
            description: description,
            amount: parseInt(duesAmount),
            type: 'Income',
            category: 'Iuran Warga',
            date: new Date().toISOString().split('T')[0]
        };
        await addTransactionToDb(newTx);
    }
    
    alert(`Status pembayaran ${duesHouseId} diperbarui menjadi ${duesStatus}!`);
    setIsModalOpen(false); resetForms();
  };

  const handleExportCSV = () => {
      const headers = ["Blok", "Nomor", "Kepala Keluarga", "Jumlah Penghuni", "Status Hunian", "Status Iuran", "No. HP"];
      const rows = houses.map(h => [
          h.block, 
          h.number, 
          `"${h.headOfFamily}"`, 
          h.occupants, 
          h.status, 
          h.paymentStatus, 
          h.phone || '-'
      ]);

      const csvContent = [
          headers.join(","),
          ...rows.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Data_Warga_RT002_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- INVENTORY HANDLERS ---
  const handleSaveInventory = async (e: React.FormEvent) => {
      e.preventDefault();
      const itemData = {
          name: invName,
          total: parseInt(invTotal),
          available: parseInt(invAvailable),
          condition: invCondition,
          notes: invNotes
      };
      if (invId) {
          await updateInventoryInDb(invId, itemData);
      } else {
          await addInventoryToDb(itemData);
      }
      setIsModalOpen(false); resetForms();
  };

  const openEditInventory = (item: InventoryItem) => {
      setInvId(item.id); setInvName(item.name); setInvTotal(item.total.toString()); setInvAvailable(item.available.toString()); setInvCondition(item.condition); setInvNotes(item.notes || '');
      setModalType('inventory'); setIsModalOpen(true);
  };

  const handleDeleteInventory = async (id: string) => {
      if(confirm("Hapus barang ini dari inventaris?")) await deleteInventoryFromDb(id);
  };

  // --- UMKM HANDLERS ---
  const handleSaveUMKM = async (e: React.FormEvent) => {
      e.preventDefault();
      const umkmData = { name: umkmName, owner: umkmOwner, category: umkmCategory, description: umkmDesc, contact: umkmContact, image: umkmImage };
      if (umkmId) await updateUMKMInDb(umkmId, umkmData); else await addUMKMToDb(umkmData);
      setIsModalOpen(false); resetForms();
  };

  const openEditUMKM = (u: UMKM) => {
      setUmkmId(u.id); setUmkmName(u.name); setUmkmOwner(u.owner); setUmkmCategory(u.category); setUmkmDesc(u.description); setUmkmContact(u.contact); setUmkmImage(u.image);
      setModalType('umkm'); setIsModalOpen(true);
  };

  const handleDeleteUMKM = async (id: string) => { if (confirm("Hapus UMKM ini?")) await deleteUMKMFromDb(id); };


  // --- RONDA HANDLERS ---
  const openEditRonda = (schedule: RondaSchedule) => {
      if (!schedule.id) return; 
      setSelectedRondaId(schedule.id);
      setRondaDay(schedule.day);
      setRondaMembers(schedule.members.join(', '));
      setModalType('ronda');
      setIsModalOpen(true);
  };

  const handleSaveRonda = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedRondaId) return;
      const membersArray = rondaMembers.split(',').map(m => m.trim()).filter(m => m !== '');
      await updateRondaSchedule(selectedRondaId, membersArray);
      setIsModalOpen(false); resetForms();
  };

  const handlePrintFinance = () => { /* Existing logic */ };
  const handleSaveOfficial = async (e: React.FormEvent) => {
      e.preventDefault();
      const officialData = { name: offName, role: offRole, phone: offPhone, houseId: offHouse, photo: offPhoto || undefined };
      if (offId) await updateOfficialInDb(offId, officialData); else await addOfficialToDb(officialData);
      setIsModalOpen(false); resetForms();
  };
  const handleDeleteOfficial = async (id: string) => { if (confirm("Hapus?")) await deleteOfficialFromDb(id); };
  const handleEditOfficial = (o: Official) => { setOffId(o.id); setOffName(o.name); setOffRole(o.role); setOffPhone(o.phone); setOffHouse(o.houseId); setOffPhoto(o.photo||''); setModalType('official'); setIsModalOpen(true); };
  
  // -- HOUSE MAP HANDLERS --
  const openEditHouse = (h: House) => { 
      setSelectedHouse(h); 
      setEditHouseForm({ headOfFamily: h.headOfFamily, occupants: h.occupants, phone: h.phone || '', paymentStatus: h.paymentStatus }); 
      setModalType('editHouse'); 
      setIsModalOpen(true); 
  };

  const openDuesModal = (h: House) => {
      setDuesHouseId(h.id);
      setDuesStatus(PaymentStatus.PAID);
      setModalType('dues');
      setIsModalOpen(true);
  };

  const handleSaveHouse = async (e: React.FormEvent) => { e.preventDefault(); if(selectedHouse) await updateHouseData(selectedHouse.id, { headOfFamily: editHouseForm.headOfFamily, occupants: parseInt(editHouseForm.occupants as any), phone: editHouseForm.phone, paymentStatus: editHouseForm.paymentStatus }); setIsModalOpen(false); }
  const handleUpdateReport = async (id: string, s: string) => await updateReportStatus(id, s);
  const handleDeleteReport = async (id: string) => await deleteReportFromDb(id);
  const handleUpdateLetter = async (id: string, s: string) => await updateLetterStatus(id, s);
  const handleDeleteLetter = async (id: string) => await deleteLetterFromDb(id);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PdfConfig) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setLocalConfig(prev => ({ ...prev, [field]: reader.result as string })); reader.readAsDataURL(file); } };
  
  const handleSaveConfig = () => { 
      try {
        setPdfConfig(localConfig); 
        localStorage.setItem('pdf_config', JSON.stringify(localConfig)); 
        alert("Disimpan!"); 
      } catch (e) {
          console.error("Failed to save config to localStorage", e);
          alert("Gagal menyimpan ke penyimpanan lokal (Mungkin file gambar terlalu besar). Konfigurasi tetap aktif di sesi ini.");
      }
  };

  const resetForms = () => {
      setAnnTitle(''); setAnnContent(''); setDraftTopic('');
      setCashDesc(''); setCashAmount(''); setCashType('Income');
      setOffName(''); setOffRole(''); setOffPhone(''); setOffHouse(''); setOffPhoto(''); setOffId(null);
      setInvName(''); setInvTotal(''); setInvAvailable(''); setInvNotes(''); setInvId(null);
      setRondaMembers(''); setSelectedRondaId(null);
      setUmkmName(''); setUmkmOwner(''); setUmkmCategory(''); setUmkmDesc(''); setUmkmContact(''); setUmkmImage(''); setUmkmId(null);
      setDuesHouseId(''); setDuesAmount('25000'); setDuesStatus(PaymentStatus.PAID);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white fixed h-full hidden md:flex flex-col overflow-y-auto z-20">
         <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="text-brand-blue"/> Admin Panel</h2>
            <p className="text-xs text-slate-400 mt-1">Manage RT 002/020</p>
         </div>
         <nav className="flex-1 p-4 space-y-1">
            {[
                {id: 'overview', icon: LayoutDashboard, label: 'Overview'},
                {id: 'services', icon: Archive, label: 'Layanan'},
                {id: 'residents', icon: Users, label: 'Data Warga'},
                {id: 'umkm', icon: ShoppingBag, label: 'UMKM Warga'}, // NEW MENU
                {id: 'finance', icon: DollarSign, label: 'Keuangan'},
                {id: 'facilities', icon: Package, label: 'Fasilitas & Jadwal'},
                {id: 'announcements', icon: Megaphone, label: 'Pengumuman'},
                {id: 'officials', icon: Briefcase, label: 'Pengurus'},
                {id: 'settings', icon: Settings, label: 'Pengaturan'},
            ].map(item => (
                <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-brand-blue text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                    <item.icon size={18} /> <span className="font-medium text-sm">{item.label}</span>
                </button>
            ))}
         </nav>
         <div className="p-4 border-t border-slate-800">
            <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                <LogOut size={18} /> <span className="font-medium text-sm">Keluar</span>
            </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 p-4 md:p-8 pb-safe-area-pb md:pb-8 max-w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 md:mb-8">
             <div>
                <button onClick={() => navigate('/')} className="md:hidden text-slate-500 mb-2 flex items-center gap-1 text-sm"><ChevronDown className="rotate-90"/> Home</button>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 uppercase tracking-tight">
                    {activeTab === 'overview' ? 'Dashboard Overview' : 
                    activeTab === 'finance' ? 'Laporan Keuangan' : 
                    activeTab === 'residents' ? 'Database Warga' : 
                    activeTab === 'umkm' ? 'UMKM & Jasa' :
                    activeTab === 'officials' ? 'Struktur Pengurus' : 
                    activeTab === 'services' ? 'Layanan & Laporan' :
                    activeTab === 'facilities' ? 'Fasilitas & Jadwal' :
                    activeTab === 'settings' ? 'Pengaturan Aplikasi' : 'Manajemen Pengumuman'}
                </h1>
             </div>
             <div className="flex items-center gap-3">
                 <div className="bg-white p-2 rounded-full shadow-sm border border-slate-200"><User size={20}/></div>
                 <span className="font-bold text-sm text-slate-700 hidden md:block">Ketua RT</span>
             </div>
          </div>

          {/* Render Tab Content */}
          {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                          <div className="p-4 bg-sky-50 text-sky-600 rounded-xl"><Users size={28}/></div>
                          <div><p className="text-slate-500 text-sm font-medium">Total Warga</p><h3 className="text-2xl font-bold text-slate-800">{houses.filter(h => h.status === 'Occupied').length} KK</h3></div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet size={28}/></div>
                          <div><p className="text-slate-500 text-sm font-medium">Saldo Kas</p><h3 className="text-2xl font-bold text-slate-800">Rp {(cashFlow.reduce((acc, c) => c.type === 'Income' ? acc + c.amount : acc - c.amount, 0)).toLocaleString()}</h3></div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                          <div className="p-4 bg-rose-50 text-rose-600 rounded-xl"><AlertTriangle size={28}/></div>
                          <div><p className="text-slate-500 text-sm font-medium">Laporan Baru</p><h3 className="text-2xl font-bold text-slate-800">{reports.filter(r => r.status === 'Baru').length}</h3></div>
                      </div>
                   </div>
                   <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                      <h3 className="font-bold text-slate-800 mb-4">Aktivitas Terkini (Layanan)</h3>
                      <div className="space-y-4">
                          {letters.slice(0, 3).map(l => (
                              <div key={l.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  <p className="text-sm text-slate-600"><span className="font-bold">{l.applicantName}</span> mengajukan <span className="font-bold">{l.type}</span>.</p>
                                  <span className="ml-auto text-xs text-slate-400">{l.date}</span>
                              </div>
                          ))}
                          {reports.slice(0, 3).map(r => (
                              <div key={r.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50">
                                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                  <p className="text-sm text-slate-600">Laporan <span className="font-bold">{r.type}</span> dari {r.reporterName}.</p>
                                  <span className="ml-auto text-xs text-slate-400">{r.date}</span>
                              </div>
                          ))}
                      </div>
                   </div>
              </div>
          )}

          {activeTab === 'umkm' && (
               <div className="animate-fade-in space-y-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border">
                      <h2 className="font-bold text-lg">Daftar Usaha Warga</h2>
                      <Button onClick={() => { resetForms(); setModalType('umkm'); setIsModalOpen(true); }}><Plus size={18}/> Tambah UMKM</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {umkm.map(u => (
                          <div key={u.id} className="bg-white rounded-xl shadow-sm border overflow-hidden group">
                              <div className="h-32 bg-slate-200 relative">
                                  <img src={u.image} className="w-full h-full object-cover" onError={(e)=>{(e.target as HTMLImageElement).src='https://via.placeholder.com/300x200?text=No+Image'}} />
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => openEditUMKM(u)} className="p-1.5 bg-white rounded-lg shadow text-slate-700 hover:text-blue-600"><Edit2 size={14}/></button>
                                      <button onClick={() => handleDeleteUMKM(u.id)} className="p-1.5 bg-white rounded-lg shadow text-slate-700 hover:text-rose-600"><Trash2 size={14}/></button>
                                  </div>
                              </div>
                              <div className="p-4">
                                  <div className="flex justify-between items-start">
                                      <h3 className="font-bold text-slate-800">{u.name}</h3>
                                      <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-bold">{u.category}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">Pemilik: {u.owner}</p>
                                  <p className="text-xs mt-2 line-clamp-2">{u.description}</p>
                              </div>
                          </div>
                      ))}
                      {umkm.length === 0 && <div className="col-span-full text-center py-10 text-slate-400">Belum ada data UMKM.</div>}
                  </div>
               </div>
          )}

          {activeTab === 'residents' && (
              <div className="animate-fade-in space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="relative w-full md:w-96">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input type="text" placeholder="Cari warga..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={searchResident} onChange={(e) => setSearchResident(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                           <Button onClick={handleExportCSV} variant="outline" className="text-xs h-10">
                               <Download size={16}/> Export Data (.csv)
                           </Button>
                           <div className="flex bg-slate-100 p-1 rounded-lg">
                              <button onClick={() => setResidentView('grid')} className={`p-2 rounded-md transition-all ${residentView === 'grid' ? 'bg-white shadow text-brand-blue' : 'text-slate-500'}`}><Grid size={20} /></button>
                              <button onClick={() => setResidentView('table')} className={`p-2 rounded-md transition-all ${residentView === 'table' ? 'bg-white shadow text-brand-blue' : 'text-slate-500'}`}><List size={20} /></button>
                           </div>
                      </div>
                  </div>
                  {residentView === 'grid' ? (
                      // Pass reports to HouseMap in Admin view as well
                      <HouseMap 
                        houses={houses} 
                        isAdmin={true} 
                        onEditHouse={openEditHouse} 
                        onPayDues={openDuesModal}
                        reports={reports} 
                      />
                  ) : (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                          <table className="w-full text-sm text-left">
                              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs"><tr><th className="p-4">Rumah</th><th className="p-4">Kepala Keluarga</th><th className="p-4">Status</th><th className="p-4">Iuran</th><th className="p-4 text-center">Aksi</th></tr></thead>
                              <tbody className="divide-y divide-slate-100">{houses.filter(h => h.headOfFamily.toLowerCase().includes(searchResident.toLowerCase()) || h.id.toLowerCase().includes(searchResident.toLowerCase())).map(h => (
                                      <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="p-4 font-bold">{h.id}</td><td className="p-4">{h.headOfFamily}</td>
                                          <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${h.status === 'Occupied' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{h.status}</span></td>
                                          <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${h.paymentStatus === 'Lunas' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{h.paymentStatus}</span></td>
                                          <td className="p-4 text-center"><button onClick={() => openEditHouse(h)} className="text-slate-400 hover:text-brand-blue"><Edit2 size={16} /></button></td>
                                      </tr>
                              ))}</tbody>
                          </table>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'facilities' && (
              <div className="animate-fade-in space-y-8">
                  <section>
                      <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Package size={20}/> Inventaris RT</h2>
                          <Button onClick={() => { resetForms(); setModalType('inventory'); setIsModalOpen(true); }} className="text-xs h-9"><Plus size={16}/> Tambah Barang</Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {inventory.map(item => (
                              <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative group">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className={`p-2 rounded-lg ${item.total > 0 && item.available > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                          <Package size={20}/>
                                      </div>
                                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${item.condition === 'Baik' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>{item.condition}</span>
                                  </div>
                                  <h3 className="font-bold text-slate-800">{item.name}</h3>
                                  <div className="text-xs text-slate-500 mt-2 space-y-1">
                                      <div className="flex justify-between"><span>Total:</span> <span className="font-bold">{item.total} unit</span></div>
                                      <div className="flex justify-between"><span>Tersedia:</span> <span className="font-bold text-emerald-600">{item.available} unit</span></div>
                                  </div>
                                  {item.notes && <p className="text-[10px] text-slate-400 mt-3 italic bg-slate-50 p-1.5 rounded">Catatan: {item.notes}</p>}
                                  
                                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => openEditInventory(item)} className="p-1 bg-white border rounded shadow hover:bg-slate-50"><Edit2 size={12}/></button>
                                      <button onClick={() => handleDeleteInventory(item.id)} className="p-1 bg-white border rounded shadow hover:bg-red-50 text-red-500"><Trash2 size={12}/></button>
                                  </div>
                              </div>
                          ))}
                          {inventory.length === 0 && <div className="col-span-full text-center py-8 text-slate-400 border border-dashed rounded-xl">Belum ada data inventaris.</div>}
                      </div>
                  </section>

                  <section>
                      <div className="flex items-center gap-2 mb-4">
                          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Shield size={20}/> Manajemen Jadwal Ronda</h2>
                          <span className="text-xs text-slate-400">(Klik hari untuk mengubah petugas)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {ronda.map((r, i) => (
                              <div 
                                key={i} 
                                onClick={() => openEditRonda(r)}
                                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:border-brand-blue hover:shadow-md transition-all group"
                              >
                                  <div className="flex justify-between items-center mb-3">
                                      <h3 className="font-bold text-slate-800">{r.day}</h3>
                                      <Edit2 size={14} className="text-slate-300 group-hover:text-brand-blue"/>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                      {r.members.length > 0 ? r.members.map((m, idx) => (
                                          <span key={idx} className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-100">{m}</span>
                                      )) : <span className="text-xs text-slate-400 italic">Belum ada petugas</span>}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </section>
              </div>
          )}

          {activeTab === 'settings' && (
              <div className="animate-fade-in max-w-2xl space-y-6">
                 {/* Kustomisasi Kop Surat */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><FileImage size={20}/> Kustomisasi Kop Surat</h2>
                    <div className="space-y-6">
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Nama Organisasi</label><input type="text" className="w-full p-2 border rounded-lg" value={localConfig.rtName} onChange={(e) => setLocalConfig({...localConfig, rtName: e.target.value})} /></div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Alamat Lengkap</label><input type="text" className="w-full p-2 border rounded-lg" value={localConfig.rtAddress} onChange={(e) => setLocalConfig({...localConfig, rtAddress: e.target.value})} /></div>
                        <div className="border border-dashed p-4 bg-slate-50"><label className="text-sm font-bold">Logo Surat</label><input type="file" onChange={(e) => handleFileChange(e, 'logo')} className="mt-2 text-xs"/></div>
                        <div className="border border-dashed p-4 bg-slate-50"><label className="text-sm font-bold">Stempel</label><input type="file" onChange={(e) => handleFileChange(e, 'stamp')} className="mt-2 text-xs"/></div>
                        <div className="border border-dashed p-4 bg-slate-50"><label className="text-sm font-bold">Tanda Tangan</label><input type="file" onChange={(e) => handleFileChange(e, 'signature')} className="mt-2 text-xs"/></div>
                        <Button onClick={handleSaveConfig} className="w-full">Simpan Pengaturan</Button>
                    </div>
                 </div>
              </div>
          )}
          {activeTab === 'announcements' && (
              <div className="animate-fade-in space-y-6">
                  <div className="flex justify-end"><Button onClick={() => { resetForms(); setModalType('announcement'); setIsModalOpen(true); }}><Plus size={18}/> Buat Pengumuman</Button></div>
                  <div className="grid gap-4">{announcements.map(ann => (<div key={ann.id} className="bg-white p-6 rounded-2xl border flex justify-between"><div><h3 className="font-bold">{ann.title}</h3><p className="text-sm text-slate-600">{ann.content}</p></div><button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-rose-400"><Trash2/></button></div>))}</div>
              </div>
          )}
          {activeTab === 'finance' && (
               <div className="animate-fade-in space-y-6">
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => { resetForms(); setModalType('dues'); setIsModalOpen(true); }} className="bg-slate-800 text-white"><Coins size={18}/> Catat Iuran Warga</Button>
                    <Button onClick={() => { resetForms(); setModalType('cash'); setIsModalOpen(true); }} variant="success"><Plus size={18}/> Catat Transaksi Lain</Button>
                  </div>
                  <div className="bg-white rounded-2xl border overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="p-4">Tanggal</th><th className="p-4">Ket</th><th className="p-4 text-right">Jml</th><th className="p-4 text-center">Aksi</th></tr></thead><tbody>{cashFlow.map(cf=><tr key={cf.id} className="hover:bg-slate-50"><td className="p-4">{cf.date}</td><td className="p-4">{cf.description}</td><td className={`p-4 text-right font-bold ${cf.type==='Income'?'text-emerald-600':'text-rose-600'}`}>{cf.amount.toLocaleString()}</td><td className="p-4 text-center"><button onClick={()=>handleDeleteTransaction(cf.id)}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>
               </div>
          )}
          {activeTab === 'services' && (
              <div className="animate-fade-in space-y-6">
                  <div className="flex border-b"><button onClick={()=>setServiceTab('surat')} className={`px-6 py-3 border-b-2 ${serviceTab==='surat'?'border-brand-blue':'border-transparent'}`}>Surat</button><button onClick={()=>setServiceTab('laporan')} className={`px-6 py-3 border-b-2 ${serviceTab==='laporan'?'border-brand-blue':'border-transparent'}`}>Laporan</button></div>
                  {serviceTab==='surat' && <div className="bg-white rounded-2xl border divide-y">{letters.map(l=><div key={l.id} className="p-6 flex justify-between"><div><p className="font-bold">{l.applicantName}</p><p className="text-xs">{l.type}</p></div><div className="flex gap-2">{l.status==='Pending'&&(<> <button onClick={()=>handleUpdateLetter(l.id,'Approved')} className="text-emerald-600 font-bold text-xs">Setuju</button><button onClick={()=>handleUpdateLetter(l.id,'Rejected')} className="text-rose-600 font-bold text-xs">Tolak</button></>)}<button onClick={()=>handleDeleteLetter(l.id)}><Trash2 size={16}/></button></div></div>)}</div>}
                  {serviceTab==='laporan' && <div className="bg-white rounded-2xl border divide-y">{reports.map(r=><div key={r.id} className="p-6 flex justify-between"><div><p className="text-sm">{r.description}</p><p className="text-xs text-slate-500">{r.reporterName}</p><p className="text-[10px] text-slate-400">Lokasi: {r.houseId || '-'}</p></div><div className="flex gap-2">{r.status==='Baru'&&<button onClick={()=>handleUpdateReport(r.id,'Diproses')} className="text-blue-600 font-bold text-xs">Proses</button>}<button onClick={()=>handleDeleteReport(r.id)}><Trash2 size={16}/></button></div></div>)}</div>}
              </div>
          )}
          {activeTab === 'officials' && (
               <div className="animate-fade-in space-y-6">
                  <div className="flex justify-end"><Button onClick={() => { resetForms(); setModalType('official'); setIsModalOpen(true); }}><Plus size={18}/> Tambah</Button></div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{officials.map(off=><div key={off.id} className="bg-white p-6 rounded-2xl border flex items-center gap-4 relative group"><img src={off.photo||`https://ui-avatars.com/api/?name=${off.name}&background=random`} className="w-16 h-16 rounded-full"/><div className="flex-1"><h3 className="font-bold">{off.name}</h3><p className="text-xs text-brand-blue">{off.role}</p></div><button onClick={()=>handleDeleteOfficial(off.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button></div>)}</div>
               </div>
          )}
      </div>

      {/* Unified Modal */}
      <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={
              modalType === 'announcement' ? 'Buat Pengumuman Baru' : 
              modalType === 'cash' ? 'Catat Transaksi Kas' : 
              modalType === 'editHouse' ? 'Edit Data Warga' :
              modalType === 'inventory' ? (invId ? 'Edit Barang' : 'Tambah Inventaris') :
              modalType === 'umkm' ? (umkmId ? 'Edit UMKM' : 'Tambah UMKM Baru') :
              modalType === 'ronda' ? 'Edit Jadwal Ronda' :
              modalType === 'dues' ? 'Catat Iuran Warga' :
              offId ? 'Edit Data Pengurus' : 'Tambah Pengurus Baru'
          }
      >
          {modalType === 'announcement' && (
             <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                 <div className="bg-violet-50 p-4 rounded-xl border border-violet-100"><div className="flex gap-2"><input type="text" placeholder="Topik..." className="flex-1 px-3 py-2 border rounded-lg text-sm" value={draftTopic} onChange={(e) => setDraftTopic(e.target.value)} /><button type="button" onClick={handleGenerateDraft} disabled={isGenerating} className="bg-violet-600 text-white px-3 py-2 rounded-lg text-xs font-bold">{isGenerating?'...':'Draft AI'}</button></div></div>
                 <input required type="text" placeholder="Judul" className="w-full p-2 border rounded-lg" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} />
                 <select className="w-full p-2 border rounded-lg" value={annType} onChange={(e) => setAnnType(e.target.value as any)}><option value="General">General</option><option value="Urgent">Penting</option><option value="Event">Event</option></select>
                 <textarea required placeholder="Isi..." className="w-full p-2 border rounded-lg h-32" value={annContent} onChange={(e) => setAnnContent(e.target.value)} />
                 <Button type="submit" className="w-full">Terbitkan</Button>
             </form>
          )}

          {modalType === 'inventory' && (
              <form onSubmit={handleSaveInventory} className="space-y-4">
                  <div><label className="text-xs font-bold uppercase mb-1 block">Nama Barang</label><input required className="w-full p-2 border rounded-lg" value={invName} onChange={e=>setInvName(e.target.value)}/></div>
                  <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-bold uppercase mb-1 block">Total Unit</label><input required type="number" className="w-full p-2 border rounded-lg" value={invTotal} onChange={e=>setInvTotal(e.target.value)}/></div>
                      <div><label className="text-xs font-bold uppercase mb-1 block">Tersedia</label><input required type="number" className="w-full p-2 border rounded-lg" value={invAvailable} onChange={e=>setInvAvailable(e.target.value)}/></div>
                  </div>
                  <div><label className="text-xs font-bold uppercase mb-1 block">Kondisi</label><select className="w-full p-2 border rounded-lg" value={invCondition} onChange={e=>setInvCondition(e.target.value as any)}><option>Baik</option><option>Perlu Perbaikan</option><option>Rusak</option></select></div>
                  <div><label className="text-xs font-bold uppercase mb-1 block">Catatan</label><textarea className="w-full p-2 border rounded-lg h-20" value={invNotes} onChange={e=>setInvNotes(e.target.value)}/></div>
                  <Button type="submit" className="w-full">Simpan Inventaris</Button>
              </form>
          )}

          {modalType === 'umkm' && (
              <form onSubmit={handleSaveUMKM} className="space-y-4">
                  <input required placeholder="Nama Usaha" className="w-full p-2 border rounded-lg" value={umkmName} onChange={e=>setUmkmName(e.target.value)}/>
                  <input required placeholder="Nama Pemilik" className="w-full p-2 border rounded-lg" value={umkmOwner} onChange={e=>setUmkmOwner(e.target.value)}/>
                  <select required className="w-full p-2 border rounded-lg" value={umkmCategory} onChange={e=>setUmkmCategory(e.target.value)}>
                    <option value="" disabled>Pilih Kategori</option>
                    <option value="Kuliner">Kuliner</option>
                    <option value="Jasa">Jasa</option>
                    <option value="Retail">Retail</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <input required type="number" placeholder="No. WA (cth: 628123...)" className="w-full p-2 border rounded-lg" value={umkmContact} onChange={e=>setUmkmContact(e.target.value)}/>
                  <input placeholder="URL Foto (Opsional)" className="w-full p-2 border rounded-lg" value={umkmImage} onChange={e=>setUmkmImage(e.target.value)}/>
                  <textarea required placeholder="Deskripsi Singkat" className="w-full p-2 border rounded-lg h-24" value={umkmDesc} onChange={e=>setUmkmDesc(e.target.value)}/>
                  <Button type="submit" className="w-full">Simpan UMKM</Button>
              </form>
          )}

          {modalType === 'ronda' && (
              <form onSubmit={handleSaveRonda} className="space-y-4">
                  <div className="bg-slate-100 p-3 rounded-lg text-center font-bold">{rondaDay}</div>
                  <div>
                      <label className="text-xs font-bold uppercase mb-1 block">Daftar Petugas (Pisahkan dengan koma)</label>
                      <textarea 
                          className="w-full p-3 border rounded-lg h-32 text-sm" 
                          placeholder="Pak Budi, Pak Asep, Pak Cecep..."
                          value={rondaMembers}
                          onChange={e=>setRondaMembers(e.target.value)}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">*Masukkan nama warga yang bertugas.</p>
                  </div>
                  <Button type="submit" className="w-full">Simpan Jadwal</Button>
              </form>
          )}

          {modalType === 'dues' && (
              <form onSubmit={handleSaveDues} className="space-y-4">
                  <div>
                      <label className="text-xs font-bold uppercase mb-1 block">Pilih Rumah / Warga</label>
                      <div className="relative">
                          <input 
                              type="text" 
                              list="house-options" 
                              className="w-full p-2 border rounded-lg" 
                              placeholder="Cari Blok / Nama... (Cth: C5-01)"
                              value={duesHouseId}
                              onChange={(e) => setDuesHouseId(e.target.value)}
                          />
                          <datalist id="house-options">
                              {houses.map(h => (
                                  <option key={h.id} value={h.id}>{h.headOfFamily} ({h.paymentStatus})</option>
                              ))}
                          </datalist>
                      </div>
                  </div>
                  <div>
                      <label className="text-xs font-bold uppercase mb-1 block">Jumlah Iuran (Rp)</label>
                      <input 
                        type="number" 
                        required 
                        className="w-full p-2 border rounded-lg" 
                        value={duesAmount} 
                        onChange={e=>setDuesAmount(e.target.value)}
                      />
                  </div>
                  <div>
                      <label className="text-xs font-bold uppercase mb-1 block">Status Pembayaran</label>
                      <select 
                        className="w-full p-2 border rounded-lg" 
                        value={duesStatus} 
                        onChange={e=>setDuesStatus(e.target.value as PaymentStatus)}
                      >
                          <option value="Lunas">Lunas</option>
                          <option value="Belum Lunas">Belum Lunas</option>
                          <option value="Menunggak">Menunggak</option>
                      </select>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                      <p>Catatan: Jika status "Lunas", data akan otomatis masuk ke Laporan Kas.</p>
                  </div>
                  <Button type="submit" className="w-full">Simpan Pembayaran</Button>
              </form>
          )}

          {modalType === 'cash' && (
              <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div className="flex gap-4"><label><input type="radio" checked={cashType==='Income'} onChange={()=>setCashType('Income')}/> Masuk</label><label><input type="radio" checked={cashType==='Expense'} onChange={()=>setCashType('Expense')}/> Keluar</label></div>
                  <input required placeholder="Deskripsi" className="w-full p-2 border rounded-lg" value={cashDesc} onChange={e=>setCashDesc(e.target.value)}/>
                  <input required type="number" placeholder="Jumlah" className="w-full p-2 border rounded-lg" value={cashAmount} onChange={e=>setCashAmount(e.target.value)}/>
                  <select className="w-full p-2 border rounded-lg" value={cashCategory} onChange={e=>setCashCategory(e.target.value)}><option>Iuran Warga</option><option>Sumbangan</option><option>Operasional</option><option>Lain-lain</option></select>
                  <Button type="submit" className="w-full">Simpan</Button>
              </form>
          )}
          {modalType === 'official' && (
              <form onSubmit={handleSaveOfficial} className="space-y-4">
                  <input required placeholder="Nama" className="w-full p-2 border rounded-lg" value={offName} onChange={e=>setOffName(e.target.value)}/>
                  <input required placeholder="Jabatan" className="w-full p-2 border rounded-lg" value={offRole} onChange={e=>setOffRole(e.target.value)}/>
                  <input required placeholder="HP" className="w-full p-2 border rounded-lg" value={offPhone} onChange={e=>setOffPhone(e.target.value)}/>
                  <input required placeholder="Rumah" className="w-full p-2 border rounded-lg" value={offHouse} onChange={e=>setOffHouse(e.target.value)}/>
                  <input placeholder="Foto URL" className="w-full p-2 border rounded-lg" value={offPhoto} onChange={e=>setOffPhoto(e.target.value)}/>
                  <Button type="submit" className="w-full">Simpan</Button>
              </form>
          )}
           {modalType === 'editHouse' && (
              <form onSubmit={handleSaveHouse} className="space-y-4">
                  <input required placeholder="Kepala Keluarga" className="w-full p-2 border rounded-lg" value={editHouseForm.headOfFamily} onChange={e=>setEditHouseForm({...editHouseForm, headOfFamily: e.target.value})} />
                  <input required type="number" placeholder="Penghuni" className="w-full p-2 border rounded-lg" value={editHouseForm.occupants} onChange={e=>setEditHouseForm({...editHouseForm, occupants: parseInt(e.target.value)})} />
                  <input placeholder="HP" className="w-full p-2 border rounded-lg" value={editHouseForm.phone} onChange={e=>setEditHouseForm({...editHouseForm, phone: e.target.value})} />
                  <select className="w-full p-2 border rounded-lg" value={editHouseForm.paymentStatus} onChange={e=>setEditHouseForm({...editHouseForm, paymentStatus: e.target.value})}><option value="Lunas">Lunas</option><option value="Belum Lunas">Belum Lunas</option><option value="Menunggak">Menunggak</option></select>
                  <Button type="submit" className="w-full">Simpan</Button>
              </form>
          )}
      </Modal>
    </div>
  );
};

const App = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [umkm, setUmkm] = useState<UMKM[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [ronda, setRonda] = useState<RondaSchedule[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pdfConfig, setPdfConfig] = useState<PdfConfig>(DEFAULT_PDF_CONFIG);

  // Load PDF Config from LocalStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('pdf_config');
    if (savedConfig) {
      try { setPdfConfig(JSON.parse(savedConfig)); } catch (e) { console.error("Error parsing saved config", e); }
    }
  }, []);

  // Subscribe to collections
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Load Mock Data
      setHouses(generateHouses());
      setAnnouncements(MOCK_ANNOUNCEMENTS);
      setOfficials(INITIAL_OFFICIALS);
      setRonda(MOCK_RONDA);
      setCashFlow(MOCK_CASHFLOW);
      setInventory(MOCK_INVENTORY);
      setUmkm(MOCK_UMKM);
      return;
    }

    const unsubHouses = subscribeToCollection('houses', (data) => setHouses(data as House[]));
    const unsubAnnouncements = subscribeToCollection('announcements', (data) => setAnnouncements(data as Announcement[]));
    const unsubReports = subscribeToCollection('reports', (data) => setReports(data as Report[]));
    const unsubUMKM = subscribeToCollection('umkm', (data) => setUmkm(data as UMKM[]));
    const unsubOfficials = subscribeToCollection('officials', (data) => setOfficials(data as Official[]));
    const unsubRonda = subscribeToCollection('ronda', (data) => setRonda(data as RondaSchedule[]));
    const unsubCashFlow = subscribeToCollection('cashFlow', (data) => setCashFlow(data as CashFlow[]));
    const unsubInventory = subscribeToCollection('inventory', (data) => setInventory(data as InventoryItem[]));
    const unsubLetters = subscribeToCollection('letters', (data) => setLetters(data as LetterRequest[]));

    return () => {
      unsubHouses(); unsubAnnouncements(); unsubReports(); unsubUMKM();
      unsubOfficials(); unsubRonda(); unsubCashFlow(); unsubInventory(); unsubLetters();
    };
  }, []);

  // Seeding Check (Only if Firebase is configured and empty)
  useEffect(() => {
     if(isFirebaseConfigured && houses.length === 0) {
         // Logic to seed if strictly empty could be here, but usually triggered manually or via service check
         // For now relying on manual seed via console or service logic
         seedDatabase({ 
             houses: generateHouses(), 
             announcements: MOCK_ANNOUNCEMENTS, 
             umkm: MOCK_UMKM,
             officials: INITIAL_OFFICIALS,
             ronda: MOCK_RONDA,
             inventory: MOCK_INVENTORY
         });
     }
  }, [houses]);

  return (
    <HashRouter>
       <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <>
               <PublicHeader />
               <PublicHome houses={houses} announcements={announcements} ronda={ronda} reports={reports} />
               <PanicButton />
               <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
            </>
          } />
          <Route path="/services" element={
            <>
               <PublicHeader />
               <PublicServices pdfConfig={pdfConfig} />
               <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
            </>
          } />
          <Route path="/umkm" element={
            <>
               <PublicHeader />
               <PublicUMKM umkmData={umkm} />
               <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
            </>
          } />
           <Route path="/info" element={
            <>
               <PublicHeader />
               <PublicInfo officials={officials} cashFlow={cashFlow} ronda={ronda} />
               <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
            </>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRouteWrapper isAdmin={isAdmin} onLogin={() => setIsAdmin(true)}>
               <AdminDashboard 
                  houses={houses} 
                  announcements={announcements} 
                  cashFlow={cashFlow} 
                  officials={officials} 
                  reports={reports} 
                  letters={letters} 
                  ronda={ronda} 
                  inventory={inventory}
                  umkm={umkm}
                  pdfConfig={pdfConfig}
                  setPdfConfig={setPdfConfig}
               />
            </AdminRouteWrapper>
          } />
       </Routes>
    </HashRouter>
  );
};

export default App;
