

import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Home, FileText, Megaphone, AlertTriangle, User, Users, LogIn, Menu, X, 
  LayoutDashboard, CreditCard, Send, Bot, Check, Trash2, Clock, CheckCircle, XCircle, Search, Edit2, Plus,
  Shield, Phone, TrendingUp, TrendingDown, Wallet, Calendar, ChevronRight, Moon, Sun, CloudRain, 
  MoreVertical, LogOut, ChevronDown, Filter, Download, Save, RefreshCw, Image as ImageIcon, Printer,
  DollarSign, Briefcase, MapPin, Sparkles, Loader2, Store, Archive, History, BarChart3, List, Grid, Eye,
  Contact, CalendarDays, Map, Settings, Upload, FileImage, Package, PenTool, ShoppingBag, Coins,
  ArrowUpRight, ArrowDownRight, ShieldCheck, FileDown, Target, HelpCircle, MapPin as MapIcon,
  Heart, Baby, Accessibility, Smile, GraduationCap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { jsPDF } from "jspdf";

// Components & Services
import { Logo, generateHouses, MOCK_ANNOUNCEMENTS, MOCK_UMKM, INITIAL_REPORTS, INITIAL_LETTERS, MOCK_RONDA, MOCK_CASHFLOW, MOCK_GALLERY, RT_ADDRESS, APP_NAME, INITIAL_OFFICIALS, DEFAULT_PDF_CONFIG, MOCK_INVENTORY } from './constants';
import { House, Announcement, Report, LetterRequest, PaymentStatus, UMKM, CashFlow, Official, RondaSchedule, PdfConfig, InventoryItem } from './types';
import { HouseMap } from './components/HouseMap';
import { generateAnnouncementDraft } from './services/geminiService';
import { generateSuratPengantar, generateResidentReportPDF } from './services/pdfService';
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
      className="fixed bottom-36 right-4 md:bottom-10 md:left-10 md:right-auto z-[45] group flex items-center gap-2 animate-bounce-slow"
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

const PublicHome = ({ houses, announcements, ronda, reports, officials }: { houses: House[], announcements: Announcement[], ronda: RondaSchedule[], reports: Report[], officials: Official[] }) => {
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
      
      {/* Full Width Map */}
      <div className="w-full">
         <HouseMap 
            houses={houses} 
            isAdmin={false} 
            reports={reports}
            officials={officials}
            onReportHouse={(house) => navigate(`/services?tab=lapor&houseId=${house.id}`)} 
         />
      </div>
      
      {/* Bottom Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
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

        {/* Sidebar Info (Moved Here) */}
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

  const [requestType, setRequestType] = useState<LetterRequest['type']>('Surat Izin Keramaian');
  const [applicantName, setApplicantName] = useState('');
  const [nik, setNik] = useState('');
  const [familyHeadName, setFamilyHeadName] = useState(''); 
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [religion, setReligion] = useState('Islam');
  const [job, setJob] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<LetterRequest['maritalStatus']>('Kawin');
  const [nationality, setNationality] = useState('Indonesia'); 
  const [addressKtp, setAddressKtp] = useState('');
  const [houseId, setHouseId] = useState(initialHouseId);
  const [purposeDetail, setPurposeDetail] = useState(''); 

  const handleSubmitSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    const letterData: LetterRequest = {
        id: Date.now().toString(),
        type: requestType,
        applicantName, nik, 
        familyHeadName, 
        birthPlace, birthDate, gender, religion, job, maritalStatus, 
        nationality, 
        addressKtp, houseId,
        purposeDetail, 
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
    };
    // GENERATE DRAFT PDF (Watermark, No Sig)
    generateSuratPengantar(letterData, pdfConfig, true);
    
    await addLetterToDb(letterData);
    saveToHistory({...letterData, category: 'Surat', title: `Surat ${requestType}`});
    alert("Permohonan berhasil dikirim! Bukti DRAFT surat telah diunduh. Silakan hubungi Ketua RT untuk validasi.");
    // Reset Form
    setApplicantName(''); setNik(''); setFamilyHeadName(''); setBirthPlace(''); 
    setBirthDate(''); setJob(''); setAddressKtp(''); setHouseId(''); setPurposeDetail('');
  };

  const handleSubmitLapor = async (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: any = {
      type: reportType,
      description: reportDesc,
      reporterName: reporterName || "Anonim",
      date: new Date().toISOString().split('T')[0],
      status: 'Baru',
      houseId: reportHouseId ? reportHouseId.toUpperCase() : undefined, 
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

  // --- Quick Select Helpers ---
  const reportTags = [
      {label: "Lampu Mati", icon: CloudRain},
      {label: "Sampah Numpuk", icon: Trash2},
      {label: "Selokan Mampet", icon: ArrowDownRight},
      {label: "Hewan Liar", icon: AlertTriangle},
      {label: "Orang Asing", icon: User},
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-20">
       <div className="text-center mb-8 md:mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-[10px] font-bold uppercase tracking-wider mb-2">Pusat Layanan Warga</span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Layanan Digital RT 002</h1>
          <p className="text-sm md:text-base text-slate-500 mt-2 max-w-xl mx-auto">Sistem pelayanan mandiri untuk pembuatan surat pengantar, pelaporan masalah, dan pemantauan aktivitas lingkungan.</p>
       </div>

       <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[600px]">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-72 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-4 md:p-6 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar snap-x">
             <button onClick={() => setActiveTab('surat')} className={`flex-none min-w-[140px] md:min-w-0 p-4 rounded-2xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'surat' ? 'bg-white text-brand-blue shadow-lg shadow-blue-100 ring-1 ring-blue-100' : 'hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800'}`}>
                <div className={`p-2 rounded-xl ${activeTab==='surat' ? 'bg-blue-50' : 'bg-slate-100'}`}><FileText size={20} className="shrink-0" /></div>
                <div><span className="font-bold block text-sm">Surat Pengantar</span><span className="text-[10px] opacity-70 hidden md:block mt-1">KTP, KK, Domisili, dll</span></div>
             </button>
             <button onClick={() => setActiveTab('lapor')} className={`flex-none min-w-[140px] md:min-w-0 p-4 rounded-2xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'lapor' ? 'bg-white text-rose-600 shadow-lg shadow-rose-100 ring-1 ring-rose-100' : 'hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800'}`}>
                <div className={`p-2 rounded-xl ${activeTab==='lapor' ? 'bg-rose-50' : 'bg-slate-100'}`}><AlertTriangle size={20} className="shrink-0" /></div>
                <div><span className="font-bold block text-sm">Lapor Pak RT</span><span className="text-[10px] opacity-70 hidden md:block mt-1">Keamanan & Fasilitas</span></div>
             </button>
             <button onClick={() => setActiveTab('history')} className={`flex-none min-w-[140px] md:min-w-0 p-4 rounded-2xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'history' ? 'bg-white text-emerald-600 shadow-lg shadow-emerald-100 ring-1 ring-emerald-100' : 'hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800'}`}>
                <div className={`p-2 rounded-xl ${activeTab==='history' ? 'bg-emerald-50' : 'bg-slate-100'}`}><History size={20} className="shrink-0" /></div>
                <div><span className="font-bold block text-sm">Riwayat Saya</span><span className="text-[10px] opacity-70 hidden md:block mt-1">Log Aktivitas Lokal</span></div>
             </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white/50 relative">
             {activeTab === 'surat' && (
                <div className="animate-fade-in max-w-2xl mx-auto space-y-8">
                   <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-800 text-sm">
                       <HelpCircle className="shrink-0" size={20}/>
                       <div>
                           <p className="font-bold mb-1">Panduan Pengajuan:</p>
                           <ul className="list-disc ml-4 space-y-1 text-xs">
                               <li>Isi formulir dengan data yang <strong>valid</strong> sesuai KTP.</li>
                               <li>Sistem akan mengunduh bukti <strong>DRAFT (Format PDF)</strong>.</li>
                               <li>Surat DRAFT <strong>belum sah</strong> (tanpa TTD/Stempel). Hubungi Ketua RT untuk validasi dan mendapatkan surat resmi.</li>
                           </ul>
                       </div>
                   </div>

                   <form onSubmit={handleSubmitSurat} className="space-y-6">
                       {/* Section 1 */}
                       <div className="space-y-4">
                           <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2"><FileText size={16}/> Data Surat</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="md:col-span-2">
                                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Jenis Surat</label>
                                   <select className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={requestType} onChange={e=>setRequestType(e.target.value as any)}>
                                       <option>Surat Izin Keramaian</option>
                                       <option>Surat Keterangan Usaha (SKU)</option>
                                       <option>Pengantar KTP</option>
                                       <option>Pengantar KK</option>
                                       <option>Domisili</option>
                                       <option>Kematian</option>
                                       <option>Kelahiran</option>
                                   </select>
                               </div>
                           </div>
                       </div>

                       {/* Section 2 */}
                       <div className="space-y-4">
                           <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2"><User size={16}/> Identitas Pemohon</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="md:col-span-2">
                                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Nama Lengkap</label>
                                   <input placeholder="Sesuai KTP" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={applicantName} onChange={e=>setApplicantName(e.target.value)} required/>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">NIK</label>
                                   <input placeholder="16 Digit Angka" type="number" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={nik} onChange={e=>setNik(e.target.value)} required/>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Kepala Keluarga</label>
                                   <input placeholder="Nama Kepala Keluarga" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={familyHeadName} onChange={e=>setFamilyHeadName(e.target.value)} required/>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Tempat Lahir</label>
                                   <input placeholder="Kota Kelahiran" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={birthPlace} onChange={e=>setBirthPlace(e.target.value)} required/>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Tanggal Lahir</label>
                                   <input type="date" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all text-slate-600" value={birthDate} onChange={e=>setBirthDate(e.target.value)} required/>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Jenis Kelamin</label>
                                   <select className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={gender} onChange={e=>setGender(e.target.value as any)}>
                                       <option>Laki-laki</option><option>Perempuan</option>
                                   </select>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Agama</label>
                                   <select className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={religion} onChange={e=>setReligion(e.target.value)}>
                                       <option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option>
                                   </select>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Pekerjaan</label>
                                   <input placeholder="Cth: Karyawan Swasta" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={job} onChange={e=>setJob(e.target.value)} required/>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Kewarganegaraan</label>
                                   <input placeholder="Indonesia" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={nationality} onChange={e=>setNationality(e.target.value)} required/>
                               </div>
                               <div className="md:col-span-2">
                                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Status Perkawinan</label>
                                   <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                       {['Kawin', 'Belum Kawin', 'Cerai Hidup', 'Cerai Mati'].map(status => (
                                           <button 
                                                type="button" 
                                                key={status}
                                                onClick={() => setMaritalStatus(status as any)}
                                                className={`p-2 rounded-lg text-xs font-bold border transition-all ${maritalStatus === status ? 'bg-brand-blue text-white border-brand-blue shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                           >
                                               {status}
                                           </button>
                                       ))}
                                   </div>
                                </div>
                           </div>
                       </div>

                       {/* Section 3 */}
                       <div className="space-y-4">
                           <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2"><MapIcon size={16}/> Alamat & Keperluan</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="md:col-span-2">
                                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Alamat Domisili (Blok Rumah)</label>
                                   <input placeholder="Cth: C10-08 (Wajib diisi sesuai blok)" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={houseId} onChange={e=>setHouseId(e.target.value)} required/>
                               </div>
                               <div className="md:col-span-2">
                                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Alamat Sesuai KTP</label>
                                   <textarea placeholder="Jalan, RT/RW, Kelurahan, Kecamatan..." className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all h-20" value={addressKtp} onChange={e=>setAddressKtp(e.target.value)} required/>
                               </div>
                               <div className="md:col-span-2">
                                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Keperluan</label>
                                   <textarea placeholder="Sebagai pengantar untuk mendapatkan Surat Izin Keramaian berupa Pesta Pernikahan dengan keperluan Mapacci (pada 1 November...) dan Resepsi..." className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all h-32" value={purposeDetail} onChange={e=>setPurposeDetail(e.target.value)} required/>
                               </div>
                           </div>
                       </div>

                       <div className="pt-4">
                           <Button type="submit" className="w-full py-3.5 text-base shadow-lg shadow-blue-200">
                               <Download size={20}/> Ajukan Permohonan & Unduh Draft
                           </Button>
                       </div>
                   </form>
                </div>
             )}

             {activeTab === 'lapor' && (
                <div className="animate-fade-in max-w-lg mx-auto md:mx-0 space-y-6">
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6">
                        <h3 className="font-bold text-rose-700 text-lg mb-1 flex items-center gap-2"><AlertTriangle size={20}/> Form Laporan Warga</h3>
                        <p className="text-xs text-rose-600">Laporan Anda akan masuk ke dashboard Ketua RT & Keamanan. Gunakan fitur ini secara bijak.</p>
                    </div>

                    <form onSubmit={handleSubmitLapor} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Kategori Masalah</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" value={reportType} onChange={e=>setReportType(e.target.value as any)}><option>Keamanan</option><option>Kebersihan</option><option>Fasilitas</option><option>Lainnya</option></select>
                            </div>
                            
                            {/* Quick Tags */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2 ml-1">Pilih Masalah Cepat (Klik untuk isi)</label>
                                <div className="flex flex-wrap gap-2">
                                    {reportTags.map((tag, idx) => (
                                        <button type="button" key={idx} onClick={() => setReportDesc(tag.label)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all">
                                            <tag.icon size={12} /> {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Lokasi Kejadian / Blok Rumah</label>
                                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="Cth: C5-05 (Wajib diisi)" value={reportHouseId} onChange={e=>setReportHouseId(e.target.value)} required />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Deskripsi Lengkap</label>
                                <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-32 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="Jelaskan detail kejadian..." value={reportDesc} onChange={e=>setReportDesc(e.target.value)} required></textarea>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Nama Pelapor (Opsional)</label>
                                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="Boleh dikosongkan jika ingin anonim" value={reporterName} onChange={e=>setReporterName(e.target.value)} />
                            </div>
                        </div>
                        <Button type="submit" className="w-full py-3.5 bg-rose-600 text-white shadow-lg shadow-rose-200 hover:bg-rose-700 border-transparent">
                            <Send size={18}/> Kirim Laporan
                        </Button>
                    </form>
                </div>
             )}

             {activeTab === 'history' && (
                 <div className="animate-fade-in space-y-4 max-w-xl">
                     <div className="flex justify-between items-center mb-6 pb-4 border-b">
                         <div>
                            <h3 className="font-bold text-lg text-slate-800">Riwayat Aktivitas</h3>
                            <p className="text-xs text-slate-400">Log tersimpan di perangkat ini (Local Storage).</p>
                         </div>
                         <button onClick={clearHistory} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold hover:bg-rose-50 hover:text-rose-600 transition-colors">Hapus Log</button>
                     </div>
                     
                     <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">
                        {localHistory.length === 0 ? (
                            <div className="pl-6 text-slate-400 italic text-sm">Belum ada riwayat aktivitas.</div>
                        ) : (
                            localHistory.map((item, idx) => (
                                <div key={idx} className="relative pl-6 group">
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${item.category === 'Laporan' ? 'bg-rose-500' : 'bg-brand-blue'}`}></div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${item.category === 'Laporan' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-brand-blue'}`}>
                                                {item.category}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium">{item.date}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h4>
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            {item.type && `Jenis: ${item.type}`} • {item.description || item.applicantName || "Detail tersimpan"}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                     </div>
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
    
    // Chart Data Preparation
    const chartData = cashFlow.slice().reverse().map(c => ({
        date: new Date(c.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}),
        amount: c.amount,
        type: c.type
    }));

    // --- SORTING LOGIC ---
    // 1. Sort Ronda Days (Senin -> Minggu)
    const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const sortedRonda = [...ronda].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

    // 2. Sort Officials (Ketua -> Sekretaris -> Bendahara -> Lainnya)
    const roleHierarchy = ['Ketua RT', 'Sekretaris', 'Bendahara', 'Bendahara RW', 'Koord. Keamanan', 'Seksi'];
    const sortedOfficials = [...officials].sort((a, b) => {
        const indexA = roleHierarchy.findIndex(r => a.role.includes(r));
        const indexB = roleHierarchy.findIndex(r => b.role.includes(r));
        // Jika tidak ditemukan di hierarki, taruh di belakang
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });

    const [activeRondaDay, setActiveRondaDay] = useState(new Date().toLocaleDateString('id-ID', {weekday:'long'}));
    
    return (
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-20 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 p-8 md:p-12 text-center text-white shadow-2xl shadow-slate-200">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                    <span className="inline-block bg-brand-blue/20 text-brand-blue border border-brand-blue/30 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4">Transparansi Publik</span>
                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Pusat Informasi RT 002</h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                        Akses data kepengurusan, laporan keuangan, dan jadwal kegiatan lingkungan secara terbuka dan akuntabel.
                    </p>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Card 1: Saldo Kas */}
                 <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                     <div className="absolute -right-6 -top-6 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Wallet size={140}/></div>
                     <div className="relative z-10">
                         <p className="text-emerald-100 font-medium text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><ShieldCheck size={14}/> Keuangan Warga</p>
                         <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">Rp {currentBalance.toLocaleString()}</h2>
                         <div className="flex gap-3 text-xs font-bold">
                             <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl flex items-center gap-1.5 border border-white/10">
                                <div className="bg-white/20 p-1 rounded-full"><ArrowUpRight size={10} className="text-emerald-200"/></div>
                                +{totalIncome.toLocaleString()}
                             </div>
                             <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl flex items-center gap-1.5 border border-white/10">
                                <div className="bg-white/20 p-1 rounded-full"><ArrowDownRight size={10} className="text-rose-200"/></div>
                                -{totalExpense.toLocaleString()}
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Card 2: Pengurus */}
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-100 flex flex-col justify-between group hover:border-brand-blue/30 transition-colors">
                     <div className="flex justify-between items-start">
                         <div>
                             <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Struktur Organisasi</p>
                             <h2 className="text-4xl font-black text-slate-800 mt-2">{officials.length} <span className="text-lg font-medium text-slate-400">Personil</span></h2>
                         </div>
                         <div className="bg-brand-blue/5 p-4 rounded-2xl text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors"><Briefcase size={28}/></div>
                     </div>
                     <p className="text-xs text-slate-400 mt-4 leading-relaxed">Siap melayani kebutuhan administrasi, keamanan, dan sosial warga RT 002.</p>
                 </div>

                 {/* Card 3: Ronda Hari Ini */}
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-100 flex flex-col justify-between group hover:border-indigo-200 transition-colors">
                     <div className="flex justify-between items-start">
                         <div>
                             <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Jadwal Keamanan</p>
                             <h2 className="text-xl font-black text-slate-800 mt-2 capitalize">{new Date().toLocaleDateString('id-ID', {weekday:'long'})}</h2>
                         </div>
                         <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Moon size={28}/></div>
                     </div>
                     <div className="mt-4">
                        <div className="flex -space-x-2 overflow-hidden py-1">
                            {ronda.find(r => r.day === new Date().toLocaleDateString('id-ID', {weekday:'long'}))?.members.slice(0,4).map((m,i) => (
                                <div key={i} className="w-9 h-9 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-sm" title={m}>
                                    {m.charAt(0)}
                                </div>
                            )) || <span className="text-sm text-slate-400 italic">Tidak ada jadwal</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">*Tim Siskamling Malam Ini</p>
                     </div>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Financial Chart & History */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Program Kerja (New Section) */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                                <Target className="text-brand-blue" size={20}/> 
                                Program & Agenda 2024
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { title: "Perbaikan Saluran Air", status: "Sedang Berjalan", date: "Okt - Nov 2024", icon: RefreshCw, color: "text-amber-500", bg: "bg-amber-50" },
                                { title: "Penyemprotan Fogging", status: "Selesai", date: "September 2024", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
                                { title: "Pembuatan Taman Toga", status: "Direncanakan", date: "Desember 2024", icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
                                { title: "Musyawarah Warga", status: "Rutin Bulanan", date: "Tiap Tanggal 10", icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
                            ].map((prog, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-default">
                                    <div className={`p-3 rounded-xl ${prog.bg} ${prog.color}`}>
                                        <prog.icon size={20}/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{prog.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{prog.status}</span>
                                            <span className="text-[10px] text-slate-400">{prog.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><BarChart3 className="text-emerald-500" size={20}/> Laporan Arus Kas</h3>
                                <p className="text-sm text-slate-500 mt-1">Grafik pemasukan dan pengeluaran kas operasional RT.</p>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                                <FileDown size={16}/> Unduh Laporan PDF
                            </button>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`}/>
                                    <RechartsTooltip 
                                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                                        itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                                        formatter={(value: number) => [`Rp ${value.toLocaleString()}`, 'Jumlah']}
                                        labelStyle={{color: '#64748b', marginBottom: '4px', fontSize: '10px'}}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* Recent Transactions List (Compact) */}
                        <div className="mt-8 pt-8 border-t border-slate-50">
                            <h4 className="font-bold text-sm text-slate-700 mb-4">Transaksi Terakhir</h4>
                            <div className="space-y-3">
                                {cashFlow.slice(0, 4).map(cf => (
                                    <div key={cf.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cf.type==='Income'?'bg-emerald-100 text-emerald-600':'bg-rose-100 text-rose-600'}`}>
                                                {cf.type==='Income' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-xs md:text-sm">{cf.description}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(cf.date).toLocaleDateString('id-ID', {day:'numeric', month:'long'})}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-xs md:text-sm ${cf.type==='Income'?'text-emerald-600':'text-rose-600'}`}>
                                            {cf.type==='Income' ? '+' : '-'} Rp {cf.amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Ronda Schedule (Improved) */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-300 h-full flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                        
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 relative z-10"><Shield size={20} className="text-indigo-400"/> Jadwal Siskamling</h3>
                        
                        <div className="flex-1 flex flex-col gap-3 relative z-10">
                            {sortedRonda.map((r, i) => {
                                const isToday = r.day === new Date().toLocaleDateString('id-ID', {weekday:'long'});
                                return (
                                    <div 
                                        key={i}
                                        onClick={() => setActiveRondaDay(r.day)}
                                        className={`group p-4 rounded-2xl border transition-all cursor-pointer ${
                                            activeRondaDay === r.day 
                                            ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/50 scale-[1.02]' 
                                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`font-bold text-sm ${activeRondaDay === r.day ? 'text-white' : 'text-slate-300'}`}>{r.day}</span>
                                            {isToday && <span className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full animate-pulse">HARI INI</span>}
                                        </div>
                                        {activeRondaDay === r.day && (
                                            <div className="space-y-2 animate-fade-in mt-2 pt-2 border-t border-white/20">
                                                {r.members.map((m, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-300"></div>
                                                        <span className="text-indigo-100">{m}</span>
                                                    </div>
                                                ))}
                                                {r.members.length === 0 && <p className="text-xs text-white/40 italic">Belum ada petugas.</p>}
                                            </div>
                                        )}
                                        {activeRondaDay !== r.day && (
                                            <div className="flex -space-x-1 overflow-hidden">
                                                {r.members.slice(0,3).map((_, idx) => (
                                                    <div key={idx} className="w-4 h-4 rounded-full bg-white/20 border border-slate-900"></div>
                                                ))}
                                                {r.members.length > 3 && <div className="w-4 h-4 rounded-full bg-white/10 text-[8px] flex items-center justify-center text-white">+</div>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Officials Section (Sorted & Styled) */}
            <section className="pt-8 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600"><Users size={24}/></div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Struktur Pengurus RT</h2>
                        <p className="text-sm text-slate-500">Periode Jabatan 2023 - 2026</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {sortedOfficials.map(o => (
                        <div key={o.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                            {/* Card Header Pattern */}
                            <div className={`h-24 relative ${
                                o.role.includes('Ketua') ? 'bg-gradient-to-r from-indigo-600 to-purple-600' :
                                o.role.includes('Sekretaris') ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                                o.role.includes('Bendahara') ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                'bg-gradient-to-r from-slate-700 to-slate-600'
                            }`}>
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            </div>
                            
                            <div className="px-6 pb-6 text-center -mt-12 relative">
                                <div className="inline-block p-1.5 bg-white rounded-full shadow-lg">
                                    <img 
                                        src={o.photo||`https://ui-avatars.com/api/?name=${o.name}&background=random&size=128`} 
                                        className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 bg-slate-100"
                                        alt={o.name}
                                    />
                                </div>
                                
                                <h3 className="font-bold text-slate-800 text-lg mt-3">{o.name}</h3>
                                <div className="mt-1 mb-4">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                        o.role.includes('Ketua') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                        o.role.includes('Sekretaris') ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        o.role.includes('Bendahara') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                        {o.role}
                                    </span>
                                </div>
                                
                                <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-2 text-left">
                                   <div className="bg-slate-50 p-2 rounded-xl">
                                       <p className="text-[10px] text-slate-400 font-bold uppercase">Domisili</p>
                                       <p className="text-xs font-bold text-slate-700 flex items-center gap-1"><Home size={10}/> {o.houseId}</p>
                                   </div>
                                   <a href={`https://wa.me/${o.phone}`} target="_blank" rel="noreferrer" className="bg-green-50 hover:bg-green-100 p-2 rounded-xl transition-colors cursor-pointer">
                                       <p className="text-[10px] text-green-600 font-bold uppercase">Kontak</p>
                                       <p className="text-xs font-bold text-green-700 flex items-center gap-1"><Phone size={10}/> WhatsApp</p>
                                   </a>
                                </div>
                            </div>
                        </div>
                    ))}
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
  const [editHouseForm, setEditHouseForm] = useState<{
    headOfFamily: string;
    occupants: number;
    phone: string;
    paymentStatus: string;
    hasPregnant: boolean;
    hasBaby: boolean;
    hasToddler: boolean;
    hasTeenager: boolean; // New
    hasElderly: boolean;
  }>({ 
      headOfFamily: '', occupants: 0, phone: '', paymentStatus: '', 
      hasPregnant: false, hasBaby: false, hasToddler: false, hasTeenager: false, hasElderly: false 
  });

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
      setEditHouseForm({ 
          headOfFamily: h.headOfFamily, 
          occupants: h.occupants, 
          phone: h.phone || '', 
          paymentStatus: h.paymentStatus,
          // Load demographics or default to false
          hasPregnant: h.hasPregnant || false,
          hasBaby: h.hasBaby || false,
          hasToddler: h.hasToddler || false,
          hasTeenager: h.hasTeenager || false,
          hasElderly: h.hasElderly || false,
      }); 
      setModalType('editHouse'); 
      setIsModalOpen(true); 
  };

  const openDuesModal = (h: House) => {
      setDuesHouseId(h.id);
      setDuesStatus(PaymentStatus.PAID);
      setModalType('dues');
      setIsModalOpen(true);
  };

  const handleSaveHouse = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if(selectedHouse) await updateHouseData(selectedHouse.id, { 
          headOfFamily: editHouseForm.headOfFamily, 
          occupants: parseInt(editHouseForm.occupants as any), 
          phone: editHouseForm.phone, 
          paymentStatus: editHouseForm.paymentStatus,
          // Save demographics
          hasPregnant: editHouseForm.hasPregnant,
          hasBaby: editHouseForm.hasBaby,
          hasToddler: editHouseForm.hasToddler,
          hasTeenager: editHouseForm.hasTeenager,
          hasElderly: editHouseForm.hasElderly,
      }); 
      setIsModalOpen(false); 
  }
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
                           <Button onClick={() => generateResidentReportPDF(houses, pdfConfig)} className="text-xs h-10 bg-slate-800 text-white">
                               <Printer size={16}/> Cetak Laporan (PDF)
                           </Button>
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
                        officials={officials} 
                      />
                  ) : (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                          <table className="w-full text-sm text-left">
                              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs"><tr><th className="p-4">Rumah</th><th className="p-4">Kepala Keluarga</th><th className="p-4">Status</th><th className="p-4">Iuran</th><th className="p-4 text-center">Aksi</th></tr></thead>
                              <tbody className="divide-y divide-slate-100">{houses.filter(h => h.headOfFamily.toLowerCase().includes(searchResident.toLowerCase()) || h.id.toLowerCase().includes(searchResident.toLowerCase())).map(h => {
                                      const hasIssue = reports.some(r => r.houseId === h.id && r.status !== 'Selesai');
                                      return (
                                          <tr key={h.id} className={`transition-colors border-b ${hasIssue ? 'bg-rose-50 hover:bg-rose-100' : 'hover:bg-slate-50'}`}>
                                              <td className="p-4 font-bold flex items-center gap-2">
                                                 {h.id}
                                                 {hasIssue && <div className="text-rose-600 animate-pulse" title="Ada Laporan Aktif"><AlertTriangle size={16} fill="currentColor" className="text-rose-200"/></div>}
                                              </td>
                                              <td className="p-4">{h.headOfFamily}</td>
                                              <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${h.status === 'Occupied' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{h.status}</span></td>
                                              <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${h.paymentStatus === 'Lunas' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{h.paymentStatus}</span></td>
                                              <td className="p-4 text-center"><button onClick={() => openEditHouse(h)} className="text-slate-400 hover:text-brand-blue"><Edit2 size={16} /></button></td>
                                          </tr>
                                      );
                              })}</tbody>
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
                        
                        <div className="border border-dashed p-4 bg-slate-50 rounded-xl space-y-2">
                           <label className="text-sm font-bold block">Logo Surat</label>
                           <input type="file" onChange={(e) => handleFileChange(e, 'logo')} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-brand-blue hover:file:bg-blue-100"/>
                           <input type="text" placeholder="Atau Tempel URL Gambar / Google Drive Link..." className="w-full p-2 border rounded-lg text-xs" value={localConfig.logo.startsWith('data:') ? '' : localConfig.logo} onChange={(e) => setLocalConfig({...localConfig, logo: e.target.value})} />
                        </div>

                        <div className="border border-dashed p-4 bg-slate-50 rounded-xl space-y-2">
                           <label className="text-sm font-bold block">Stempel</label>
                           <input type="file" onChange={(e) => handleFileChange(e, 'stamp')} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100"/>
                           <input type="text" placeholder="Atau Tempel URL Gambar / Google Drive Link..." className="w-full p-2 border rounded-lg text-xs" value={localConfig.stamp.startsWith('data:') ? '' : localConfig.stamp} onChange={(e) => setLocalConfig({...localConfig, stamp: e.target.value})} />
                        </div>

                        <div className="border border-dashed p-4 bg-slate-50 rounded-xl space-y-2">
                           <label className="text-sm font-bold block">Tanda Tangan</label>
                           <input type="file" onChange={(e) => handleFileChange(e, 'signature')} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-600 hover:file:bg-emerald-100"/>
                           <input type="text" placeholder="Atau Tempel URL Gambar / Google Drive Link..." className="w-full p-2 border rounded-lg text-xs" value={localConfig.signature.startsWith('data:') ? '' : localConfig.signature} onChange={(e) => setLocalConfig({...localConfig, signature: e.target.value})} />
                        </div>

                        <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-700">
                           <p><strong>Catatan:</strong> Jika menggunakan Google Drive Link, pastikan akses file diubah menjadi <strong>"Anyone with the link (Siapa saja yang memiliki link)"</strong> agar gambar bisa muncul di PDF.</p>
                        </div>

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
                  {serviceTab==='surat' && <div className="bg-white rounded-2xl border divide-y">{letters.map(l=><div key={l.id} className="p-6 flex justify-between"><div><p className="font-bold">{l.applicantName}</p><p className="text-xs">{l.type}</p></div><div className="flex gap-2">
                  <Button onClick={() => generateSuratPengantar(l, pdfConfig, false)} className="text-xs h-8 bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent px-2"><Printer size={14}/> Unduh Resmi</Button>
                  {l.status==='Pending'&&(<> <button onClick={()=>handleUpdateLetter(l.id,'Approved')} className="text-emerald-600 font-bold text-xs">Setuju</button><button onClick={()=>handleUpdateLetter(l.id,'Rejected')} className="text-rose-600 font-bold text-xs">Tolak</button></>)}<button onClick={()=>handleDeleteLetter(l.id)}><Trash2 size={16}/></button></div></div>)}</div>}
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
                  
                  {/* Demographics Checkboxes */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-3">Data Demografi & Kesehatan</p>
                      <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 p-2 bg-white rounded-lg border shadow-sm cursor-pointer hover:border-pink-300 transition-colors">
                              <input type="checkbox" className="w-4 h-4 text-pink-500 rounded focus:ring-pink-500" checked={editHouseForm.hasPregnant} onChange={e=>setEditHouseForm({...editHouseForm, hasPregnant: e.target.checked})}/>
                              <span className="text-sm font-medium text-slate-700">Ibu Hamil</span>
                          </label>
                          <label className="flex items-center gap-2 p-2 bg-white rounded-lg border shadow-sm cursor-pointer hover:border-cyan-300 transition-colors">
                              <input type="checkbox" className="w-4 h-4 text-cyan-500 rounded focus:ring-cyan-500" checked={editHouseForm.hasBaby} onChange={e=>setEditHouseForm({...editHouseForm, hasBaby: e.target.checked})}/>
                              <span className="text-sm font-medium text-slate-700">Bayi</span>
                          </label>
                          <label className="flex items-center gap-2 p-2 bg-white rounded-lg border shadow-sm cursor-pointer hover:border-orange-300 transition-colors">
                              <input type="checkbox" className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" checked={editHouseForm.hasToddler} onChange={e=>setEditHouseForm({...editHouseForm, hasToddler: e.target.checked})}/>
                              <span className="text-sm font-medium text-slate-700">Balita</span>
                          </label>
                          <label className="flex items-center gap-2 p-2 bg-white rounded-lg border shadow-sm cursor-pointer hover:border-lime-300 transition-colors">
                              <input type="checkbox" className="w-4 h-4 text-lime-500 rounded focus:ring-lime-500" checked={editHouseForm.hasTeenager} onChange={e=>setEditHouseForm({...editHouseForm, hasTeenager: e.target.checked})}/>
                              <span className="text-sm font-medium text-slate-700">Remaja</span>
                          </label>
                          <label className="flex items-center gap-2 p-2 bg-white rounded-lg border shadow-sm cursor-pointer hover:border-purple-300 transition-colors">
                              <input type="checkbox" className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500" checked={editHouseForm.hasElderly} onChange={e=>setEditHouseForm({...editHouseForm, hasElderly: e.target.checked})}/>
                              <span className="text-sm font-medium text-slate-700">Lansia</span>
                          </label>
                      </div>
                  </div>

                  <Button type="submit" className="w-full">Simpan</Button>
              </form>
          )}
      </Modal>
    </div>
  );
};

export const App: React.FC = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
  const [ronda, setRonda] = useState<RondaSchedule[]>([]);
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [umkm, setUmkm] = useState<UMKM[]>([]);
  
  const [pdfConfig, setPdfConfig] = useState<PdfConfig>(DEFAULT_PDF_CONFIG);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load PDF Config
  useEffect(() => {
    const saved = localStorage.getItem('pdf_config');
    if (saved) {
        try { setPdfConfig(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Data Subscription / Mock Data Logic
  useEffect(() => {
    if (!isFirebaseConfigured) {
        // Mock Data Fallback
        setHouses(generateHouses());
        setAnnouncements(MOCK_ANNOUNCEMENTS);
        setReports(INITIAL_REPORTS);
        setOfficials(INITIAL_OFFICIALS);
        setCashFlow(MOCK_CASHFLOW);
        setRonda(MOCK_RONDA);
        setLetters(INITIAL_LETTERS);
        setInventory(MOCK_INVENTORY);
        setUmkm(MOCK_UMKM);
    } else {
        // Firebase Subscriptions
        const unsubs = [
            subscribeToCollection('houses', (d) => setHouses(d as House[])),
            subscribeToCollection('announcements', (d) => setAnnouncements(d as Announcement[])),
            subscribeToCollection('reports', (d) => setReports(d as Report[])),
            subscribeToCollection('officials', (d) => setOfficials(d as Official[])),
            subscribeToCollection('cashFlow', (d) => setCashFlow(d as CashFlow[])),
            subscribeToCollection('ronda', (d) => setRonda(d as RondaSchedule[])),
            subscribeToCollection('letters', (d) => setLetters(d as LetterRequest[])),
            subscribeToCollection('inventory', (d) => setInventory(d as InventoryItem[])),
            subscribeToCollection('umkm', (d) => setUmkm(d as UMKM[])),
        ];
        
        // Auto-seed if empty
        seedDatabase({
             houses: generateHouses(),
             announcements: MOCK_ANNOUNCEMENTS,
             officials: INITIAL_OFFICIALS,
             ronda: MOCK_RONDA,
             inventory: MOCK_INVENTORY,
             umkm: MOCK_UMKM
        });

        return () => unsubs.forEach(u => u());
    }
  }, []);

  return (
    <HashRouter>
        <Routes>
            <Route path="/" element={
                <>
                    <PublicHeader />
                    <PublicHome houses={houses} announcements={announcements} ronda={ronda} reports={reports} officials={officials} />
                    <PanicButton />
                    <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
                </>
            }/>
            <Route path="/services" element={
                <>
                    <PublicHeader />
                    <PublicServices pdfConfig={pdfConfig} />
                    <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
                </>
            }/>
             <Route path="/umkm" element={
                <>
                    <PublicHeader />
                    <PublicUMKM umkmData={umkm} />
                    <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
                </>
            }/>
            <Route path="/info" element={
                <>
                    <PublicHeader />
                    <PublicInfo officials={officials} cashFlow={cashFlow} ronda={ronda} />
                    <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
                </>
            }/>
            <Route path="/admin" element={
                <AdminRouteWrapper isAdmin={isAdmin} onLogin={() => setIsAdmin(true)}>
                    <AdminDashboard 
                        houses={houses} announcements={announcements} 
                        cashFlow={cashFlow} officials={officials} 
                        reports={reports} letters={letters} 
                        ronda={ronda} inventory={inventory} umkm={umkm}
                        pdfConfig={pdfConfig} setPdfConfig={setPdfConfig}
                    />
                </AdminRouteWrapper>
            }/>
        </Routes>
    </HashRouter>
  );
};