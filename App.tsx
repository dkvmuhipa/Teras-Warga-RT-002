
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, FileText, Megaphone, AlertTriangle, User, Users, LogIn, Menu, X, 
  LayoutDashboard, CreditCard, Send, Bot, Check, Trash2, Clock, CheckCircle, XCircle, Search, Edit2, Plus,
  Shield, Phone, TrendingUp, TrendingDown, Wallet, Calendar, ChevronRight, Moon, Sun, CloudRain, 
  MoreVertical, LogOut, ChevronDown, Filter, Download, Save, RefreshCw, Image as ImageIcon, Printer,
  DollarSign, Briefcase, MapPin, Sparkles, Loader2, Store, Archive
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

// Components & Services
import { Logo, generateHouses, MOCK_ANNOUNCEMENTS, MOCK_UMKM, INITIAL_REPORTS, INITIAL_LETTERS, MOCK_RONDA, MOCK_CASHFLOW, MOCK_GALLERY, RT_ADDRESS, APP_NAME, INITIAL_OFFICIALS } from './constants';
import { House, Announcement, Report, LetterRequest, PaymentStatus, UMKM, CashFlow, Official, RondaSchedule } from './types';
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
  seedDatabase
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
  <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-center mb-6">
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
      className="fixed bottom-6 left-4 z-[40] group flex items-center gap-2 animate-bounce-slow"
    >
      <div className="bg-red-600 text-white p-3.5 rounded-full shadow-xl shadow-red-500/40 hover:bg-red-700 hover:scale-110 transition-all ring-4 ring-red-100">
        <Phone size={24} fill="currentColor" />
      </div>
      <span className="bg-white text-red-600 border border-red-100 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 whitespace-nowrap hidden sm:block">
        Tombol Darurat
      </span>
    </a>
  );
};

// --- Public Layout Components ---

const PublicHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? "text-brand-blue bg-blue-50" : "text-slate-600 hover:text-brand-blue";

  return (
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
          <div className="flex items-center md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 p-2">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
            <button onClick={() => { navigate('/'); setIsOpen(false); }} className={`block px-3 py-2 rounded-md text-base font-medium text-left ${isActive('/')}`}>Beranda</button>
            <button onClick={() => { navigate('/services'); setIsOpen(false); }} className={`block px-3 py-2 rounded-md text-base font-medium text-left ${isActive('/services')}`}>Layanan</button>
            <button onClick={() => { navigate('/umkm'); setIsOpen(false); }} className={`block px-3 py-2 rounded-md text-base font-medium text-left ${isActive('/umkm')}`}>UMKM</button>
            <button onClick={() => { navigate('/info'); setIsOpen(false); }} className={`block px-3 py-2 rounded-md text-base font-medium text-left ${isActive('/info')}`}>Info RT</button>
            <div className="pt-2">
               <button onClick={() => { navigate('/admin'); setIsOpen(false); }} className="w-full block px-3 py-2 rounded-md text-base font-medium text-brand-blue bg-blue-50 text-center mt-2 border border-blue-100">Login Ketua RT</button>
            </div>
          </div>
        </div>
      )}
    </nav>
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
    <div className="relative bg-gradient-to-r from-cyan-600 to-blue-700 rounded-3xl overflow-hidden mb-8 shadow-xl shadow-blue-200 group animate-fade-in">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558036117-15db5275d42b?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay group-hover:scale-105 transition-transform duration-[20s]"></div>
      
      <div className="relative px-6 py-10 md:px-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left text-white max-w-2xl">
          <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold mb-4 tracking-wide uppercase border border-white/30 text-blue-50 shadow-lg">
            RT 002 / RW 020
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight drop-shadow-sm">
            Lingkungan Kita,<br/> <span className="text-cyan-200">Keluarga Kita</span>
          </h1>
          <p className="text-blue-50 text-base md:text-lg font-light leading-relaxed max-w-lg">
            Sistem informasi digital terpadu untuk mewujudkan tetangga rukun, administrasi transparan, dan lingkungan harmonis.
          </p>
        </div>

        {/* Weather & Time Widget */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white w-full md:w-auto min-w-[240px] shadow-lg transform md:rotate-1 hover:rotate-0 transition-all">
           <div className="flex items-start justify-between mb-4">
              <div>
                 <p className="text-4xl font-black tracking-tighter">{timeString}</p>
                 <p className="text-xs font-medium text-blue-100 uppercase tracking-widest">{dateString}</p>
              </div>
              <Sun size={32} className="text-amber-300 animate-spin-slow" />
           </div>
           <div className="h-px bg-white/20 my-3"></div>
           <div className="flex justify-between items-center text-sm font-medium">
              <span className="flex items-center gap-1.5"><CloudRain size={14} className="text-blue-200"/> 28°C Cerah</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-blue-50">Kota Palu</span>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Public Views ---

const PublicHome = ({ houses, announcements, ronda }: { houses: House[], announcements: Announcement[], ronda: RondaSchedule[] }) => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8 animate-fade-in mb-20">
      <HeroSection />

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up -mt-4 relative z-10">
        <button onClick={() => navigate('/services')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center gap-2 group">
          <div className="p-3 bg-blue-50 text-brand-blue rounded-full group-hover:bg-brand-blue group-hover:text-white transition-colors">
            <FileText size={24} />
          </div>
          <span className="font-bold text-slate-700 text-sm">Buat Surat</span>
        </button>
        <button onClick={() => navigate('/services')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center gap-2 group">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-full group-hover:bg-rose-500 group-hover:text-white transition-colors">
            <AlertTriangle size={24} />
          </div>
          <span className="font-bold text-slate-700 text-sm">Lapor Warga</span>
        </button>
        <button onClick={() => navigate('/info')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center gap-2 group">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-full group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <Wallet size={24} />
          </div>
          <span className="font-bold text-slate-700 text-sm">Info Iuran</span>
        </button>
        <button onClick={() => navigate('/umkm')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center gap-2 group">
          <div className="p-3 bg-purple-50 text-purple-500 rounded-full group-hover:bg-purple-500 group-hover:text-white transition-colors">
            <Users size={24} />
          </div>
          <span className="font-bold text-slate-700 text-sm">UMKM Warga</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* House Map */}
          <HouseMap houses={houses} isAdmin={false} />

          {/* Announcements */}
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <div className="bg-brand-blue/10 p-2 rounded-lg">
                  <Megaphone className="text-brand-blue" size={20} /> 
                </div>
                Pengumuman Terbaru
              </h2>
            </div>
            <div className="space-y-4">
              {announcements.map((ann, idx) => (
                <div key={ann.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      ann.type === 'Urgent' ? 'bg-rose-100 text-rose-600' :
                      ann.type === 'Event' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ann.type}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Clock size={12} /> {new Date(ann.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{ann.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">{ann.content}</p>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center p-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">Belum ada pengumuman.</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Card title="Jadwal Ronda Malam Ini" className="bg-gradient-to-b from-slate-800 to-slate-900 text-white border-0">
             <div className="space-y-4">
                {ronda.find(r => r.day === new Date().toLocaleDateString('id-ID', {weekday:'long'}))?.members.map((member, i) => (
                   <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">{i+1}</div>
                      <span className="font-medium text-sm">{member}</span>
                   </div>
                )) || <p className="text-slate-400 text-sm">Tidak ada jadwal ronda hari ini.</p>}
             </div>
             <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <button onClick={() => navigate('/info')} className="text-xs font-bold text-blue-200 hover:text-white transition-colors">Lihat Jadwal Lengkap →</button>
             </div>
          </Card>

          <Card title="Galeri Kegiatan">
             <div className="grid grid-cols-2 gap-2">
                {MOCK_GALLERY.slice(0,4).map(item => (
                   <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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

const PublicServices = () => {
  const [activeTab, setActiveTab] = useState<'surat' | 'lapor'>('surat');
  
  // Form States
  const [requestType, setRequestType] = useState<LetterRequest['type']>('Pengantar KTP');
  const [applicantName, setApplicantName] = useState('');
  const [houseId, setHouseId] = useState('');
  const [reportType, setReportType] = useState<Report['type']>('Fasilitas');
  const [reportDesc, setReportDesc] = useState('');
  const [reporterName, setReporterName] = useState('');

  const handleSubmitSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct request object for PDF & DB
    const letterData: LetterRequest = {
        id: Date.now().toString(),
        type: requestType,
        applicantName: applicantName,
        houseId: houseId,
        nik: '7271xxxxxxxxxxxx', 
        birthPlace: 'Palu',
        birthDate: '1990-01-01',
        religion: 'Islam',
        gender: 'LAKI-LAKI',
        job: 'Warga',
        maritalStatus: 'KAWIN',
        addressKtp: 'Sesuai Domisili',
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
    };
    
    // 1. Generate PDF for User
    generateSuratPengantar(letterData);
    
    // 2. Save to Database for Admin
    await addLetterToDb(letterData);

    alert("Permohonan berhasil! Surat telah diunduh dan notifikasi dikirim ke RT.");
    setApplicantName(''); setHouseId('');
  };

  const handleSubmitLapor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newReport: any = {
      type: reportType,
      description: reportDesc,
      reporterName: reporterName || "Anonim",
      date: new Date().toISOString().split('T')[0],
      status: 'Baru'
    };

    await addReportToDb(newReport);
    alert("Laporan berhasil dikirim! Akan segera ditindaklanjuti.");
    setReportDesc(''); setReporterName('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 mb-20">
       <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Layanan Digital</h1>
          <p className="text-slate-500">Urus surat dan laporan warga tanpa perlu antri.</p>
       </div>

       <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[500px]">
          {/* Tabs Sidebar */}
          <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-6 flex flex-row md:flex-col gap-2">
             <button 
                onClick={() => setActiveTab('surat')}
                className={`flex-1 md:flex-none p-4 rounded-xl text-left flex flex-col gap-2 transition-all ${activeTab === 'surat' ? 'bg-white text-brand-blue shadow-md shadow-blue-100 ring-1 ring-blue-100' : 'hover:bg-white hover:shadow-sm text-slate-500'}`}
             >
                <FileText size={24} />
                <div>
                   <span className="font-bold block">Surat Pengantar</span>
                   <span className="text-xs opacity-70">KTP, KK, Domisili, dll</span>
                </div>
             </button>
             <button 
                onClick={() => setActiveTab('lapor')}
                className={`flex-1 md:flex-none p-4 rounded-xl text-left flex flex-col gap-2 transition-all ${activeTab === 'lapor' ? 'bg-white text-rose-600 shadow-md shadow-rose-100 ring-1 ring-rose-100' : 'hover:bg-white hover:shadow-sm text-slate-500'}`}
             >
                <AlertTriangle size={24} />
                <div>
                   <span className="font-bold block">Lapor Pak RT</span>
                   <span className="text-xs opacity-70">Keamanan & Fasilitas</span>
                </div>
             </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8">
             {activeTab === 'surat' ? (
                <form onSubmit={handleSubmitSurat} className="space-y-6 max-w-lg animate-fade-in">
                   <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4">Buat Surat Pengantar</h3>
                      <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Surat</label>
                            <select 
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none"
                              value={requestType}
                              onChange={(e) => setRequestType(e.target.value as any)}
                            >
                               <option>Pengantar KTP</option>
                               <option>Pengantar KK</option>
                               <option>Domisili</option>
                               <option>Kematian</option>
                               <option>Kelahiran</option>
                               <option>Surat Keterangan Usaha (SKU)</option>
                            </select>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pemohon</label>
                               <input 
                                  required
                                  type="text" 
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none"
                                  placeholder="Sesuai KTP"
                                  value={applicantName}
                                  onChange={(e) => setApplicantName(e.target.value)}
                               />
                            </div>
                            <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Blok / No. Rumah</label>
                               <input 
                                  required
                                  type="text" 
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none"
                                  placeholder="Contoh: C5-10"
                                  value={houseId}
                                  onChange={(e) => setHouseId(e.target.value)}
                               />
                            </div>
                         </div>
                         <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3 text-sm text-yellow-800">
                             <Printer size={20} className="shrink-0" />
                             <p>Sistem akan otomatis mengunduh file PDF Surat Pengantar yang sudah ditandatangani secara digital. Silakan cetak dan bawa ke Kantor Kelurahan.</p>
                         </div>
                      </div>
                   </div>
                   <Button type="submit" className="w-full py-3">Unduh Surat Pengantar</Button>
                </form>
             ) : (
                <form onSubmit={handleSubmitLapor} className="space-y-6 max-w-lg animate-fade-in">
                   <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4">Layanan Lapor Warga</h3>
                      <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Laporan</label>
                            <select 
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                              value={reportType}
                              onChange={(e) => setReportType(e.target.value as any)}
                            >
                               <option>Keamanan</option>
                               <option>Kebersihan</option>
                               <option>Fasilitas</option>
                               <option>Lainnya</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Laporan</label>
                            <textarea 
                               required
                               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none h-32 resize-none"
                               placeholder="Jelaskan detail kejadian, lokasi, dan waktu..."
                               value={reportDesc}
                               onChange={(e) => setReportDesc(e.target.value)}
                            ></textarea>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pelapor (Opsional)</label>
                            <input 
                               type="text" 
                               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                               placeholder="Boleh dikosongkan jika ingin anonim"
                               value={reporterName}
                               onChange={(e) => setReporterName(e.target.value)}
                            />
                         </div>
                      </div>
                   </div>
                   <Button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200">Kirim Laporan</Button>
                </form>
             )}
          </div>
       </div>
    </div>
  );
};

const PublicUMKM = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    
    // Derived categories
    const categories = ['All', ...Array.from(new Set(MOCK_UMKM.map(u => u.category)))];
    
    // Filter Logic
    const filteredUMKM = MOCK_UMKM.filter(umkm => {
        const matchesSearch = umkm.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              umkm.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || umkm.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 mb-20">
             <div className="text-center mb-10">
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-xs font-bold uppercase tracking-wider mb-2 inline-block">Ekonomi Warga</span>
                <h1 className="text-3xl font-extrabold text-slate-800 mb-2">UMKM & Jasa Tetangga</h1>
                <p className="text-slate-500">Dukung usaha lokal RT 002. Dari warga, oleh warga, untuk warga.</p>
             </div>

             {/* Search & Filter Toolbar */}
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-20 z-30">
                 <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Cari nasi kuning, laundry, pulsa..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 no-scrollbar">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                                filterCategory === cat 
                                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
                {filteredUMKM.map(umkm => (
                    <div key={umkm.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 hover:-translate-y-1 group">
                        <div className="h-48 overflow-hidden relative">
                            <img src={umkm.image} alt={umkm.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 bg-white/90 backdrop-blur text-purple-700 text-xs font-bold rounded-lg shadow-sm">
                                    {umkm.category}
                                </span>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-1">{umkm.name}</h3>
                            <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1">
                                <User size={12}/> {umkm.owner}
                            </p>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2">
                                {umkm.description}
                            </p>
                            <a 
                                href={`https://wa.me/${umkm.contact}`} 
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full py-2.5 bg-slate-800 text-white text-center rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors"
                            >
                                Hubungi Penjual
                            </a>
                        </div>
                    </div>
                ))}
                {filteredUMKM.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400">
                        <Store size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Tidak ada UMKM yang ditemukan.</p>
                    </div>
                )}
             </div>
        </div>
    );
};

const PublicInfo = ({ officials, cashFlow, ronda }: { officials: Official[], cashFlow: CashFlow[], ronda: RondaSchedule[] }) => {
    // Calculate simple stats
    const totalIncome = cashFlow.filter(c => c.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = cashFlow.filter(c => c.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    const currentBalance = totalIncome - totalExpense;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 mb-20 space-y-10">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Transparansi RT</h1>
                <p className="text-slate-500">Informasi pengurus, keuangan, dan jadwal kegiatan yang terbuka.</p>
            </div>

            {/* Officials Section */}
            <section className="animate-slide-up">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-brand-blue/10 p-2 rounded-lg text-brand-blue"><Users size={24}/></div>
                    <h2 className="text-2xl font-bold text-slate-800">Struktur Pengurus</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {officials.map(official => (
                         <div key={official.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-all relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-slate-50 to-transparent z-0"></div>
                             <div className="w-20 h-20 rounded-full bg-slate-200 mb-4 overflow-hidden border-4 border-white shadow-lg relative z-10">
                                 <img src={official.photo || `https://ui-avatars.com/api/?name=${official.name}&background=0F172A&color=fff`} alt={official.name} className="w-full h-full object-cover"/>
                             </div>
                             <div className="relative z-10">
                                <h3 className="font-bold text-slate-800 text-lg">{official.name}</h3>
                                <p className="text-brand-blue text-sm font-bold uppercase tracking-wider mb-2">{official.role}</p>
                                <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-2 rounded-lg inline-block w-full">
                                    <p className="flex items-center justify-center gap-1.5"><Home size={10}/> {official.houseId}</p>
                                    <p className="flex items-center justify-center gap-1.5"><Phone size={10}/> {official.phone}</p>
                                </div>
                             </div>
                         </div>
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Financial Report */}
                 <section className="animate-slide-up" style={{animationDelay: '0.1s'}}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><TrendingUp size={24}/></div>
                        <h2 className="text-2xl font-bold text-slate-800">Laporan Kas</h2>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                             <p className="text-emerald-100 text-sm font-medium mb-1">Saldo Kas Saat Ini</p>
                             <h3 className="text-3xl font-bold">Rp {currentBalance.toLocaleString('id-ID')}</h3>
                             <div className="mt-4 flex gap-4 text-xs font-medium">
                                 <div className="bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full bg-white"></div> Masuk: Rp {totalIncome.toLocaleString()}
                                 </div>
                                 <div className="bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full bg-rose-300"></div> Keluar: Rp {totalExpense.toLocaleString()}
                                 </div>
                             </div>
                        </div>
                        <div className="p-0">
                            {cashFlow.slice(0, 5).map((flow, i) => (
                                <div key={flow.id} className={`flex justify-between items-center p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${flow.type === 'Income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {flow.type === 'Income' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-700">{flow.description}</p>
                                            <p className="text-xs text-slate-400">{flow.date}</p>
                                        </div>
                                    </div>
                                    <span className={`font-bold text-sm ${flow.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {flow.type === 'Income' ? '+' : '-'} Rp {flow.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                            {cashFlow.length === 0 && <div className="p-6 text-center text-slate-400 text-sm">Belum ada data transaksi.</div>}
                        </div>
                    </div>
                 </section>

                 {/* Ronda Schedule */}
                 <section className="animate-slide-up" style={{animationDelay: '0.2s'}}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-slate-800 p-2 rounded-lg text-white"><Shield size={24}/></div>
                        <h2 className="text-2xl font-bold text-slate-800">Jadwal Ronda</h2>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="space-y-4">
                            {ronda.map((r, idx) => {
                                const isToday = r.day === new Date().toLocaleDateString('id-ID', {weekday: 'long'});
                                return (
                                    <div key={idx} className={`p-4 rounded-xl border transition-all ${isToday ? 'bg-slate-800 text-white border-slate-800 shadow-lg transform scale-105' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-lg">{r.day}</h4>
                                            {isToday && <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider">Hari Ini</span>}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {r.members.map((m, i) => (
                                                <span key={i} className={`text-xs px-2 py-1 rounded-md font-medium ${isToday ? 'bg-white/20 text-blue-50' : 'bg-slate-100 text-slate-600'}`}>
                                                    {m}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                 </section>
            </div>
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
  letters
}: { 
  houses: House[], 
  announcements: Announcement[],
  cashFlow: CashFlow[],
  officials: Official[],
  reports: Report[],
  letters: LetterRequest[]
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'announcement' | 'cash' | 'official'>('announcement');
  
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

  // Official Inputs
  const [offId, setOffId] = useState<string | null>(null); // For Edit
  const [offName, setOffName] = useState('');
  const [offRole, setOffRole] = useState('');
  const [offPhone, setOffPhone] = useState('');
  const [offHouse, setOffHouse] = useState('');
  const [offPhoto, setOffPhoto] = useState('');

  // Logout Logic
  const navigate = useNavigate();

  // Handlers
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAnn: any = {
      title: annTitle,
      content: annContent,
      type: annType,
      date: new Date().toISOString()
    };
    await addAnnouncementToDb(newAnn);
    setIsModalOpen(false);
    resetForms();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm("Hapus pengumuman ini?")) {
       await deleteAnnouncementFromDb(id);
    }
  };

  const handleGenerateDraft = async () => {
    if(!draftTopic) return;
    setIsGenerating(true);
    const draft = await generateAnnouncementDraft(draftTopic);
    setAnnContent(draft);
    setAnnTitle(draftTopic); // Simple default
    setIsGenerating(false);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
     e.preventDefault();
     const newTx: any = {
         description: cashDesc,
         amount: parseInt(cashAmount),
         type: cashType,
         category: cashCategory,
         date: new Date().toISOString().split('T')[0] // Simple YYYY-MM-DD
     };
     await addTransactionToDb(newTx);
     setIsModalOpen(false);
     resetForms();
  };

  const handleDeleteTransaction = async (id: string) => {
      if (confirm("Hapus transaksi ini? Saldo akan dihitung ulang.")) {
          await deleteTransactionFromDb(id);
      }
  };

  const handleSaveOfficial = async (e: React.FormEvent) => {
      e.preventDefault();
      const officialData = {
          name: offName,
          role: offRole,
          phone: offPhone,
          houseId: offHouse,
          photo: offPhoto || undefined
      };

      if (offId) {
          await updateOfficialInDb(offId, officialData);
      } else {
          await addOfficialToDb(officialData);
      }
      setIsModalOpen(false);
      resetForms();
  };

  const handleDeleteOfficial = async (id: string) => {
      if (confirm("Hapus pengurus ini?")) {
          await deleteOfficialFromDb(id);
      }
  };

  const handleEditOfficial = (o: Official) => {
      setOffId(o.id);
      setOffName(o.name);
      setOffRole(o.role);
      setOffPhone(o.phone);
      setOffHouse(o.houseId);
      setOffPhoto(o.photo || '');
      setModalType('official');
      setIsModalOpen(true);
  };

  // Report & Letter Actions
  const handleUpdateReport = async (id: string, status: string) => {
      await updateReportStatus(id, status);
  }
  const handleDeleteReport = async (id: string) => {
      if(confirm("Hapus laporan ini?")) await deleteReportFromDb(id);
  }
  const handleUpdateLetter = async (id: string, status: string) => {
      await updateLetterStatus(id, status);
  }
  const handleDeleteLetter = async (id: string) => {
      if(confirm("Hapus arsip surat ini?")) await deleteLetterFromDb(id);
  }

  const resetForms = () => {
      setAnnTitle(''); setAnnContent(''); setDraftTopic('');
      setCashDesc(''); setCashAmount(''); setCashType('Income');
      setOffName(''); setOffRole(''); setOffPhone(''); setOffHouse(''); setOffPhoto(''); setOffId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white fixed h-full hidden md:flex flex-col overflow-y-auto">
         <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="text-brand-blue"/> Admin Panel</h2>
            <p className="text-xs text-slate-400 mt-1">Manage RT 002/020</p>
         </div>
         <nav className="flex-1 p-4 space-y-1">
            {[
                {id: 'overview', icon: LayoutDashboard, label: 'Overview'},
                {id: 'services', icon: Archive, label: 'Layanan'},
                {id: 'residents', icon: Users, label: 'Data Warga'},
                {id: 'finance', icon: DollarSign, label: 'Keuangan'},
                {id: 'announcements', icon: Megaphone, label: 'Pengumuman'},
                {id: 'officials', icon: Briefcase, label: 'Pengurus'},
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
      <div className="flex-1 md:ml-64 p-8">
          <div className="flex justify-between items-center mb-8">
             <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">
                 {activeTab === 'overview' ? 'Dashboard Overview' : 
                  activeTab === 'finance' ? 'Laporan Keuangan' : 
                  activeTab === 'residents' ? 'Database Warga' : 
                  activeTab === 'officials' ? 'Struktur Pengurus' : 
                  activeTab === 'services' ? 'Layanan & Laporan' : 'Manajemen Pengumuman'}
             </h1>
             <div className="flex items-center gap-3">
                 <div className="bg-white p-2 rounded-full shadow-sm border border-slate-200"><User size={20}/></div>
                 <span className="font-bold text-sm text-slate-700">Ketua RT</span>
             </div>
          </div>

          {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                          <div className="p-4 bg-sky-50 text-sky-600 rounded-xl"><Users size={28}/></div>
                          <div>
                              <p className="text-slate-500 text-sm font-medium">Total Warga</p>
                              <h3 className="text-2xl font-bold text-slate-800">{houses.filter(h => h.status === 'Occupied').length} KK</h3>
                          </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet size={28}/></div>
                          <div>
                              <p className="text-slate-500 text-sm font-medium">Saldo Kas</p>
                              <h3 className="text-2xl font-bold text-slate-800">Rp {(cashFlow.reduce((acc, c) => c.type === 'Income' ? acc + c.amount : acc - c.amount, 0)).toLocaleString()}</h3>
                          </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                          <div className="p-4 bg-rose-50 text-rose-600 rounded-xl"><AlertTriangle size={28}/></div>
                          <div>
                              <p className="text-slate-500 text-sm font-medium">Laporan Baru</p>
                              <h3 className="text-2xl font-bold text-slate-800">{reports.filter(r => r.status === 'Baru').length}</h3>
                          </div>
                      </div>
                  </div>
                  
                  {/* Latest Activities / Logs (Real Data) */}
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
                          {letters.length === 0 && reports.length === 0 && <p className="text-slate-400 text-sm italic">Belum ada aktivitas.</p>}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'residents' && (
              <div className="animate-fade-in">
                  <HouseMap houses={houses} isAdmin={true} />
              </div>
          )}

          {activeTab === 'services' && (
              <div className="animate-fade-in space-y-8">
                  {/* Laporan Warga */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex justify-between">
                          <span>Laporan Masuk ({reports.length})</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                          {reports.map(report => (
                              <div key={report.id} className="p-4 hover:bg-slate-50 flex justify-between items-start gap-4">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase bg-slate-100 text-slate-600`}>{report.type}</span>
                                          <span className="text-xs text-slate-400">{report.date}</span>
                                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${report.status === 'Baru' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{report.status}</span>
                                      </div>
                                      <p className="text-sm text-slate-700 font-medium">{report.description}</p>
                                      <p className="text-xs text-slate-500 mt-1">Pelapor: {report.reporterName}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      {report.status !== 'Selesai' && (
                                          <button onClick={() => handleUpdateReport(report.id, 'Selesai')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 text-xs font-bold">Selesai</button>
                                      )}
                                      <button onClick={() => handleDeleteReport(report.id)} className="p-2 text-rose-400 hover:text-rose-600"><Trash2 size={16}/></button>
                                  </div>
                              </div>
                          ))}
                          {reports.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">Belum ada laporan.</div>}
                      </div>
                  </div>

                  {/* Arsip Surat */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">
                          <span>Arsip Permohonan Surat ({letters.length})</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                          {letters.map(letter => (
                              <div key={letter.id} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                                  <div>
                                      <p className="font-bold text-slate-800 text-sm">{letter.type}</p>
                                      <p className="text-xs text-slate-500">{letter.applicantName} ({letter.houseId}) - {letter.date}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded">PDF Generated</span>
                                      <button onClick={() => handleDeleteLetter(letter.id)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                                  </div>
                              </div>
                          ))}
                          {letters.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">Belum ada surat keluar.</div>}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'announcements' && (
              <div className="animate-fade-in space-y-6">
                  <div className="flex justify-end">
                      <Button onClick={() => { resetForms(); setModalType('announcement'); setIsModalOpen(true); }}>
                          <Plus size={18}/> Buat Pengumuman Baru
                      </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                      {announcements.map(ann => (
                          <div key={ann.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
                              <div>
                                  <div className="flex items-center gap-2 mb-2">
                                     <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${ann.type === 'Urgent' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>{ann.type}</span>
                                     <span className="text-xs text-slate-400">{new Date(ann.date).toLocaleDateString()}</span>
                                  </div>
                                  <h3 className="font-bold text-lg text-slate-800">{ann.title}</h3>
                                  <p className="text-slate-600 text-sm mt-1 line-clamp-2">{ann.content}</p>
                              </div>
                              <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      ))}
                      {announcements.length === 0 && <div className="text-center text-slate-400 py-10">Belum ada pengumuman dibuat.</div>}
                  </div>
              </div>
          )}

          {activeTab === 'finance' && (
              <div className="animate-fade-in space-y-6">
                  <div className="flex justify-end">
                      <Button onClick={() => { resetForms(); setModalType('cash'); setIsModalOpen(true); }} variant="success">
                          <Plus size={18}/> Catat Transaksi
                      </Button>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                              <tr>
                                  <th className="p-4">Tanggal</th>
                                  <th className="p-4">Keterangan</th>
                                  <th className="p-4">Kategori</th>
                                  <th className="p-4 text-right">Jumlah</th>
                                  <th className="p-4 text-center">Aksi</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {cashFlow.map(cf => (
                                  <tr key={cf.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-4 text-slate-500">{cf.date}</td>
                                      <td className="p-4 font-medium text-slate-800">{cf.description}</td>
                                      <td className="p-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">{cf.category}</span></td>
                                      <td className={`p-4 text-right font-bold ${cf.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {cf.type === 'Income' ? '+' : '-'} Rp {cf.amount.toLocaleString()}
                                      </td>
                                      <td className="p-4 text-center">
                                          <button onClick={() => handleDeleteTransaction(cf.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                              <Trash2 size={16} />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeTab === 'officials' && (
              <div className="animate-fade-in space-y-6">
                  <div className="flex justify-end">
                      <Button onClick={() => { resetForms(); setModalType('official'); setIsModalOpen(true); }}>
                          <Plus size={18}/> Tambah Pengurus
                      </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {officials.map(off => (
                          <div key={off.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 relative group">
                              <img 
                                src={off.photo || `https://ui-avatars.com/api/?name=${off.name}&background=random`} 
                                className="w-16 h-16 rounded-full object-cover border-2 border-slate-100"
                              />
                              <div>
                                  <h3 className="font-bold text-slate-800">{off.name}</h3>
                                  <p className="text-brand-blue text-xs font-bold uppercase">{off.role}</p>
                                  <p className="text-slate-400 text-xs mt-1">{off.phone}</p>
                              </div>
                              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEditOfficial(off)} className="p-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100"><Edit2 size={14}/></button>
                                  <button onClick={() => handleDeleteOfficial(off.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><Trash2 size={14}/></button>
                              </div>
                          </div>
                      ))}
                  </div>
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
              offId ? 'Edit Data Pengurus' : 'Tambah Pengurus Baru'
          }
      >
          {modalType === 'announcement' && (
             <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                 {/* AI Draft Feature */}
                 <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4 rounded-xl border border-violet-100 mb-4">
                     <label className="text-xs font-bold text-violet-700 uppercase mb-2 flex items-center gap-2">
                        <Sparkles size={14} /> AI Magic Draft
                     </label>
                     <div className="flex gap-2">
                        <input 
                           type="text" 
                           placeholder="Topik: Kerja Bakti, Lomba 17an..." 
                           className="flex-1 px-3 py-2 bg-white border border-violet-200 rounded-lg text-sm"
                           value={draftTopic}
                           onChange={(e) => setDraftTopic(e.target.value)}
                        />
                        <button 
                           type="button" 
                           disabled={isGenerating}
                           onClick={handleGenerateDraft}
                           className="bg-violet-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-violet-700 disabled:opacity-50"
                        >
                           {isGenerating ? 'Drafting...' : 'Buat Draft'}
                        </button>
                     </div>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Judul</label>
                    <input required type="text" className="w-full p-2 border rounded-lg" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipe</label>
                    <select className="w-full p-2 border rounded-lg" value={annType} onChange={(e) => setAnnType(e.target.value as any)}>
                        <option value="General">General Info</option>
                        <option value="Urgent">Penting / Darurat</option>
                        <option value="Event">Kegiatan / Acara</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Isi Pengumuman</label>
                    <textarea required className="w-full p-2 border rounded-lg h-32" value={annContent} onChange={(e) => setAnnContent(e.target.value)} />
                 </div>
                 <Button type="submit" className="w-full">Terbitkan</Button>
             </form>
          )}

          {modalType === 'cash' && (
              <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Jenis Transaksi</label>
                      <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="type" checked={cashType === 'Income'} onChange={() => setCashType('Income')} /> 
                              <span className="text-emerald-600 font-bold">Pemasukan</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="type" checked={cashType === 'Expense'} onChange={() => setCashType('Expense')} /> 
                              <span className="text-rose-600 font-bold">Pengeluaran</span>
                          </label>
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Deskripsi</label>
                      <input required type="text" placeholder="Contoh: Iuran Bapak Budi" className="w-full p-2 border rounded-lg" value={cashDesc} onChange={(e) => setCashDesc(e.target.value)} />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Jumlah (Rp)</label>
                      <input required type="number" placeholder="50000" className="w-full p-2 border rounded-lg" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Kategori</label>
                      <select className="w-full p-2 border rounded-lg" value={cashCategory} onChange={(e) => setCashCategory(e.target.value)}>
                          <option>Iuran Warga</option>
                          <option>Sumbangan</option>
                          <option>Operasional</option>
                          <option>Pembangunan</option>
                          <option>Kegiatan</option>
                          <option>Lain-lain</option>
                      </select>
                  </div>
                  <Button type="submit" className="w-full" variant={cashType === 'Income' ? 'success' : 'danger'}>Simpan Transaksi</Button>
              </form>
          )}

          {modalType === 'official' && (
              <form onSubmit={handleSaveOfficial} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Nama Lengkap</label>
                          <input required type="text" className="w-full p-2 border rounded-lg" value={offName} onChange={(e) => setOffName(e.target.value)} />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Jabatan</label>
                          <input required type="text" placeholder="Ketua RT, Sekretaris..." className="w-full p-2 border rounded-lg" value={offRole} onChange={(e) => setOffRole(e.target.value)} />
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">No. HP / WA</label>
                          <input required type="text" className="w-full p-2 border rounded-lg" value={offPhone} onChange={(e) => setOffPhone(e.target.value)} />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Blok Rumah</label>
                          <input required type="text" placeholder="C5-01" className="w-full p-2 border rounded-lg" value={offHouse} onChange={(e) => setOffHouse(e.target.value)} />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Link Foto Profil (URL)</label>
                      <input type="text" placeholder="https://..." className="w-full p-2 border rounded-lg" value={offPhoto} onChange={(e) => setOffPhoto(e.target.value)} />
                      <p className="text-[10px] text-slate-400 mt-1">*Kosongkan untuk pakai avatar default</p>
                  </div>
                  <Button type="submit" className="w-full">{offId ? 'Update Data' : 'Tambah Pengurus'}</Button>
              </form>
          )}
      </Modal>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [ronda, setRonda] = useState<RondaSchedule[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Subscribe to Firestore Collections
  useEffect(() => {
    // Check if Firebase is configured (Demo Mode vs Real Mode)
    if (!isFirebaseConfigured) {
      // Load MOCK Data instantly for Demo
      setHouses(generateHouses().sort((a,b) => a.id.localeCompare(b.id, undefined, {numeric: true})));
      setAnnouncements(MOCK_ANNOUNCEMENTS);
      setCashFlow(MOCK_CASHFLOW);
      setOfficials(INITIAL_OFFICIALS);
      setRonda(MOCK_RONDA);
      setReports(INITIAL_REPORTS);
      setLetters(INITIAL_LETTERS);
      return; // Do not proceed to subscriptions
    }

    // 1. Subscribe Houses
    const unsubHouses = subscribeToCollection('houses', (data) => {
        setHouses(data.sort((a,b) => a.id.localeCompare(b.id, undefined, {numeric: true})));
    });

    // 2. Subscribe Announcements
    const unsubAnnouncements = subscribeToCollection('announcements', (data) => {
        setAnnouncements(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    // 3. Subscribe CashFlow
    const unsubCashFlow = subscribeToCollection('cashFlow', (data) => {
        setCashFlow(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    // 4. Subscribe Officials
    const unsubOfficials = subscribeToCollection('officials', (data) => {
        setOfficials(data);
    });

    // 5. Subscribe Ronda
    const unsubRonda = subscribeToCollection('ronda', (data) => {
        setRonda(data);
    });

    // 6. Subscribe Reports
    const unsubReports = subscribeToCollection('reports', (data) => {
        setReports(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    // 7. Subscribe Letters
    const unsubLetters = subscribeToCollection('letters', (data) => {
        setLetters(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    // Trigger Initial Seeding if Empty
    setTimeout(() => {
        seedDatabase({
            houses: generateHouses(),
            announcements: MOCK_ANNOUNCEMENTS,
            cashFlow: MOCK_CASHFLOW,
            officials: INITIAL_OFFICIALS,
            ronda: MOCK_RONDA
        });
    }, 2000);

    return () => {
        unsubHouses();
        unsubAnnouncements();
        unsubCashFlow();
        unsubOfficials();
        unsubRonda();
        unsubReports();
        unsubLetters();
    };
  }, []);

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-safe-area-pb">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <>
              <PublicHeader />
              <PublicHome houses={houses} announcements={announcements} ronda={ronda} />
              <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
              <PanicButton />
            </>
          } />
          
          <Route path="/services" element={
            <>
              <PublicHeader />
              <PublicServices />
              <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
            </>
          } />

          <Route path="/umkm" element={
            <>
              <PublicHeader />
              <PublicUMKM />
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
               />
            </AdminRouteWrapper>
          } />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
