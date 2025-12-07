
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
  Heart, Baby, Accessibility, Smile, GraduationCap, Key, Calculator, UserCheck
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

// Firebase imports
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
  resetHouseData,
  batchUpdateHouses
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
            <div className="hidden md:flex items-center space-x-1">
              <button onClick={() => navigate('/')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/')}`}>Beranda</button>
              <button onClick={() => navigate('/services')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/services')}`}>Layanan</button>
              <button onClick={() => navigate('/umkm')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/umkm')}`}>UMKM</button>
              <button onClick={() => navigate('/info')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/info')}`}>Info RT</button>
              <Button onClick={() => navigate('/admin')} variant="outline" className="ml-4 text-xs h-9">Login Admin</Button>
            </div>
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
            Sistem Informasi Digital
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight drop-shadow-sm">
            TERAS RT 002
          </h1>
           <div className="text-lg md:text-2xl font-bold text-cyan-200 mb-4 tracking-wide font-sans drop-shadow-md">
             Teknologi • Ekraf • Rukun • Aman • Sinergi
          </div>
          <p className="text-blue-50 text-sm md:text-lg font-light leading-relaxed max-w-lg hidden md:block border-l-2 border-cyan-400 pl-4">
            Platform terpadu untuk mewujudkan tetangga rukun, administrasi transparan, dan lingkungan harmonis melalui semangat gotong royong digital.
          </p>
        </div>
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

const PublicHome = ({ houses, announcements, ronda, reports, officials }: { houses: House[], announcements: Announcement[], ronda: RondaSchedule[], reports: Report[], officials: Official[] }) => {
  const navigate = useNavigate();
  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 animate-fade-in mb-20 md:mb-20">
      <HeroSection />
      <div className="flex overflow-x-auto gap-4 pb-4 -mt-2 md:-mt-4 relative z-10 px-1 no-scrollbar snap-x">
        {[{ label: 'Buat Surat', icon: FileText, color: 'text-brand-blue', bg: 'bg-blue-50', link: '/services' }, { label: 'Lapor Warga', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50', link: '/services?tab=lapor' }, { label: 'Info Iuran', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50', link: '/info' }, { label: 'UMKM', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50', link: '/umkm' }].map((action, idx) => (
             <button key={idx} onClick={() => navigate(action.link)} className="min-w-[100px] flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center gap-2 group snap-start">
                <div className={`p-3 ${action.bg} ${action.color} rounded-full group-hover:scale-110 transition-transform`}><action.icon size={24} /></div>
                <span className="font-bold text-slate-700 text-xs md:text-sm whitespace-nowrap">{action.label}</span>
             </button>
        ))}
      </div>
      <div className="w-full"><HouseMap houses={houses} isAdmin={false} reports={reports} officials={officials} onReportHouse={(house) => navigate(`/services?tab=lapor&houseId=${house.id}`)} /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2"><div className="bg-brand-blue/10 p-2 rounded-lg"><Megaphone className="text-brand-blue" size={20} /></div> Info Terbaru</h2>
            </div>
            <div className="space-y-4">
              {announcements.map((ann, idx) => (
                <div key={ann.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide ${ann.type === 'Urgent' ? 'bg-rose-100 text-rose-600' : ann.type === 'Event' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>{ann.type}</span>
                    <span className="text-[10px] md:text-xs text-slate-400 font-medium flex items-center gap-1"><Clock size={12} /> {new Date(ann.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-slate-800 mb-2">{ann.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-xs md:text-sm whitespace-pre-line">{ann.content}</p>
                </div>
              ))}
              {announcements.length === 0 && <div className="text-center p-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">Belum ada pengumuman.</div>}
            </div>
          </div>
        </div>
        <div className="space-y-6 md:space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Card title="Ronda Malam Ini" className="bg-gradient-to-b from-slate-800 to-slate-900 text-white border-0 shadow-lg shadow-slate-300">
             <div className="space-y-3">{ronda.find(r => r.day === new Date().toLocaleDateString('id-ID', {weekday:'long'}))?.members.map((member, i) => (<div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"><div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">{i+1}</div><span className="font-medium text-sm">{member}</span></div>)) || <p className="text-slate-400 text-sm italic py-4 text-center">Tidak ada jadwal ronda hari ini.</p>}</div>
             <div className="mt-6 pt-4 border-t border-white/10 text-center"><button onClick={() => navigate('/info')} className="text-xs font-bold text-blue-200 hover:text-white transition-colors">Lihat Jadwal Lengkap →</button></div>
          </Card>
          <Card title="Galeri Kegiatan">
             <div className="grid grid-cols-2 gap-2">{MOCK_GALLERY.slice(0,4).map(item => (<div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"><img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2"><span className="text-[10px] text-white font-medium line-clamp-1">{item.title}</span></div></div>))}</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const PublicServices = ({ pdfConfig }: { pdfConfig: PdfConfig }) => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'lapor' ? 'lapor' : 'surat';
  const initialHouseId = searchParams.get('houseId') || '';
  const [activeTab, setActiveTab] = useState<'surat' | 'lapor' | 'history'>(initialTab as any);
  const [localHistory, setLocalHistory] = useState<any[]>([]);
  
  useEffect(() => { try { const stored = localStorage.getItem('userRequestHistory'); if (stored) setLocalHistory(JSON.parse(stored)); } catch (e) { console.error("Error reading history", e); } }, []);
  useEffect(() => { if(initialHouseId) { if (activeTab === 'lapor') setReportHouseId(initialHouseId); if (activeTab === 'surat') setHouseId(initialHouseId); } }, [initialHouseId, activeTab]);

  const saveToHistory = (item: any) => { try { const updated = [item, ...localHistory]; setLocalHistory(updated); localStorage.setItem('userRequestHistory', JSON.stringify(updated)); } catch (e) { console.error("Error saving history", e); } };
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

  const handleSubmitSurat = async (e: React.FormEvent) => { e.preventDefault(); const letterData: LetterRequest = { id: Date.now().toString(), type: requestType, applicantName, nik, familyHeadName, birthPlace, birthDate, gender, religion, job, maritalStatus, nationality, addressKtp, houseId, purposeDetail, status: 'Pending', date: new Date().toISOString().split('T')[0] }; generateSuratPengantar(letterData, pdfConfig, true); await addLetterToDb(letterData); saveToHistory({...letterData, category: 'Surat', title: `Surat ${requestType}`}); alert("Permohonan berhasil dikirim! Bukti DRAFT surat telah diunduh. Silakan hubungi Ketua RT untuk validasi."); setApplicantName(''); setNik(''); setFamilyHeadName(''); setBirthPlace(''); setBirthDate(''); setJob(''); setAddressKtp(''); setHouseId(''); setPurposeDetail(''); };
  const handleSubmitLapor = async (e: React.FormEvent) => { e.preventDefault(); const newReport: any = { type: reportType, description: reportDesc, reporterName: reporterName || "Anonim", date: new Date().toISOString().split('T')[0], status: 'Baru', houseId: reportHouseId ? reportHouseId.toUpperCase() : undefined }; await addReportToDb(newReport); saveToHistory({...newReport, category: 'Laporan', title: `Laporan ${newReport.type}`}); alert("Laporan berhasil dikirim!"); setReportDesc(''); setReporterName(''); setReportHouseId(''); };
  const clearHistory = () => { if(confirm("Hapus riwayat lokal?")) { setLocalHistory([]); localStorage.removeItem('userRequestHistory'); } }
  const reportTags = [{label: "Lampu Mati", icon: CloudRain}, {label: "Sampah Numpuk", icon: Trash2}, {label: "Selokan Mampet", icon: ArrowDownRight}, {label: "Hewan Liar", icon: AlertTriangle}, {label: "Orang Asing", icon: User}];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-20">
       <div className="text-center mb-8 md:mb-10"><span className="inline-block px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-[10px] font-bold uppercase tracking-wider mb-2">Pusat Layanan Warga</span><h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Layanan Digital RT 002</h1><p className="text-sm md:text-base text-slate-500 mt-2 max-w-xl mx-auto">Sistem pelayanan mandiri untuk pembuatan surat pengantar, pelaporan masalah, dan pemantauan aktivitas lingkungan.</p></div>
       <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[600px]">
          <div className="w-full md:w-72 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-4 md:p-6 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar snap-x">
             <button onClick={() => setActiveTab('surat')} className={`flex-none min-w-[140px] md:min-w-0 p-4 rounded-2xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'surat' ? 'bg-white text-brand-blue shadow-lg shadow-blue-100 ring-1 ring-blue-100' : 'hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800'}`}><div className={`p-2 rounded-xl ${activeTab==='surat' ? 'bg-blue-50' : 'bg-slate-100'}`}><FileText size={20} className="shrink-0" /></div><div><span className="font-bold block text-sm">Surat Pengantar</span><span className="text-[10px] opacity-70 hidden md:block mt-1">KTP, KK, Domisili, dll</span></div></button>
             <button onClick={() => setActiveTab('lapor')} className={`flex-none min-w-[140px] md:min-w-0 p-4 rounded-2xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'lapor' ? 'bg-white text-rose-600 shadow-lg shadow-rose-100 ring-1 ring-rose-100' : 'hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800'}`}><div className={`p-2 rounded-xl ${activeTab==='lapor' ? 'bg-rose-50' : 'bg-slate-100'}`}><AlertTriangle size={20} className="shrink-0" /></div><div><span className="font-bold block text-sm">Lapor Pak RT</span><span className="text-[10px] opacity-70 hidden md:block mt-1">Keamanan & Fasilitas</span></div></button>
             <button onClick={() => setActiveTab('history')} className={`flex-none min-w-[140px] md:min-w-0 p-4 rounded-2xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'history' ? 'bg-white text-emerald-600 shadow-lg shadow-emerald-100 ring-1 ring-emerald-100' : 'hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800'}`}><div className={`p-2 rounded-xl ${activeTab==='history' ? 'bg-emerald-50' : 'bg-slate-100'}`}><History size={20} className="shrink-0" /></div><div><span className="font-bold block text-sm">Riwayat Saya</span><span className="text-[10px] opacity-70 hidden md:block mt-1">Log Aktivitas Lokal</span></div></button>
          </div>
          <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white/50 relative">
             {activeTab === 'surat' && (
                <div className="animate-fade-in max-w-2xl mx-auto space-y-8">
                   <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-800 text-sm"><HelpCircle className="shrink-0" size={20}/><div><p className="font-bold mb-1">Panduan Pengajuan:</p><ul className="list-disc ml-4 space-y-1 text-xs"><li>Isi formulir dengan data yang <strong>valid</strong> sesuai KTP.</li><li>Sistem akan mengunduh bukti <strong>DRAFT (Format PDF)</strong>.</li><li>Surat DRAFT <strong>belum sah</strong> (tanpa TTD/Stempel). Hubungi Ketua RT untuk validasi dan mendapatkan surat resmi.</li></ul></div></div>
                   <form onSubmit={handleSubmitSurat} className="space-y-6">
                       <div className="space-y-4"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2"><FileText size={16}/> Data Surat</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Jenis Surat</label><select className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={requestType} onChange={e=>setRequestType(e.target.value as any)}><option>Surat Izin Keramaian</option><option>Surat Keterangan Usaha (SKU)</option><option>Pengantar KTP</option><option>Pengantar KK</option><option>Domisili</option><option>Kematian</option><option>Kelahiran</option></select></div></div></div>
                       <div className="space-y-4"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2"><User size={16}/> Identitas Pemohon</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Nama Lengkap</label><input placeholder="Sesuai KTP" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={applicantName} onChange={e=>setApplicantName(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">NIK</label><input placeholder="16 Digit Angka" type="number" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={nik} onChange={e=>setNik(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Kepala Keluarga</label><input placeholder="Nama Kepala Keluarga" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={familyHeadName} onChange={e=>setFamilyHeadName(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Tempat Lahir</label><input placeholder="Kota Kelahiran" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={birthPlace} onChange={e=>setBirthPlace(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Tanggal Lahir</label><input type="date" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all text-slate-600" value={birthDate} onChange={e=>setBirthDate(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Jenis Kelamin</label><select className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={gender} onChange={e=>setGender(e.target.value as any)}><option>Laki-laki</option><option>Perempuan</option></select></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Agama</label><select className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={religion} onChange={e=>setReligion(e.target.value)}><option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option></select></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Pekerjaan</label><input placeholder="Cth: Karyawan Swasta" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={job} onChange={e=>setJob(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Kewarganegaraan</label><input placeholder="Indonesia" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={nationality} onChange={e=>setNationality(e.target.value)} required/></div><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Status Perkawinan</label><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{['Kawin', 'Belum Kawin', 'Cerai Hidup', 'Cerai Mati'].map(status => (<button type="button" key={status} onClick={() => setMaritalStatus(status as any)} className={`p-2 rounded-lg text-xs font-bold border transition-all ${maritalStatus === status ? 'bg-brand-blue text-white border-brand-blue shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{status}</button>))}</div></div></div></div>
                       <div className="space-y-4"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2"><MapIcon size={16}/> Alamat & Keperluan</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Alamat Domisili (Blok Rumah)</label><input placeholder="Cth: C5-05 (Wajib diisi)" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={houseId} onChange={e=>setHouseId(e.target.value)} required/></div><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Alamat Sesuai KTP</label><textarea placeholder="Jalan, RT/RW, Kelurahan, Kecamatan..." className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all h-20" value={addressKtp} onChange={e=>setAddressKtp(e.target.value)} required/></div><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Keperluan</label><textarea placeholder="Sebagai pengantar untuk mendapatkan Surat Izin Keramaian berupa Pesta Pernikahan dengan keperluan Mapacci (pada 1 November...) dan Resepsi..." className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all h-32" value={purposeDetail} onChange={e=>setPurposeDetail(e.target.value)} required/></div></div></div>
                       <div className="pt-4"><Button type="submit" className="w-full py-3.5 text-base shadow-lg shadow-blue-200"><Download size={20}/> Ajukan Permohonan & Unduh Draft</Button></div>
                   </form>
                </div>
             )}
             {activeTab === 'lapor' && (
                <div className="animate-fade-in max-w-lg mx-auto md:mx-0 space-y-6">
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6"><h3 className="font-bold text-rose-700 text-lg mb-1 flex items-center gap-2"><AlertTriangle size={20}/> Form Laporan Warga</h3><p className="text-xs text-rose-600">Laporan Anda akan masuk ke dashboard Ketua RT & Keamanan. Gunakan fitur ini secara bijak.</p></div>
                    <form onSubmit={handleSubmitLapor} className="space-y-6">
                        <div className="space-y-4"><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Kategori Masalah</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" value={reportType} onChange={e=>setReportType(e.target.value as any)}><option>Keamanan</option><option>Kebersihan</option><option>Fasilitas</option><option>Lainnya</option></select></div><div><label className="block text-xs font-bold text-slate-700 mb-2 ml-1">Pilih Masalah Cepat (Klik untuk isi)</label><div className="flex flex-wrap gap-2">{reportTags.map((tag, idx) => (<button type="button" key={idx} onClick={() => setReportDesc(tag.label)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all"><tag.icon size={12} /> {tag.label}</button>))}</div></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Lokasi Kejadian / Blok Rumah</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="Cth: C5-05 (Wajib diisi)" value={reportHouseId} onChange={e=>setReportHouseId(e.target.value)} required /></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Deskripsi Lengkap</label><textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-32 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="Jelaskan detail kejadian..." value={reportDesc} onChange={e=>setReportDesc(e.target.value)} required></textarea></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Nama Pelapor (Opsional)</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="Boleh dikosongkan jika ingin anonim" value={reporterName} onChange={e=>setReporterName(e.target.value)} /></div></div><Button type="submit" className="w-full py-3.5 bg-rose-600 text-white shadow-lg shadow-rose-200 hover:bg-rose-700 border-transparent"><Send size={18}/> Kirim Laporan</Button>
                    </form>
                </div>
             )}
             {activeTab === 'history' && (
                 <div className="animate-fade-in space-y-4 max-w-xl">
                     <div className="flex justify-between items-center mb-6 pb-4 border-b"><div><h3 className="font-bold text-lg text-slate-800">Riwayat Aktivitas</h3><p className="text-xs text-slate-400">Log tersimpan di perangkat ini (Local Storage).</p></div><button onClick={clearHistory} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold hover:bg-rose-50 hover:text-rose-600 transition-colors">Hapus Log</button></div>
                     <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">{localHistory.length === 0 ? (<div className="pl-6 text-slate-400 italic text-sm">Belum ada riwayat aktivitas.</div>) : (localHistory.map((item, idx) => (<div key={idx} className="relative pl-6 group"><div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${item.category === 'Laporan' ? 'bg-rose-500' : 'bg-brand-blue'}`}></div><div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-md transition-all"><div className="flex justify-between items-start mb-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${item.category === 'Laporan' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-brand-blue'}`}>{item.category}</span><span className="text-[10px] text-slate-400 font-medium">{item.date}</span></div><h4 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h4><p className="text-xs text-slate-500 line-clamp-2">{item.type && `Jenis: ${item.type}`} • {item.description || item.applicantName || "Detail tersimpan"}</p></div></div>)))}</div>
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
    const dataToShow = umkmData.length > 0 ? umkmData : []; 
    const categories = ['All', ...Array.from(new Set(dataToShow.map(u => u.category)))];
    const filteredUMKM = dataToShow.filter(u => (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.description.toLowerCase().includes(searchTerm.toLowerCase())) && (filterCategory === 'All' || u.category === filterCategory));

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-20">
             <div className="text-center mb-6"><h1 className="text-2xl font-bold">UMKM & Jasa Tetangga</h1></div>
             <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-sm border mb-6 flex flex-col md:flex-row gap-3"><input type="text" placeholder="Cari..." className="w-full p-2 bg-slate-50 border rounded-xl text-sm" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/><div className="flex gap-2 overflow-x-auto no-scrollbar">{categories.map(cat => <button key={cat} onClick={()=>setFilterCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-bold border ${filterCategory===cat?'bg-purple-600 text-white':'bg-white text-slate-600'}`}>{cat}</button>)}</div></div>
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
    const chartData = cashFlow.slice().reverse().map(c => ({ date: new Date(c.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}), amount: c.amount, type: c.type }));
    const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const sortedRonda = [...ronda].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
    const roleHierarchy = ['Ketua RT', 'Sekretaris', 'Bendahara', 'Bendahara RW', 'Koord. Keamanan', 'Seksi'];
    const sortedOfficials = [...officials].sort((a, b) => { const indexA = roleHierarchy.findIndex(r => a.role.includes(r)); const indexB = roleHierarchy.findIndex(r => b.role.includes(r)); return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB); });
    const [activeRondaDay, setActiveRondaDay] = useState(new Date().toLocaleDateString('id-ID', {weekday:'long'}));
    
    return (
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-20 space-y-8 animate-fade-in">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 p-8 md:p-12 text-center text-white shadow-2xl shadow-slate-200"><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div><div className="relative z-10"><span className="inline-block bg-brand-blue/20 text-brand-blue border border-brand-blue/30 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4">Transparansi Publik</span><h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Pusat Informasi RT 002</h1><p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">Akses data kepengurusan, laporan keuangan, dan jadwal kegiatan lingkungan secara terbuka dan akuntabel.</p></div></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 relative overflow-hidden group hover:scale-[1.02] transition-transform"><div className="absolute -right-6 -top-6 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Wallet size={140}/></div><div className="relative z-10"><p className="text-emerald-100 font-medium text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><ShieldCheck size={14}/> Keuangan Warga</p><h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">Rp {currentBalance.toLocaleString()}</h2><div className="flex gap-3 text-xs font-bold"><div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl flex items-center gap-1.5 border border-white/10"><div className="bg-white/20 p-1 rounded-full"><ArrowUpRight size={10} className="text-emerald-200"/></div>+{totalIncome.toLocaleString()}</div><div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl flex items-center gap-1.5 border border-white/10"><div className="bg-white/20 p-1 rounded-full"><ArrowDownRight size={10} className="text-rose-200"/></div>-{totalExpense.toLocaleString()}</div></div></div></div>
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-100 flex flex-col justify-between group hover:border-brand-blue/30 transition-colors"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Struktur Organisasi</p><h2 className="text-4xl font-black text-slate-800 mt-2">{officials.length} <span className="text-lg font-medium text-slate-400">Personil</span></h2></div><div className="bg-brand-blue/5 p-4 rounded-2xl text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors"><Briefcase size={28}/></div></div><p className="text-xs text-slate-400 mt-4 leading-relaxed">Siap melayani kebutuhan administrasi, keamanan, dan sosial warga RT 002.</p></div>
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-100 flex flex-col justify-between group hover:border-indigo-200 transition-colors"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Jadwal Keamanan</p><h2 className="text-xl font-black text-slate-800 mt-2 capitalize">{new Date().toLocaleDateString('id-ID', {weekday:'long'})}</h2></div><div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Moon size={28}/></div></div><div className="mt-4"><div className="flex -space-x-2 overflow-hidden py-1">{ronda.find(r => r.day === new Date().toLocaleDateString('id-ID', {weekday:'long'}))?.members.slice(0,4).map((m,i) => (<div key={i} className="w-9 h-9 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-sm" title={m}>{m.charAt(0)}</div>)) || <span className="text-sm text-slate-400 italic">Tidak ada jadwal</span>}</div><p className="text-[10px] text-slate-400 mt-2">*Tim Siskamling Malam Ini</p></div></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm"><div className="flex items-center justify-between mb-6"><h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><Target className="text-brand-blue" size={20}/> Program & Agenda 2024</h3></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[{ title: "Perbaikan Saluran Air", status: "Sedang Berjalan", date: "Okt - Nov 2024", icon: RefreshCw, color: "text-amber-500", bg: "bg-amber-50" }, { title: "Penyemprotan Fogging", status: "Selesai", date: "September 2024", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" }, { title: "Pembuatan Taman Toga", status: "Direncanakan", date: "Desember 2024", icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" }, { title: "Musyawarah Warga", status: "Rutin Bulanan", date: "Tiap Tanggal 10", icon: Users, color: "text-purple-500", bg: "bg-purple-50" }].map((prog, idx) => (<div key={idx} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-default"><div className={`p-3 rounded-xl ${prog.bg} ${prog.color}`}><prog.icon size={20}/></div><div><h4 className="font-bold text-slate-800 text-sm">{prog.title}</h4><div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{prog.status}</span><span className="text-[10px] text-slate-400">{prog.date}</span></div></div></div>))}</div></div>
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm"><div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"><div><h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><BarChart3 className="text-emerald-500" size={20}/> Laporan Arus Kas</h3><p className="text-sm text-slate-500 mt-1">Grafik pemasukan dan pengeluaran kas operasional RT.</p></div><button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"><FileDown size={16}/> Unduh Laporan PDF</button></div><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} /><YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`}/><RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}} itemStyle={{fontSize: '12px', fontWeight: 'bold'}} formatter={(value: number) => [`Rp ${value.toLocaleString()}`, 'Jumlah']} labelStyle={{color: '#64748b', marginBottom: '4px', fontSize: '10px'}} /><Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" /></AreaChart></ResponsiveContainer></div><div className="mt-8 pt-8 border-t border-slate-50"><h4 className="font-bold text-sm text-slate-700 mb-4">Transaksi Terakhir</h4><div className="space-y-3">{cashFlow.slice(0, 4).map(cf => (<div key={cf.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${cf.type==='Income'?'bg-emerald-100 text-emerald-600':'bg-rose-100 text-rose-600'}`}>{cf.type==='Income' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}</div><div><p className="font-bold text-slate-800 text-xs md:text-sm">{cf.description}</p><p className="text-[10px] text-slate-400">{new Date(cf.date).toLocaleDateString('id-ID', {day:'numeric', month:'long'})}</p></div></div><span className={`font-bold text-xs md:text-sm ${cf.type==='Income'?'text-emerald-600':'text-rose-600'}`}>{cf.type==='Income' ? '+' : '-'} Rp {cf.amount.toLocaleString()}</span></div>))}</div></div></div>
                </div>
                <div className="lg:col-span-1"><div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-300 h-full flex flex-col relative overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2"></div><h3 className="font-bold text-lg mb-6 flex items-center gap-2 relative z-10"><Shield size={20} className="text-indigo-400"/> Jadwal Siskamling</h3><div className="flex-1 flex flex-col gap-3 relative z-10">{sortedRonda.map((r, i) => { const isToday = r.day === new Date().toLocaleDateString('id-ID', {weekday:'long'}); return (<div key={i} onClick={() => setActiveRondaDay(r.day)} className={`group p-4 rounded-2xl border transition-all cursor-pointer ${activeRondaDay === r.day ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/50 scale-[1.02]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}><div className="flex justify-between items-center mb-2"><span className={`font-bold text-sm ${activeRondaDay === r.day ? 'text-white' : 'text-slate-300'}`}>{r.day}</span>{isToday && <span className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full animate-pulse">HARI INI</span>}</div>{activeRondaDay === r.day && (<div className="space-y-2 animate-fade-in mt-2 pt-2 border-t border-white/20">{r.members.map((m, idx) => (<div key={idx} className="flex items-center gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-indigo-300"></div><span className="text-indigo-100">{m}</span></div>))}{r.members.length === 0 && <p className="text-xs text-white/40 italic">Belum ada petugas.</p>}</div>)}{activeRondaDay !== r.day && (<div className="flex -space-x-1 overflow-hidden">{r.members.slice(0,3).map((_, idx) => (<div key={idx} className="w-4 h-4 rounded-full bg-white/20 border border-slate-900"></div>))}{r.members.length > 3 && <div className="w-4 h-4 rounded-full bg-white/10 text-[8px] flex items-center justify-center text-white">+</div>}</div>)}</div>); })}</div></div></div>
            </div>
            <section className="pt-8 border-t border-slate-200"><div className="flex items-center gap-3 mb-8"><div className="bg-purple-100 p-2.5 rounded-xl text-purple-600"><Users size={24}/></div><div><h2 className="text-xl md:text-2xl font-bold text-slate-800">Struktur Pengurus RT</h2><p className="text-sm text-slate-500">Periode Jabatan 2023 - 2026</p></div></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{sortedOfficials.map(o => (<div key={o.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"><div className={`h-24 relative ${o.role.includes('Ketua') ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : o.role.includes('Sekretaris') ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : o.role.includes('Bendahara') ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-slate-700 to-slate-600'}`}><div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div></div><div className="px-6 pb-6 text-center -mt-12 relative"><div className="inline-block p-1.5 bg-white rounded-full shadow-lg"><img src={o.photo||`https://ui-avatars.com/api/?name=${o.name}&background=random&size=128`} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 bg-slate-100" alt={o.name}/></div><h3 className="font-bold text-slate-800 text-lg mt-3">{o.name}</h3><div className="mt-1 mb-4"><span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${o.role.includes('Ketua') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : o.role.includes('Sekretaris') ? 'bg-blue-50 text-blue-700 border-blue-100' : o.role.includes('Bendahara') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{o.role}</span></div><div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-2 text-left"><div className="bg-slate-50 p-2 rounded-xl"><p className="text-[10px] text-slate-400 font-bold uppercase">Domisili</p><p className="text-xs font-bold text-slate-700 flex items-center gap-1"><Home size={10}/> {o.houseId}</p></div><a href={`https://wa.me/${o.phone}`} target="_blank" rel="noreferrer" className="bg-green-50 hover:bg-green-100 p-2 rounded-xl transition-colors cursor-pointer"><p className="text-[10px] text-green-600 font-bold uppercase">Kontak</p><p className="text-xs font-bold text-green-700 flex items-center gap-1"><Phone size={10}/> WhatsApp</p></a></div></div></div>))}</div></section>
        </div>
    );
};

// --- Admin Dashboard ---

const AdminDashboard = ({ 
  houses, 
  announcements, 
  cashFlow,
  officials,
  reports,
  letters,
  ronda, 
  inventory,
  umkm, 
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // -- Resident Management State --
  const [residentView, setResidentView] = useState<'grid' | 'table'>('table');
  const [searchResident, setSearchResident] = useState('');
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [editHouseForm, setEditHouseForm] = useState<{
    headOfFamily: string;
    occupants: number;
    phone: string;
    paymentStatus: string;
    residenceType: 'Tetap' | 'Kontrak'; 
    hasPregnant: boolean;
    hasBaby: boolean;
    hasToddler: boolean;
    hasTeenager: boolean; 
    hasElderly: boolean;
  }>({ 
      headOfFamily: '', occupants: 0, phone: '', paymentStatus: '', residenceType: 'Tetap',
      hasPregnant: false, hasBaby: false, hasToddler: false, hasTeenager: false, hasElderly: false 
  });

  const [serviceTab, setServiceTab] = useState<'surat' | 'laporan'>('surat');
  // Inputs
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<Announcement['type']>('General');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftTopic, setDraftTopic] = useState('');
  
  const [cashDesc, setCashDesc] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashType, setCashType] = useState<'Income' | 'Expense'>('Income');
  const [cashCategory, setCashCategory] = useState('Iuran');

  const [duesHouseId, setDuesHouseId] = useState('');
  const [duesAmount, setDuesAmount] = useState('25000');
  const [duesStatus, setDuesStatus] = useState<PaymentStatus>(PaymentStatus.PAID);

  const [offId, setOffId] = useState<string | null>(null); 
  const [offName, setOffName] = useState('');
  const [offRole, setOffRole] = useState('');
  const [offPhone, setOffPhone] = useState('');
  const [offHouse, setOffHouse] = useState('');
  const [offPhoto, setOffPhoto] = useState('');

  const [invId, setInvId] = useState<string | null>(null);
  const [invName, setInvName] = useState('');
  const [invTotal, setInvTotal] = useState('');
  const [invAvailable, setInvAvailable] = useState('');
  const [invCondition, setInvCondition] = useState<'Baik' | 'Perlu Perbaikan' | 'Rusak'>('Baik');
  const [invNotes, setInvNotes] = useState('');

  const [umkmId, setUmkmId] = useState<string | null>(null);
  const [umkmName, setUmkmName] = useState('');
  const [umkmOwner, setUmkmOwner] = useState('');
  const [umkmCategory, setUmkmCategory] = useState('');
  const [umkmDesc, setUmkmDesc] = useState('');
  const [umkmContact, setUmkmContact] = useState('');
  const [umkmImage, setUmkmImage] = useState('');

  const [selectedRondaId, setSelectedRondaId] = useState<string | null>(null);
  const [rondaDay, setRondaDay] = useState('');
  const [rondaMembers, setRondaMembers] = useState(''); 

  const [localConfig, setLocalConfig] = useState<PdfConfig>(pdfConfig);

  // Handlers
  const handleCreateAnnouncement = async (e: React.FormEvent) => { e.preventDefault(); await addAnnouncementToDb({ title: annTitle, content: annContent, type: annType, date: new Date().toISOString() }); setIsModalOpen(false); resetForms(); };
  const handleDeleteAnnouncement = async (id: string) => { if (confirm("Hapus pengumuman ini?")) await deleteAnnouncementFromDb(id); };
  const handleGenerateDraft = async () => { if(!draftTopic) return; setIsGenerating(true); const draft = await generateAnnouncementDraft(draftTopic); setAnnContent(draft); setAnnTitle(draftTopic); setIsGenerating(false); };
  const handleAddTransaction = async (e: React.FormEvent) => { e.preventDefault(); await addTransactionToDb({ description: cashDesc, amount: parseInt(cashAmount), type: cashType, category: cashCategory, date: new Date().toISOString().split('T')[0] }); setIsModalOpen(false); resetForms(); };
  const handleDeleteTransaction = async (id: string) => { if (confirm("Hapus transaksi ini?")) await deleteTransactionFromDb(id); };
  const handleSaveDues = async (e: React.FormEvent) => { e.preventDefault(); if (!duesHouseId) return; await updateHouseData(duesHouseId, { paymentStatus: duesStatus }); if (duesStatus === PaymentStatus.PAID) { const house = houses.find(h => h.id === duesHouseId); await addTransactionToDb({ description: `Iuran Warga ${duesHouseId} (${house?.headOfFamily || 'Warga'})`, amount: parseInt(duesAmount), type: 'Income', category: 'Iuran Warga', date: new Date().toISOString().split('T')[0] }); } setIsModalOpen(false); resetForms(); };
  const handleExportCSV = () => { const headers = ["Blok", "Nomor", "Kepala Keluarga", "Status Hunian", "Jumlah Penghuni", "Status Iuran", "No. HP"]; const rows = houses.map(h => { let statusIndo = h.status === 'Occupied' ? 'Dihuni' : h.status === 'Empty' ? 'Kosong' : 'Usaha'; if(h.status === 'Occupied' && h.residenceType === 'Kontrak') statusIndo += ' (Kontrak)'; return [h.block, h.number, `"${h.headOfFamily}"`, statusIndo, h.occupants, h.paymentStatus, h.phone || '-']; }); const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n"); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", `Data_Warga_RT002_${new Date().toISOString().split('T')[0]}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); };
  
  const handleDownloadTemplate = () => {
      const headers = "Blok,Nomor,Kepala Keluarga,Status Hunian,Jumlah Penghuni,Status Iuran,No. HP";
      const example = "C5,01,Bpk. Contoh,Dihuni (Tetap),4,Lunas,08123456789";
      const csvContent = `${headers}\n${example}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "Template_Data_Warga.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const text = event.target?.result as string;
          if (!text) return;

          const rows = text.split('\n').map(r => r.trim()).filter(r => r);
          // Check for valid CSV
          if (rows.length < 2) { alert("File CSV kosong atau tidak valid."); return; }
          
          const headers = rows[0].split(',');
          if (!headers[0].includes('Blok')) { alert("Format Header CSV Salah! Gunakan template yang disediakan."); return; }

          const newHouses: any[] = [];
          for (let i = 1; i < rows.length; i++) {
              const cols = rows[i].split(',').map(c => c.replace(/"/g, '').trim()); // remove quotes
              if (cols.length < 2) continue;

              const block = cols[0];
              const number = cols[1];
              const headOfFamily = cols[2];
              const statusRaw = cols[3].toLowerCase();
              const occupants = parseInt(cols[4]) || 0;
              const paymentStatusRaw = cols[5];
              const phone = cols[6] === '-' ? '' : cols[6];

              let status = 'Occupied';
              if (statusRaw.includes('kosong')) status = 'Empty';
              else if (statusRaw.includes('usaha')) status = 'Business';

              let residenceType = 'Tetap';
              if (statusRaw.includes('kontrak')) residenceType = 'Kontrak';

              let paymentStatus = PaymentStatus.UNPAID;
              if (paymentStatusRaw === 'Lunas') paymentStatus = PaymentStatus.PAID;
              else if (paymentStatusRaw === 'Belum Lunas') paymentStatus = PaymentStatus.PENDING;

              newHouses.push({
                  id: `${block}-${number}`,
                  block, number, headOfFamily, status, residenceType, occupants, paymentStatus, phone
              });
          }

          if (confirm(`Ditemukan ${newHouses.length} data. Apakah Anda yakin ingin mengupdate database?`)) {
              try {
                  await batchUpdateHouses(newHouses);
                  alert("Import Data Berhasil!");
              } catch (e) {
                  alert("Gagal mengupdate data. Cek koneksi internet.");
              }
          }
      };
      reader.readAsText(file);
      // Reset input value to allow re-uploading same file
      e.target.value = '';
  };

  const handleSaveInventory = async (e: React.FormEvent) => { e.preventDefault(); const itemData = { name: invName, total: parseInt(invTotal), available: parseInt(invAvailable), condition: invCondition, notes: invNotes }; if (invId) await updateInventoryInDb(invId, itemData); else await addInventoryToDb(itemData); setIsModalOpen(false); resetForms(); };
  const openEditInventory = (item: InventoryItem) => { setInvId(item.id); setInvName(item.name); setInvTotal(item.total.toString()); setInvAvailable(item.available.toString()); setInvCondition(item.condition); setInvNotes(item.notes || ''); setModalType('inventory'); setIsModalOpen(true); };
  const handleDeleteInventory = async (id: string) => { if(confirm("Hapus?")) await deleteInventoryFromDb(id); };
  const handleSaveUMKM = async (e: React.FormEvent) => { e.preventDefault(); const umkmData = { name: umkmName, owner: umkmOwner, category: umkmCategory, description: umkmDesc, contact: umkmContact, image: umkmImage }; if (umkmId) await updateUMKMInDb(umkmId, umkmData); else await addUMKMToDb(umkmData); setIsModalOpen(false); resetForms(); };
  const openEditUMKM = (u: UMKM) => { setUmkmId(u.id); setUmkmName(u.name); setUmkmOwner(u.owner); setUmkmCategory(u.category); setUmkmDesc(u.description); setUmkmContact(u.contact); setUmkmImage(u.image); setModalType('umkm'); setIsModalOpen(true); };
  const handleDeleteUMKM = async (id: string) => { if (confirm("Hapus?")) await deleteUMKMFromDb(id); };
  const openEditRonda = (schedule: RondaSchedule) => { if (!schedule.id) return; setSelectedRondaId(schedule.id); setRondaDay(schedule.day); setRondaMembers(schedule.members.join(', ')); setModalType('ronda'); setIsModalOpen(true); };
  const handleSaveRonda = async (e: React.FormEvent) => { e.preventDefault(); if (!selectedRondaId) return; const membersArray = rondaMembers.split(',').map(m => m.trim()).filter(m => m !== ''); await updateRondaSchedule(selectedRondaId, membersArray); setIsModalOpen(false); resetForms(); };
  const handleSaveOfficial = async (e: React.FormEvent) => { e.preventDefault(); const officialData = { name: offName, role: offRole, phone: offPhone, houseId: offHouse, photo: offPhoto || undefined }; if (offId) await updateOfficialInDb(offId, officialData); else await addOfficialToDb(officialData); setIsModalOpen(false); resetForms(); };
  const handleDeleteOfficial = async (id: string) => { if (confirm("Hapus?")) await deleteOfficialFromDb(id); };
  const handleEditOfficial = (o: Official) => { setOffId(o.id); setOffName(o.name); setOffRole(o.role); setOffPhone(o.phone); setOffHouse(o.houseId); setOffPhoto(o.photo||''); setModalType('official'); setIsModalOpen(true); };
  const openEditHouse = (h: House) => { setSelectedHouse(h); setEditHouseForm({ headOfFamily: h.headOfFamily, occupants: h.occupants, phone: h.phone || '', paymentStatus: h.paymentStatus, residenceType: h.residenceType || 'Tetap', hasPregnant: h.hasPregnant || false, hasBaby: h.hasBaby || false, hasToddler: h.hasToddler || false, hasTeenager: h.hasTeenager || false, hasElderly: h.hasElderly || false }); setModalType('editHouse'); setIsModalOpen(true); };
  const openDuesModal = (h: House) => { setDuesHouseId(h.id); setDuesStatus(PaymentStatus.PAID); setModalType('dues'); setIsModalOpen(true); };
  const handleSaveHouse = async (e: React.FormEvent) => { e.preventDefault(); if(selectedHouse) await updateHouseData(selectedHouse.id, { headOfFamily: editHouseForm.headOfFamily, occupants: parseInt(editHouseForm.occupants as any), phone: editHouseForm.phone, paymentStatus: editHouseForm.paymentStatus, residenceType: editHouseForm.residenceType, hasPregnant: editHouseForm.hasPregnant, hasBaby: editHouseForm.hasBaby, hasToddler: editHouseForm.hasToddler, hasTeenager: editHouseForm.hasTeenager, hasElderly: editHouseForm.hasElderly }); setIsModalOpen(false); }
  const handleUpdateReport = async (id: string, s: string) => await updateReportStatus(id, s);
  const handleDeleteReport = async (id: string) => await deleteReportFromDb(id);
  const handleUpdateLetter = async (id: string, s: string) => await updateLetterStatus(id, s);
  const handleDeleteLetter = async (id: string) => await deleteLetterFromDb(id);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PdfConfig) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setLocalConfig(prev => ({ ...prev, [field]: reader.result as string })); reader.readAsDataURL(file); } };
  const handleSaveConfig = () => { try { setPdfConfig(localConfig); localStorage.setItem('pdf_config', JSON.stringify(localConfig)); alert("Disimpan!"); } catch (e) { alert("Gagal menyimpan."); } };
  const resetForms = () => { setAnnTitle(''); setAnnContent(''); setDraftTopic(''); setCashDesc(''); setCashAmount(''); setCashType('Income'); setOffName(''); setOffRole(''); setOffPhone(''); setOffHouse(''); setOffPhoto(''); setOffId(null); setInvName(''); setInvTotal(''); setInvAvailable(''); setInvNotes(''); setInvId(null); setRondaMembers(''); setSelectedRondaId(null); setUmkmName(''); setUmkmOwner(''); setUmkmCategory(''); setUmkmDesc(''); setUmkmContact(''); setUmkmImage(''); setUmkmId(null); setDuesHouseId(''); setDuesAmount('25000'); setDuesStatus(PaymentStatus.PAID); };

  const navGroups = [
      { title: "Menu Utama", items: [{ id: 'overview', icon: LayoutDashboard, label: 'Dashboard' }] },
      { title: "Administrasi", items: [{ id: 'residents', icon: Users, label: 'Data Warga' }, { id: 'services', icon: Archive, label: 'Layanan Surat & Laporan' }, { id: 'finance', icon: DollarSign, label: 'Keuangan & Kas' }] },
      { title: "Lingkungan", items: [{ id: 'facilities', icon: Package, label: 'Fasilitas & Jadwal' }, { id: 'umkm', icon: ShoppingBag, label: 'UMKM Warga' }, { id: 'announcements', icon: Megaphone, label: 'Pengumuman' }, { id: 'officials', icon: Briefcase, label: 'Pengurus' }] },
      { title: "Sistem", items: [{ id: 'settings', icon: Settings, label: 'Pengaturan' }] }
  ];

  const renderNavItems = () => (
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
          {navGroups.map((group, groupIdx) => (
              <div key={groupIdx}>
                  <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-4">{group.title}</h3>
                  <div className="space-y-1">
                      {group.items.map(item => (
                          <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group font-medium ${activeTab === item.id ? 'bg-blue-50 text-brand-blue shadow-sm ring-1 ring-blue-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                              <item.icon size={18} className={activeTab === item.id ? 'text-brand-blue' : 'text-slate-400 group-hover:text-slate-600'} /> <span className="text-sm">{item.label}</span>
                              {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-blue"></div>}
                          </button>
                      ))}
                  </div>
              </div>
          ))}
      </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex relative">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
           <div className="w-72 bg-white h-full shadow-2xl animate-slide-in-right flex flex-col border-r border-slate-200" onClick={e => e.stopPropagation()}>
               <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div><h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight"><Shield className="text-brand-blue" size={20}/> TERAS Admin</h2><p className="text-xs text-slate-500">RT 002 / RW 020</p></div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="bg-slate-50 p-1.5 rounded-full text-slate-400 hover:text-slate-800"><X size={18}/></button>
               </div>
               {renderNavItems()}
               <div className="p-4 border-t border-slate-100 bg-slate-50"><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><LogOut size={18} /> <span className="font-medium text-sm">Keluar / Ke Beranda</span></button></div>
           </div>
        </div>
      )}

      <div className="w-64 bg-white border-r border-slate-200 fixed h-full hidden md:flex flex-col z-30 shadow-sm">
         <div className="p-6 border-b border-slate-100"><h2 className="text-xl font-black flex items-center gap-2 tracking-tight text-slate-800"><div className="bg-brand-blue p-1 rounded-lg"><Shield size={20} className="text-white"/></div> TERAS Admin</h2><p className="text-xs text-slate-400 mt-2 pl-1">Management Dashboard v1.0</p></div>
         {renderNavItems()}
         <div className="p-4 border-t border-slate-100 bg-slate-50"><button onClick={() => navigate('/')} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all text-xs font-bold border border-slate-200 hover:border-rose-200"><LogOut size={14} /> Keluar Aplikasi</button></div>
      </div>

      <div className="flex-1 md:ml-64 p-4 md:p-8 pb-safe-area-pb md:pb-8 max-w-full overflow-hidden">
          <div className="flex justify-between items-center mb-6 md:mb-8 sticky top-0 bg-slate-50/90 backdrop-blur-md z-20 py-3 border-b border-slate-200/50 md:border-none md:bg-transparent md:backdrop-blur-none">
             <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-white rounded-lg border border-slate-200 shadow-sm active:scale-95"><Menu size={24} /></button>
                <h1 className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-tight line-clamp-1">{activeTab}</h1>
             </div>
             <div className="flex items-center gap-3"><div className="bg-white p-2 rounded-full shadow-sm border border-slate-200"><User size={20} className="text-slate-700"/></div><span className="font-bold text-sm text-slate-700 hidden md:block">Ketua RT 002</span></div>
          </div>

          {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow"><div className="p-4 bg-sky-50 text-sky-600 rounded-2xl"><Users size={28}/></div><div><p className="text-slate-500 text-sm font-medium">Total Warga</p><h3 className="text-2xl font-black text-slate-800">{houses.filter(h => h.status === 'Occupied').length} KK</h3></div></div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow"><div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Wallet size={28}/></div><div><p className="text-slate-500 text-sm font-medium">Saldo Kas</p><h3 className="text-2xl font-black text-slate-800">Rp {(cashFlow.reduce((acc, c) => c.type === 'Income' ? acc + c.amount : acc - c.amount, 0)).toLocaleString()}</h3></div></div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow"><div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><AlertTriangle size={28}/></div><div><p className="text-slate-500 text-sm font-medium">Laporan Baru</p><h3 className="text-2xl font-black text-slate-800">{reports.filter(r => r.status === 'Baru').length}</h3></div></div>
                   </div>
              </div>
          )}

          {activeTab === 'umkm' && (
               <div className="animate-fade-in space-y-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border"><h2 className="font-bold text-lg">Daftar Usaha Warga</h2><Button onClick={() => { resetForms(); setModalType('umkm'); setIsModalOpen(true); }}><Plus size={18}/> Tambah</Button></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {umkm.map(u => (
                          <div key={u.id} className="bg-white rounded-xl shadow-sm border overflow-hidden group">
                              <div className="h-32 bg-slate-200 relative"><img src={u.image} className="w-full h-full object-cover" onError={(e)=>{(e.target as HTMLImageElement).src='https://via.placeholder.com/300x200?text=No+Image'}} /><div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openEditUMKM(u)} className="p-1.5 bg-white rounded-lg shadow text-slate-700 hover:text-blue-600"><Edit2 size={14}/></button><button onClick={() => handleDeleteUMKM(u.id)} className="p-1.5 bg-white rounded-lg shadow text-slate-700 hover:text-rose-600"><Trash2 size={14}/></button></div></div>
                              <div className="p-4"><div className="flex justify-between items-start"><h3 className="font-bold text-slate-800">{u.name}</h3><span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-bold">{u.category}</span></div><p className="text-xs text-slate-500 mt-1">Pemilik: {u.owner}</p></div>
                          </div>
                      ))}
                  </div>
               </div>
          )}

          {activeTab === 'residents' && (
              <div className="animate-fade-in space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={20}/></div><div><p className="text-[10px] uppercase text-slate-400 font-bold">Total Jiwa</p><h4 className="text-xl font-black text-slate-800">{houses.reduce((acc, h) => acc + (h.occupants || 0), 0)}</h4></div></div>
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3"><div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Home size={20}/></div><div><p className="text-[10px] uppercase text-slate-400 font-bold">Total KK</p><h4 className="text-xl font-black text-slate-800">{houses.filter(h => h.status === 'Occupied').length}</h4></div></div>
                  </div>
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="relative w-full md:w-96"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Cari..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={searchResident} onChange={(e) => setSearchResident(e.target.value)} /></div>
                      <div className="flex gap-2 items-center flex-wrap">
                          <label className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 text-xs font-bold transition-all shadow-md active:scale-95 h-10">
                              <Upload size={16}/> Import CSV
                              <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                          </label>
                          <Button onClick={handleDownloadTemplate} variant="outline" className="text-xs h-10 text-slate-600 border-dashed border-2"><FileText size={16}/> Template</Button>
                          <Button onClick={() => generateResidentReportPDF(houses, pdfConfig)} className="text-xs h-10 bg-slate-800 text-white"><Printer size={16}/> Cetak PDF</Button>
                          <Button onClick={handleExportCSV} variant="outline" className="text-xs h-10"><Download size={16}/> CSV</Button>
                          <div className="flex bg-slate-100 p-1 rounded-xl"><button onClick={() => setResidentView('grid')} className={`p-2 rounded-lg transition-all ${residentView === 'grid' ? 'bg-white shadow text-brand-blue' : 'text-slate-400'}`}><Grid size={18} /></button><button onClick={() => setResidentView('table')} className={`p-2 rounded-lg transition-all ${residentView === 'table' ? 'bg-white shadow text-brand-blue' : 'text-slate-400'}`}><List size={18} /></button></div>
                      </div>
                  </div>
                  {residentView === 'grid' ? (<div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm"><HouseMap houses={houses} isAdmin={true} onEditHouse={openEditHouse} onPayDues={openDuesModal} reports={reports} officials={officials} /></div>) : (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100"><tr><th className="px-6 py-4">Kavling Rumah</th><th className="px-6 py-4">Kepala Keluarga</th><th className="px-6 py-4">Status & Kontak</th><th className="px-6 py-4">Kewajiban Iuran</th><th className="px-6 py-4 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-50">{houses.filter(h => h.headOfFamily.toLowerCase().includes(searchResident.toLowerCase()) || h.id.toLowerCase().includes(searchResident.toLowerCase())).map(h => (<tr key={h.id} className="hover:bg-slate-50"><td className="px-6 py-4">{h.block}-{h.number}</td><td className="px-6 py-4">{h.headOfFamily}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${h.status === 'Occupied' ? 'bg-blue-50 text-blue-600' : h.status === 'Empty' ? 'bg-slate-100 text-slate-500' : 'bg-purple-50 text-purple-600'}`}>{h.status === 'Occupied' ? 'Dihuni' : h.status === 'Empty' ? 'Kosong' : 'Usaha'}</span></td><td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${h.paymentStatus === 'Lunas' ? 'bg-emerald-50 text-emerald-600' : h.paymentStatus === 'Belum Lunas' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>{h.paymentStatus}</span></td><td className="px-6 py-4 text-center"><button onClick={() => openEditHouse(h)} className="p-2 text-slate-400 hover:text-brand-blue"><Edit2 size={16} /></button></td></tr>))}</tbody></table></div>
                  )}
              </div>
          )}

          {activeTab === 'facilities' && (
              <div className="space-y-6">
                <Card title="Inventaris & Aset" action={<Button onClick={() => { resetForms(); setModalType('inventory'); setIsModalOpen(true); }} size="sm"><Plus size={16}/> Tambah</Button>}>
                   <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 uppercase text-[10px]"><tr><th className="px-4 py-3">Nama Barang</th><th className="px-4 py-3">Stok</th><th className="px-4 py-3">Kondisi</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead><tbody>{inventory.map(item => (<tr key={item.id} className="border-b"><td className="px-4 py-3 font-medium">{item.name}</td><td className="px-4 py-3">{item.available} / {item.total}</td><td className="px-4 py-3">{item.condition}</td><td className="px-4 py-3 text-right"><button onClick={() => openEditInventory(item)} className="text-blue-600 mx-1"><Edit2 size={14}/></button><button onClick={() => handleDeleteInventory(item.id)} className="text-red-600 mx-1"><Trash2 size={14}/></button></td></tr>))}</tbody></table></div>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {ronda.map(r => (<div key={r.id || r.day} className="bg-white p-4 rounded-xl border flex justify-between items-center"><div><h4 className="font-bold">{r.day}</h4><p className="text-xs text-slate-500">{r.members.length > 0 ? r.members.join(', ') : 'Belum ada petugas'}</p></div><button onClick={() => openEditRonda(r)} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100"><Edit2 size={16}/></button></div>))}
                </div>
              </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6">
               <Card title="Arus Kas" action={<Button onClick={() => { resetForms(); setModalType('cash'); setIsModalOpen(true); }} size="sm"><Plus size={16}/> Transaksi</Button>}>
                  <div className="space-y-2">{cashFlow.map(cf => (<div key={cf.id} className="flex justify-between items-center p-3 border-b border-slate-50 last:border-0"><div><p className="font-bold text-sm">{cf.description}</p><p className="text-xs text-slate-400">{cf.date} • {cf.category}</p></div><span className={`font-bold text-sm ${cf.type==='Income'?'text-emerald-600':'text-rose-600'}`}>{cf.type==='Income'?'+':'-'} {cf.amount.toLocaleString()}</span></div>))}</div>
               </Card>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
               <h3 className="font-bold text-lg">Konfigurasi PDF</h3>
               <div><label className="block text-xs font-bold mb-1">Nama Instansi / Kop Surat</label><input className="w-full p-2 border rounded" value={localConfig.rtAddress} onChange={e => setLocalConfig({...localConfig, rtAddress: e.target.value})} /></div>
               <div><label className="block text-xs font-bold mb-1">Logo (PNG/JPG)</label><input type="file" onChange={e => handleFileChange(e, 'logo')} className="text-xs" /></div>
               <div><label className="block text-xs font-bold mb-1">Stempel (PNG Transparan)</label><input type="file" onChange={e => handleFileChange(e, 'stamp')} className="text-xs" /></div>
               <div><label className="block text-xs font-bold mb-1">Tanda Tangan Ketua RT (PNG Transparan)</label><input type="file" onChange={e => handleFileChange(e, 'signature')} className="text-xs" /></div>
               <Button onClick={handleSaveConfig}>Simpan Konfigurasi</Button>
            </div>
          )}
          
          {activeTab === 'officials' && (
             <div className="space-y-4">
                <div className="flex justify-between"><h2 className="font-bold text-xl">Data Pengurus</h2><Button onClick={() => { resetForms(); setModalType('official'); setIsModalOpen(true); }}><Plus size={16}/> Tambah</Button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{officials.map(o => (<div key={o.id} className="bg-white p-4 rounded-xl border flex justify-between items-center"><div><h4 className="font-bold">{o.name}</h4><p className="text-sm text-slate-500">{o.role}</p></div><div className="flex gap-2"><button onClick={() => handleEditOfficial(o)} className="p-2 bg-blue-50 text-blue-600 rounded"><Edit2 size={16}/></button><button onClick={() => handleDeleteOfficial(o.id)} className="p-2 bg-red-50 text-red-600 rounded"><Trash2 size={16}/></button></div></div>))}</div>
             </div>
          )}

          {activeTab === 'announcements' && (
             <div className="space-y-4">
                <div className="flex justify-between"><h2 className="font-bold text-xl">Pengumuman</h2><Button onClick={() => { resetForms(); setModalType('announcement'); setIsModalOpen(true); }}><Plus size={16}/> Buat Baru</Button></div>
                <div className="space-y-2">{announcements.map(a => (<div key={a.id} className="bg-white p-4 rounded-xl border flex justify-between"><div><h4 className="font-bold">{a.title}</h4><p className="text-xs text-slate-500">{a.date}</p></div><button onClick={() => handleDeleteAnnouncement(a.id)} className="text-red-500"><Trash2 size={16}/></button></div>))}</div>
             </div>
          )}

          {activeTab === 'services' && (
             <div className="space-y-4">
                 <div className="flex gap-2 mb-4"><button onClick={() => setServiceTab('surat')} className={`px-4 py-2 rounded-lg text-sm font-bold ${serviceTab === 'surat' ? 'bg-slate-800 text-white' : 'bg-white border'}`}>Permohonan Surat</button><button onClick={() => setServiceTab('laporan')} className={`px-4 py-2 rounded-lg text-sm font-bold ${serviceTab === 'laporan' ? 'bg-slate-800 text-white' : 'bg-white border'}`}>Laporan Warga</button></div>
                 {serviceTab === 'surat' ? letters.map(l => (
                     <div key={l.id} className="bg-white p-4 rounded-xl border flex justify-between items-center"><div><h4 className="font-bold">{l.type}</h4><p className="text-xs text-slate-500">Oleh: {l.applicantName} ({l.date})</p><span className={`text-[10px] px-2 py-0.5 rounded ${l.status === 'Approved' ? 'bg-green-100 text-green-700' : l.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{l.status}</span></div><div className="flex gap-2"><button onClick={() => handleUpdateLetter(l.id, 'Approved')} className="text-green-600"><CheckCircle size={20}/></button><button onClick={() => handleUpdateLetter(l.id, 'Rejected')} className="text-red-600"><XCircle size={20}/></button><button onClick={() => handleDeleteLetter(l.id)} className="text-slate-400"><Trash2 size={20}/></button></div></div>
                 )) : reports.map(r => (
                     <div key={r.id} className="bg-white p-4 rounded-xl border flex justify-between items-center"><div><h4 className="font-bold">{r.type}</h4><p className="text-xs text-slate-500">{r.description} ({r.reporterName})</p><span className={`text-[10px] px-2 py-0.5 rounded ${r.status === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.status}</span></div><div className="flex gap-2"><button onClick={() => handleUpdateReport(r.id, 'Selesai')} className="text-green-600" title="Tandai Selesai"><CheckCircle size={20}/></button><button onClick={() => handleDeleteReport(r.id)} className="text-red-600"><Trash2 size={20}/></button></div></div>
                 ))}
             </div>
          )}

          {isModalOpen && (
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalType === 'announcement' ? "Buat Pengumuman" : modalType === 'cash' ? "Catat Transaksi" : modalType === 'official' ? "Data Pengurus" : modalType === 'inventory' ? "Data Inventaris" : modalType === 'ronda' ? "Jadwal Ronda" : modalType === 'umkm' ? "Data UMKM" : modalType === 'dues' ? "Catat Iuran" : "Edit Data Warga"}>
                 {modalType === 'announcement' && (
                     <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                         <div><label className="block text-xs font-bold mb-1">Judul</label><input className="w-full p-2 border rounded" value={annTitle} onChange={e=>setAnnTitle(e.target.value)} required/></div>
                         <div><label className="block text-xs font-bold mb-1">Isi Pengumuman (Gunakan AI)</label><div className="flex gap-2 mb-2"><input className="flex-1 p-2 border rounded text-xs" placeholder="Topik pengumuman..." value={draftTopic} onChange={e=>setDraftTopic(e.target.value)}/><button type="button" onClick={handleGenerateDraft} disabled={isGenerating} className="bg-purple-600 text-white px-3 rounded text-xs">{isGenerating ? '...' : 'Generate'}</button></div><textarea className="w-full p-2 border rounded h-32" value={annContent} onChange={e=>setAnnContent(e.target.value)} required/></div>
                         <div><label className="block text-xs font-bold mb-1">Tipe</label><select className="w-full p-2 border rounded" value={annType} onChange={e=>setAnnType(e.target.value as any)}><option>General</option><option>Urgent</option><option>Event</option></select></div>
                         <Button type="submit" className="w-full">Terbitkan</Button>
                     </form>
                 )}
                 {modalType === 'cash' && (
                     <form onSubmit={handleAddTransaction} className="space-y-4">
                         <div><label className="block text-xs font-bold mb-1">Keterangan</label><input className="w-full p-2 border rounded" value={cashDesc} onChange={e=>setCashDesc(e.target.value)} required/></div>
                         <div><label className="block text-xs font-bold mb-1">Nominal (Rp)</label><input type="number" className="w-full p-2 border rounded" value={cashAmount} onChange={e=>setCashAmount(e.target.value)} required/></div>
                         <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-bold mb-1">Tipe</label><select className="w-full p-2 border rounded" value={cashType} onChange={e=>setCashType(e.target.value as any)}><option value="Income">Pemasukan</option><option value="Expense">Pengeluaran</option></select></div><div><label className="block text-xs font-bold mb-1">Kategori</label><input className="w-full p-2 border rounded" value={cashCategory} onChange={e=>setCashCategory(e.target.value)}/></div></div>
                         <Button type="submit" className="w-full">Simpan</Button>
                     </form>
                 )}
                 {modalType === 'official' && (
                     <form onSubmit={handleSaveOfficial} className="space-y-4">
                         <div><label className="block text-xs font-bold mb-1">Nama</label><input className="w-full p-2 border rounded" value={offName} onChange={e=>setOffName(e.target.value)} required/></div>
                         <div><label className="block text-xs font-bold mb-1">Jabatan</label><input className="w-full p-2 border rounded" value={offRole} onChange={e=>setOffRole(e.target.value)} required/></div>
                         <div><label className="block text-xs font-bold mb-1">No HP</label><input className="w-full p-2 border rounded" value={offPhone} onChange={e=>setOffPhone(e.target.value)}/></div>
                         <div><label className="block text-xs font-bold mb-1">Rumah</label><input className="w-full p-2 border rounded" value={offHouse} onChange={e=>setOffHouse(e.target.value)}/></div>
                         <div><label className="block text-xs font-bold mb-1">URL Foto (Opsional)</label><input className="w-full p-2 border rounded" value={offPhoto} onChange={e=>setOffPhoto(e.target.value)}/></div>
                         <Button type="submit" className="w-full">Simpan</Button>
                     </form>
                 )}
                 {modalType === 'inventory' && (
                     <form onSubmit={handleSaveInventory} className="space-y-4">
                         <div><label className="block text-xs font-bold mb-1">Nama Barang</label><input className="w-full p-2 border rounded" value={invName} onChange={e=>setInvName(e.target.value)} required/></div>
                         <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-bold mb-1">Total</label><input type="number" className="w-full p-2 border rounded" value={invTotal} onChange={e=>setInvTotal(e.target.value)} required/></div><div><label className="block text-xs font-bold mb-1">Tersedia</label><input type="number" className="w-full p-2 border rounded" value={invAvailable} onChange={e=>setInvAvailable(e.target.value)} required/></div></div>
                         <div><label className="block text-xs font-bold mb-1">Kondisi</label><select className="w-full p-2 border rounded" value={invCondition} onChange={e=>setInvCondition(e.target.value as any)}><option>Baik</option><option>Perlu Perbaikan</option><option>Rusak</option></select></div>
                         <Button type="submit" className="w-full">Simpan</Button>
                     </form>
                 )}
                 {modalType === 'ronda' && (
                     <form onSubmit={handleSaveRonda} className="space-y-4">
                         <div><label className="block text-xs font-bold mb-1">Hari</label><input className="w-full p-2 border rounded bg-slate-100" value={rondaDay} disabled/></div>
                         <div><label className="block text-xs font-bold mb-1">Anggota (Pisahkan Koma)</label><textarea className="w-full p-2 border rounded h-24" value={rondaMembers} onChange={e=>setRondaMembers(e.target.value)}/></div>
                         <Button type="submit" className="w-full">Update Jadwal</Button>
                     </form>
                 )}
                 {modalType === 'umkm' && (
                     <form onSubmit={handleSaveUMKM} className="space-y-4">
                         <div><label className="block text-xs font-bold mb-1">Nama Usaha</label><input className="w-full p-2 border rounded" value={umkmName} onChange={e=>setUmkmName(e.target.value)} required/></div>
                         <div><label className="block text-xs font-bold mb-1">Pemilik</label><input className="w-full p-2 border rounded" value={umkmOwner} onChange={e=>setUmkmOwner(e.target.value)} required/></div>
                         <div><label className="block text-xs font-bold mb-1">Kategori</label><input className="w-full p-2 border rounded" value={umkmCategory} onChange={e=>setUmkmCategory(e.target.value)} placeholder="Kuliner, Jasa, dll" required/></div>
                         <div><label className="block text-xs font-bold mb-1">Kontak (Format: 628...)</label><input className="w-full p-2 border rounded" value={umkmContact} onChange={e=>setUmkmContact(e.target.value)} required/></div>
                         <div><label className="block text-xs font-bold mb-1">URL Gambar</label><input className="w-full p-2 border rounded" value={umkmImage} onChange={e=>setUmkmImage(e.target.value)}/></div>
                         <Button type="submit" className="w-full">Simpan</Button>
                     </form>
                 )}
                 {modalType === 'dues' && (
                     <form onSubmit={handleSaveDues} className="space-y-4">
                         <div><label className="block text-xs font-bold mb-1">Rumah</label><input className="w-full p-2 border rounded bg-slate-100" value={duesHouseId} disabled/></div>
                         <div><label className="block text-xs font-bold mb-1">Nominal Iuran (Rp)</label><input type="number" className="w-full p-2 border rounded" value={duesAmount} onChange={e=>setDuesAmount(e.target.value)}/></div>
                         <div><label className="block text-xs font-bold mb-1">Status Pembayaran</label><select className="w-full p-2 border rounded" value={duesStatus} onChange={e=>setDuesStatus(e.target.value as any)}><option value={PaymentStatus.PAID}>Lunas</option><option value={PaymentStatus.PENDING}>Belum Lunas</option><option value={PaymentStatus.UNPAID}>Menunggak</option></select></div>
                         <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Simpan Pembayaran</Button>
                     </form>
                 )}
                 {modalType === 'editHouse' && (
                     <form onSubmit={handleSaveHouse} className="space-y-4">
                        <div><label className="block text-xs font-bold mb-1">Kepala Keluarga</label><input className="w-full p-2 border rounded" value={editHouseForm.headOfFamily} onChange={e=>setEditHouseForm({...editHouseForm, headOfFamily: e.target.value})}/></div>
                        <div className="grid grid-cols-2 gap-2">
                           <div><label className="block text-xs font-bold mb-1">Jml Penghuni</label><input type="number" className="w-full p-2 border rounded" value={editHouseForm.occupants} onChange={e=>setEditHouseForm({...editHouseForm, occupants: e.target.value as any})}/></div>
                           <div><label className="block text-xs font-bold mb-1">No HP</label><input className="w-full p-2 border rounded" value={editHouseForm.phone} onChange={e=>setEditHouseForm({...editHouseForm, phone: e.target.value})}/></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="block text-xs font-bold mb-1">Status Hunian</label><select className="w-full p-2 border rounded" value={editHouseForm.residenceType} onChange={e=>setEditHouseForm({...editHouseForm, residenceType: e.target.value as any})}><option value="Tetap">Tetap (Milik)</option><option value="Kontrak">Kontrak/Sewa</option></select></div>
                            <div><label className="block text-xs font-bold mb-1">Iuran</label><select className="w-full p-2 border rounded" value={editHouseForm.paymentStatus} onChange={e=>setEditHouseForm({...editHouseForm, paymentStatus: e.target.value})}><option value={PaymentStatus.PAID}>Lunas</option><option value={PaymentStatus.PENDING}>Belum Lunas</option><option value={PaymentStatus.UNPAID}>Menunggak</option></select></div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1">Demografi Keluarga (Centang jika ada)</label>
                            <div className="flex flex-wrap gap-2">
                                <label className="flex items-center gap-1 text-xs border p-2 rounded cursor-pointer"><input type="checkbox" checked={editHouseForm.hasPregnant} onChange={e=>setEditHouseForm({...editHouseForm, hasPregnant: e.target.checked})}/> Ibu Hamil</label>
                                <label className="flex items-center gap-1 text-xs border p-2 rounded cursor-pointer"><input type="checkbox" checked={editHouseForm.hasBaby} onChange={e=>setEditHouseForm({...editHouseForm, hasBaby: e.target.checked})}/> Bayi</label>
                                <label className="flex items-center gap-1 text-xs border p-2 rounded cursor-pointer"><input type="checkbox" checked={editHouseForm.hasToddler} onChange={e=>setEditHouseForm({...editHouseForm, hasToddler: e.target.checked})}/> Balita</label>
                                <label className="flex items-center gap-1 text-xs border p-2 rounded cursor-pointer"><input type="checkbox" checked={editHouseForm.hasTeenager} onChange={e=>setEditHouseForm({...editHouseForm, hasTeenager: e.target.checked})}/> Remaja</label>
                                <label className="flex items-center gap-1 text-xs border p-2 rounded cursor-pointer"><input type="checkbox" checked={editHouseForm.hasElderly} onChange={e=>setEditHouseForm({...editHouseForm, hasElderly: e.target.checked})}/> Lansia</label>
                            </div>
                        </div>
                        <Button type="submit" className="w-full">Update Data Warga</Button>
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
  const [pdfConfig, setPdfConfig] = useState<PdfConfig>(DEFAULT_PDF_CONFIG);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isFirebaseConfigured) {
       const unsubs = [
          subscribeToCollection('houses', (data) => setHouses(data.length > 0 ? data : generateHouses())),
          subscribeToCollection('announcements', (data) => setAnnouncements(data)),
          subscribeToCollection('cashFlow', (data) => setCashFlow(data)),
          subscribeToCollection('officials', (data) => setOfficials(data)),
          subscribeToCollection('reports', (data) => setReports(data)),
          subscribeToCollection('letters', (data) => setLetters(data)),
          subscribeToCollection('ronda', (data) => setRonda(data)),
          subscribeToCollection('inventory', (data) => setInventory(data)),
          subscribeToCollection('umkm', (data) => setUmkm(data))
       ];
       return () => unsubs.forEach(u => u());
    } else {
       setHouses(generateHouses());
       setAnnouncements(MOCK_ANNOUNCEMENTS);
       setCashFlow(MOCK_CASHFLOW);
       setOfficials(INITIAL_OFFICIALS);
       setReports(INITIAL_REPORTS);
       setLetters(INITIAL_LETTERS);
       setRonda(MOCK_RONDA);
       setInventory(MOCK_INVENTORY);
       setUmkm(MOCK_UMKM);
    }
  }, []);

  useEffect(() => {
     const savedConfig = localStorage.getItem('pdf_config');
     if (savedConfig) {
        try { setPdfConfig(JSON.parse(savedConfig)); } catch (e) {}
     }
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={
           <>
             <PublicHeader />
             <PublicHome houses={houses} announcements={announcements} ronda={ronda} reports={reports} officials={officials} />
             <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
             <PanicButton />
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
