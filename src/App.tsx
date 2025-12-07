
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
  Heart, Baby, Accessibility, Smile, GraduationCap, Key, Calculator, UserCheck, Info, Ban, Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { jsPDF } from "jspdf";

// Components & Services
import { Logo, generateHouses, MOCK_ANNOUNCEMENTS, MOCK_UMKM, MOCK_RONDA, MOCK_CASHFLOW, MOCK_GALLERY, INITIAL_OFFICIALS, DEFAULT_PDF_CONFIG, MOCK_INVENTORY, INITIAL_REPORTS, INITIAL_LETTERS } from '../constants';
import { House, Announcement, Report, LetterRequest, PaymentStatus, UMKM, CashFlow, Official, RondaSchedule, PdfConfig, InventoryItem } from '../types';
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
  batchUpdateHouses
} from './services/databaseService';

// --- Shared Components ---
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success', size?: 'sm' | 'md' | 'lg' }> = ({ children, variant = 'primary', size = 'md', className, ...props }) => {
  const base = "rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3.5 text-base"
  };

  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 border border-transparent",
    outline: "border-2 border-slate-200 bg-white text-slate-700 hover:border-slate-800 hover:text-slate-900",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200",
    success: "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200"
  };
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Card: React.FC<{ children: React.ReactNode, className?: string, title?: string, subtitle?: string, action?: React.ReactNode, icon?: React.ElementType }> = ({ children, className, title, subtitle, action, icon: Icon }) => (
  <div className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4 items-center">
            {Icon && <div className="p-3 rounded-2xl bg-slate-50 text-slate-600"><Icon size={24}/></div>}
            <div>
                {title && <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>}
                {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
            </div>
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; headerColor?: string }> = ({ isOpen, onClose, title, children, headerColor }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 animate-slide-up overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        <div className={`px-6 py-5 border-b border-slate-100 flex justify-between items-center ${headerColor || 'bg-white'}`}>
          <h3 className={`text-lg font-black tracking-tight ${headerColor ? 'text-slate-800' : 'text-slate-800'}`}>{title}</h3>
          <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/50">
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
  const navItems = [{ path: '/', icon: Home, label: 'Beranda' }, { path: '/services', icon: FileText, label: 'Layanan' }, { path: '/umkm', icon: Store, label: 'UMKM' }, { path: '/info', icon: Shield, label: 'Info RT' }];
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-50 pb-safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => { 
          const isActive = location.pathname === item.path; 
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-brand-blue' : 'text-slate-400 hover:text-slate-600'}`}>
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
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}><Logo /></div>
            <div className="hidden md:flex items-center space-x-1">
              <button onClick={() => navigate('/')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/')}`}>Beranda</button><button onClick={() => navigate('/services')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/services')}`}>Layanan</button><button onClick={() => navigate('/umkm')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/umkm')}`}>UMKM</button><button onClick={() => navigate('/info')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/info')}`}>Info RT</button><Button onClick={() => navigate('/admin')} variant="outline" className="ml-4 text-xs h-9">Login Admin</Button>
            </div>
            <div className="flex items-center md:hidden gap-2">
              <button onClick={() => navigate('/admin')} className="p-2 text-slate-400 hover:text-brand-blue"><User size={20}/></button>
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
  useEffect(() => { const timer = setInterval(() => setDate(new Date()), 60000); return () => clearInterval(timer); }, []);
  const timeString = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="relative bg-gradient-to-r from-cyan-600 to-blue-700 rounded-3xl overflow-hidden mb-6 md:mb-8 shadow-xl shadow-blue-200 group animate-fade-in">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558036117-15db5275d42b?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay group-hover:scale-105 transition-transform duration-[20s]"></div>
      <div className="relative px-6 py-8 md:px-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        <div className="text-center md:text-left text-white max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] md:text-xs font-bold mb-3 tracking-wide uppercase border border-white/30 text-blue-50 shadow-lg">Sistem Informasi Digital</span>
          <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight drop-shadow-sm">TERAS RT 002</h1>
          <div className="text-lg md:text-2xl font-bold text-cyan-200 mb-4 tracking-wide font-sans drop-shadow-md">Teknologi • Ekraf • Rukun • Aman • Sinergi</div>
          <p className="text-blue-50 text-sm md:text-lg font-light leading-relaxed max-w-lg hidden md:block border-l-2 border-cyan-400 pl-4">Platform terpadu untuk mewujudkan tetangga rukun, administrasi transparan, dan lingkungan harmonis melalui semangat gotong royong digital.</p>
        </div>
        <div className="w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 md:p-6 text-white w-full md:min-w-[240px] shadow-lg flex flex-row md:flex-col items-center md:items-stretch justify-between gap-4">
            <div className="flex-1 md:flex-none">
              <p className="text-3xl md:text-4xl font-black tracking-tighter">{timeString}</p>
              <p className="text-[10px] md:text-xs font-medium text-blue-100 uppercase tracking-widest">{dateString}</p>
            </div>
            <div className="w-px h-10 md:h-px md:w-full bg-white/20"></div>
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center text-right md:text-left"><Sun size={24} className="text-amber-300 animate-spin-slow mb-1 md:mb-0 md:mr-2" /><span className="text-xs font-medium">Cerah 28°C</span></div>
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
      <div className="w-full">
        <HouseMap houses={houses} isAdmin={false} reports={reports} officials={officials} onReportHouse={(house) => navigate(`/services?tab=lapor&houseId=${house.id}`)} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4 md:mb-6"><h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2"><div className="bg-brand-blue/10 p-2 rounded-lg"><Megaphone className="text-brand-blue" size={20} /></div> Info Terbaru</h2></div>
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
  const navigate = useNavigate();
  const initialTab = searchParams.get('tab') === 'lapor' ? 'lapor' : 'surat';
  const houseIdParam = searchParams.get('houseId');
  const [activeTab, setActiveTab] = useState<'surat' | 'lapor'>(initialTab);
  const [letterForm, setLetterForm] = useState<Partial<LetterRequest>>({ type: 'Pengantar KTP', applicantName: '', houseId: '', nik: '', familyHeadName: '', birthPlace: '', birthDate: '', religion: 'Islam', gender: 'Laki-laki', job: '', maritalStatus: 'Kawin', nationality: 'Indonesia', addressKtp: '', purposeDetail: '' });
  const [reportForm, setReportForm] = useState({ type: 'Fasilitas' as Report['type'], description: '', reporterName: '', houseId: houseIdParam || '' });
  const handleLetterSubmit = async (e: React.FormEvent) => { e.preventDefault(); if(!letterForm.applicantName) return; await addLetterToDb({ ...letterForm, date: new Date().toISOString().split('T')[0], status: 'Pending' } as LetterRequest); alert('Permohonan surat berhasil dikirim!'); navigate('/'); };
  const handleReportSubmit = async (e: React.FormEvent) => { e.preventDefault(); await addReportToDb({ ...reportForm, date: new Date().toISOString().split('T')[0], status: 'Baru' }); alert('Laporan berhasil dikirim!'); navigate('/'); };
  const draftSurat = () => { if(!letterForm.applicantName) { alert('Lengkapi nama pemohon'); return; } generateSuratPengantar(letterForm as LetterRequest, pdfConfig, true); };
  return (<div className="max-w-4xl mx-auto px-4 py-8 mb-20"><h1 className="text-3xl font-bold mb-6">Layanan Digital</h1><div className="flex gap-4 mb-6"><button onClick={() => setActiveTab('surat')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'surat' ? 'bg-brand-blue text-white shadow-lg shadow-blue-200' : 'bg-white border text-slate-600'}`}>Buat Surat</button><button onClick={() => setActiveTab('lapor')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'lapor' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-white border text-slate-600'}`}>Lapor Masalah</button></div><div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">{activeTab === 'surat' ? (<form onSubmit={handleLetterSubmit} className="space-y-4"><h3 className="font-bold text-lg border-b pb-2">Formulir Permohonan Surat</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-xs font-bold mb-1">Jenis Surat</label><select className="w-full p-2 border rounded" value={letterForm.type} onChange={e=>setLetterForm({...letterForm, type: e.target.value as any})}><option>Pengantar KTP</option><option>Pengantar KK</option><option>Domisili</option><option>Kematian</option><option>Kelahiran</option><option>Surat Keterangan Usaha (SKU)</option><option>Surat Izin Keramaian</option></select></div><div><label className="block text-xs font-bold mb-1">Nama Lengkap</label><input className="w-full p-2 border rounded" value={letterForm.applicantName} onChange={e=>setLetterForm({...letterForm, applicantName: e.target.value})} required/></div><div><label className="block text-xs font-bold mb-1">NIK</label><input className="w-full p-2 border rounded" value={letterForm.nik} onChange={e=>setLetterForm({...letterForm, nik: e.target.value})} required/></div><div><label className="block text-xs font-bold mb-1">Kepala Keluarga</label><input className="w-full p-2 border rounded" value={letterForm.familyHeadName} onChange={e=>setLetterForm({...letterForm, familyHeadName: e.target.value})}/></div><div><label className="block text-xs font-bold mb-1">Tempat Lahir</label><input className="w-full p-2 border rounded" value={letterForm.birthPlace} onChange={e=>setLetterForm({...letterForm, birthPlace: e.target.value})}/></div><div><label className="block text-xs font-bold mb-1">Tanggal Lahir</label><input type="date" className="w-full p-2 border rounded" value={letterForm.birthDate} onChange={e=>setLetterForm({...letterForm, birthDate: e.target.value})}/></div><div><label className="block text-xs font-bold mb-1">Agama</label><select className="w-full p-2 border rounded" value={letterForm.religion} onChange={e=>setLetterForm({...letterForm, religion: e.target.value})}><option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option></select></div><div><label className="block text-xs font-bold mb-1">Pekerjaan</label><input className="w-full p-2 border rounded" value={letterForm.job} onChange={e=>setLetterForm({...letterForm, job: e.target.value})}/></div><div><label className="block text-xs font-bold mb-1">Keperluan</label><textarea className="w-full p-2 border rounded" value={letterForm.purposeDetail} onChange={e=>setLetterForm({...letterForm, purposeDetail: e.target.value})}/></div></div><div className="flex gap-2 pt-4"><Button type="button" onClick={draftSurat} variant="outline" className="flex-1">Preview Draft PDF</Button><Button type="submit" className="flex-1">Kirim Permohonan</Button></div></form>) : (<form onSubmit={handleReportSubmit} className="space-y-4"><h3 className="font-bold text-lg border-b pb-2 text-rose-600">Formulir Laporan Warga</h3><div><label className="block text-xs font-bold mb-1">Jenis Laporan</label><select className="w-full p-2 border rounded" value={reportForm.type} onChange={e=>setReportForm({...reportForm, type: e.target.value as any})}><option>Keamanan</option><option>Kebersihan</option><option>Fasilitas</option><option>Lainnya</option></select></div><div><label className="block text-xs font-bold mb-1">Isi Laporan</label><textarea className="w-full p-2 border rounded h-32" value={reportForm.description} onChange={e=>setReportForm({...reportForm, description: e.target.value})} required placeholder="Jelaskan masalah secara detail..."/></div><div><label className="block text-xs font-bold mb-1">Lokasi (Blok/Rumah)</label><input className="w-full p-2 border rounded" value={reportForm.houseId} onChange={e=>setReportForm({...reportForm, houseId: e.target.value})} placeholder="Contoh: C5-10"/></div><div><label className="block text-xs font-bold mb-1">Nama Pelapor</label><input className="w-full p-2 border rounded" value={reportForm.reporterName} onChange={e=>setReportForm({...reportForm, reporterName: e.target.value})} required/><Button type="submit" variant="danger" className="w-full">Kirim Laporan</Button></div></form>)}</div></div>);
};

const PublicUMKM = ({ umkm }: { umkm: UMKM[] }) => (
    <div className="max-w-5xl mx-auto px-4 py-8 mb-20"><h1 className="text-3xl font-bold mb-6 text-slate-800">UMKM Warga RT 002</h1><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{umkm.map(u => (<div key={u.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all"><div className="h-48 bg-slate-200 relative"><img src={u.image} alt={u.name} className="w-full h-full object-cover" onError={(e)=>{(e.target as HTMLImageElement).src='https://via.placeholder.com/300x200?text=No+Image'}} /><span className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-lg text-xs font-bold shadow-sm">{u.category}</span></div><div className="p-4"><h3 className="font-bold text-lg text-slate-800">{u.name}</h3><p className="text-xs text-slate-500 mb-2">Pemilik: {u.owner}</p><p className="text-sm text-slate-600 line-clamp-2 mb-4">{u.description}</p><a href={`https://wa.me/${u.contact}`} target="_blank" rel="noreferrer" className="block w-full text-center bg-brand-blue text-white py-2 rounded-lg font-bold text-sm hover:bg-sky-600 transition-colors">Hubungi via WhatsApp</a></div></div>))}{umkm.length === 0 && <p className="text-slate-500 col-span-full text-center py-10">Belum ada data UMKM.</p>}</div></div>
);

const PublicInfo = ({ announcements, ronda, officials, cashFlow }: { announcements: Announcement[], ronda: RondaSchedule[], officials: Official[], cashFlow: CashFlow[] }) => (
    <div className="max-w-5xl mx-auto px-4 py-8 mb-20 space-y-8">
        <div><h2 className="text-2xl font-bold mb-4 text-slate-800">Struktur Pengurus</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{officials.map(o => (<div key={o.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm"><div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">{o.photo ? <img src={o.photo} className="w-full h-full object-cover"/> : <User size={24}/>}</div><div><p className="text-xs text-brand-blue font-bold uppercase">{o.role}</p><h4 className="font-bold text-slate-800">{o.name}</h4><p className="text-xs text-slate-500">{o.phone}</p></div></div>))}</div></div>
        <div><h2 className="text-2xl font-bold mb-4 text-slate-800">Jadwal Ronda</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{ronda.map(r => (<div key={r.day} className="bg-white p-4 rounded-xl border border-slate-100"><h4 className="font-bold text-brand-blue mb-2">{r.day}</h4><ul className="text-sm text-slate-600 space-y-1">{r.members.map((m, i) => <li key={i}>• {m}</li>)}</ul></div>))}</div></div>
        <div><h2 className="text-2xl font-bold mb-4 text-slate-800">Laporan Kas</h2><div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><div className="grid grid-cols-2 gap-4 mb-4"><div className="bg-emerald-50 p-4 rounded-xl"><p className="text-xs font-bold text-emerald-600 uppercase">Pemasukan</p><h3 className="text-xl font-black text-slate-800">Rp {cashFlow.filter(c=>c.type==='Income').reduce((a,b)=>a+b.amount,0).toLocaleString()}</h3></div><div className="bg-rose-50 p-4 rounded-xl"><p className="text-xs font-bold text-rose-600 uppercase">Pengeluaran</p><h3 className="text-xl font-black text-slate-800">Rp {cashFlow.filter(c=>c.type==='Expense').reduce((a,b)=>a+b.amount,0).toLocaleString()}</h3></div></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs"><tr><th className="p-3">Tanggal</th><th className="p-3">Keterangan</th><th className="p-3 text-right">Nominal</th></tr></thead><tbody>{cashFlow.slice(0, 5).map(c => (<tr key={c.id} className="border-b last:border-0"><td className="p-3">{c.date}</td><td className="p-3">{c.description}</td><td className={`p-3 text-right font-bold ${c.type==='Income'?'text-emerald-600':'text-rose-600'}`}>{c.type==='Income'?'+':'-'} {c.amount.toLocaleString()}</td></tr>))}</tbody></table></div></div></div>
        <div><h2 className="text-2xl font-bold mb-4 text-slate-800">Galeri Kegiatan</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{MOCK_GALLERY.map(item => (<div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group"><img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4"><span className="text-white text-sm font-bold">{item.title}</span></div></div>))}</div></div>
    </div>
);

// --- ADMIN DASHBOARD RE-IMPLEMENTATION ---

const AdminDashboard = ({ 
  houses, announcements, cashFlow, officials, reports, letters, ronda, inventory, umkm, pdfConfig, setPdfConfig
}: any) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'announcement' | 'cash' | 'official' | 'editHouse' | 'inventory' | 'ronda' | 'umkm' | 'dues' | 'import'>('announcement');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // State Management
  const [residentView, setResidentView] = useState<'grid' | 'table'>('table');
  const [searchResident, setSearchResident] = useState('');
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [serviceTab, setServiceTab] = useState<'surat' | 'laporan'>('surat');
  
  // Forms
  const [annTitle, setAnnTitle] = useState(''); const [annContent, setAnnContent] = useState(''); const [annType, setAnnType] = useState<Announcement['type']>('General');
  const [cashDesc, setCashDesc] = useState(''); const [cashAmount, setCashAmount] = useState(''); const [cashType, setCashType] = useState<'Income' | 'Expense'>('Income'); const [cashCategory, setCashCategory] = useState('Iuran');
  const [offName, setOffName] = useState(''); const [offRole, setOffRole] = useState(''); const [offPhone, setOffPhone] = useState(''); const [offHouse, setOffHouse] = useState(''); const [offPhoto, setOffPhoto] = useState(''); const [offId, setOffId] = useState<string|null>(null);
  const [invName, setInvName] = useState(''); const [invTotal, setInvTotal] = useState(''); const [invAvailable, setInvAvailable] = useState(''); const [invCondition, setInvCondition] = useState<'Baik'|'Perlu Perbaikan'|'Rusak'>('Baik'); const [invNotes, setInvNotes] = useState(''); const [invId, setInvId] = useState<string|null>(null);
  const [umkmName, setUmkmName] = useState(''); const [umkmOwner, setUmkmOwner] = useState(''); const [umkmCategory, setUmkmCategory] = useState(''); const [umkmDesc, setUmkmDesc] = useState(''); const [umkmContact, setUmkmContact] = useState(''); const [umkmImage, setUmkmImage] = useState(''); const [umkmId, setUmkmId] = useState<string|null>(null);
  const [rondaDay, setRondaDay] = useState(''); const [rondaMembers, setRondaMembers] = useState(''); const [selectedRondaId, setSelectedRondaId] = useState<string|null>(null);
  const [duesHouseId, setDuesHouseId] = useState(''); const [duesAmount, setDuesAmount] = useState('25000'); const [duesStatus, setDuesStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  const [editHouseForm, setEditHouseForm] = useState<any>({});
  
  // Helpers
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftTopic, setDraftTopic] = useState('');
  const [localConfig, setLocalConfig] = useState<PdfConfig>(pdfConfig);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  // Handlers
  const resetForms = () => {
      setAnnTitle(''); setAnnContent(''); setDraftTopic(''); setCashDesc(''); setCashAmount(''); setCashType('Income'); 
      setOffName(''); setOffRole(''); setOffPhone(''); setOffHouse(''); setOffPhoto(''); setOffId(null);
      setInvName(''); setInvTotal(''); setInvAvailable(''); setInvNotes(''); setInvId(null);
      setUmkmName(''); setUmkmOwner(''); setUmkmCategory(''); setUmkmDesc(''); setUmkmContact(''); setUmkmImage(''); setUmkmId(null);
      setRondaMembers(''); setSelectedRondaId(null);
      setDuesHouseId(''); setDuesAmount('25000'); setDuesStatus(PaymentStatus.PAID);
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => { e.preventDefault(); await addAnnouncementToDb({ title: annTitle, content: annContent, type: annType, date: new Date().toISOString() }); setIsModalOpen(false); resetForms(); };
  const handleDeleteAnnouncement = async (id: string) => { if (confirm("Hapus pengumuman ini?")) await deleteAnnouncementFromDb(id); };
  const handleGenerateDraft = async () => { if(!draftTopic) return; setIsGenerating(true); const draft = await generateAnnouncementDraft(draftTopic); setAnnContent(draft); setAnnTitle(draftTopic); setIsGenerating(false); };
  
  const handleAddTransaction = async (e: React.FormEvent) => { e.preventDefault(); await addTransactionToDb({ description: cashDesc, amount: parseInt(cashAmount), type: cashType, category: cashCategory, date: new Date().toISOString().split('T')[0] }); setIsModalOpen(false); resetForms(); };
  const handleDeleteTransaction = async (id: string) => { if (confirm("Hapus transaksi ini?")) await deleteTransactionFromDb(id); };
  
  const handleSaveOfficial = async (e: React.FormEvent) => { e.preventDefault(); const data = { name: offName, role: offRole, phone: offPhone, houseId: offHouse, photo: offPhoto || undefined }; if (offId) await updateOfficialInDb(offId, data); else await addOfficialToDb(data); setIsModalOpen(false); resetForms(); };
  const handleDeleteOfficial = async (id: string) => { if (confirm("Hapus?")) await deleteOfficialFromDb(id); };
  const openEditOfficial = (o: Official) => { setOffId(o.id); setOffName(o.name); setOffRole(o.role); setOffPhone(o.phone); setOffHouse(o.houseId); setOffPhoto(o.photo||''); setModalType('official'); setIsModalOpen(true); };

  const handleSaveInventory = async (e: React.FormEvent) => { e.preventDefault(); const data = { name: invName, total: parseInt(invTotal), available: parseInt(invAvailable), condition: invCondition, notes: invNotes }; if (invId) await updateInventoryInDb(invId, data); else await addInventoryToDb(data); setIsModalOpen(false); resetForms(); };
  const handleDeleteInventory = async (id: string) => { if(confirm("Hapus?")) await deleteInventoryFromDb(id); };
  const openEditInventory = (i: InventoryItem) => { setInvId(i.id); setInvName(i.name); setInvTotal(i.total.toString()); setInvAvailable(i.available.toString()); setInvCondition(i.condition as any); setInvNotes(i.notes||''); setModalType('inventory'); setIsModalOpen(true); };

  const handleSaveUMKM = async (e: React.FormEvent) => { e.preventDefault(); const data = { name: umkmName, owner: umkmOwner, category: umkmCategory, description: umkmDesc, contact: umkmContact, image: umkmImage }; if (umkmId) await updateUMKMInDb(umkmId, data); else await addUMKMToDb(data); setIsModalOpen(false); resetForms(); };
  const handleDeleteUMKM = async (id: string) => { if (confirm("Hapus?")) await deleteUMKMFromDb(id); };
  const openEditUMKM = (u: UMKM) => { setUmkmId(u.id); setUmkmName(u.name); setUmkmOwner(u.owner); setUmkmCategory(u.category); setUmkmDesc(u.description); setUmkmContact(u.contact); setUmkmImage(u.image); setModalType('umkm'); setIsModalOpen(true); };

  const handleSaveRonda = async (e: React.FormEvent) => { e.preventDefault(); if (!selectedRondaId) return; const members = rondaMembers.split(',').map(m => m.trim()).filter(Boolean); await updateRondaSchedule(selectedRondaId, members); setIsModalOpen(false); resetForms(); };
  const openEditRonda = (r: RondaSchedule) => { if(!r.id) return; setSelectedRondaId(r.id); setRondaDay(r.day); setRondaMembers(r.members.join(', ')); setModalType('ronda'); setIsModalOpen(true); };

  const openEditHouse = (h: House) => { 
      setSelectedHouse(h);
      let unified = 'Tetap';
      if(h.status === 'Empty') unified = 'Empty'; else if(h.status === 'Business') unified = 'Business'; else if(h.residenceType === 'Kost') unified = 'Kost'; else if(h.residenceType === 'Kontrak') unified = 'Kontrak';
      
      const isEmpty = h.status === 'Empty';
      setEditHouseForm({
          headOfFamily: isEmpty || h.headOfFamily === '-' ? '' : h.headOfFamily,
          occupants: isEmpty ? 1 : h.occupants || 1, // Fix: default 1 if empty
          phone: isEmpty || h.phone === '-' ? '' : h.phone,
          paymentStatus: h.paymentStatus,
          unifiedStatus: unified,
          pregnantCount: h.pregnantCount || (h.hasPregnant?1:0),
          babyCount: h.babyCount || (h.hasBaby?1:0),
          toddlerCount: h.toddlerCount || (h.hasToddler?1:0),
          teenagerCount: h.teenagerCount || (h.hasTeenager?1:0),
          elderlyCount: h.elderlyCount || (h.hasElderly?1:0)
      });
      setModalType('editHouse'); setIsModalOpen(true); 
  };
  const handleSaveHouse = async (e: React.FormEvent) => {
      e.preventDefault(); if(!selectedHouse) return;
      let status = 'Occupied', residenceType = 'Tetap';
      if(editHouseForm.unifiedStatus === 'Empty') status = 'Empty'; else if(editHouseForm.unifiedStatus === 'Business') status = 'Business'; else residenceType = editHouseForm.unifiedStatus;
      
      const payload = {
          headOfFamily: status === 'Empty' ? '-' : editHouseForm.headOfFamily,
          occupants: status === 'Empty' ? 0 : parseInt(editHouseForm.occupants),
          phone: status === 'Empty' ? '' : editHouseForm.phone,
          status, residenceType, paymentStatus: editHouseForm.paymentStatus,
          pregnantCount: editHouseForm.pregnantCount, babyCount: editHouseForm.babyCount, toddlerCount: editHouseForm.toddlerCount, teenagerCount: editHouseForm.teenagerCount, elderlyCount: editHouseForm.elderlyCount,
          hasPregnant: editHouseForm.pregnantCount>0, hasBaby: editHouseForm.babyCount>0, hasToddler: editHouseForm.toddlerCount>0, hasTeenager: editHouseForm.teenagerCount>0, hasElderly: editHouseForm.elderlyCount>0
      };
      await updateHouseData(selectedHouse.id, payload); setIsModalOpen(false);
  };
  
  const openDuesModal = (h: House) => { setDuesHouseId(h.id); setDuesStatus(PaymentStatus.PAID); setModalType('dues'); setIsModalOpen(true); };
  const handleSaveDues = async (e: React.FormEvent) => {
      e.preventDefault(); if (!duesHouseId) return;
      await updateHouseData(duesHouseId, { paymentStatus: duesStatus });
      if(duesStatus === PaymentStatus.PAID) {
          const house = houses.find((h:House) => h.id === duesHouseId);
          await addTransactionToDb({ description: `Iuran Warga ${duesHouseId}`, amount: parseInt(duesAmount), type: 'Income', category: 'Iuran Warga', date: new Date().toISOString().split('T')[0] });
      }
      setIsModalOpen(false); resetForms();
  };

  const navGroups = [{ title: "Menu Utama", items: [{ id: 'overview', icon: LayoutDashboard, label: 'Dashboard' }] }, { title: "Administrasi", items: [{ id: 'residents', icon: Users, label: 'Data Warga' }, { id: 'services', icon: Archive, label: 'Layanan Surat & Laporan' }, { id: 'finance', icon: DollarSign, label: 'Keuangan & Kas' }] }, { title: "Lingkungan", items: [{ id: 'facilities', icon: Package, label: 'Fasilitas & Jadwal' }, { id: 'umkm', icon: ShoppingBag, label: 'UMKM Warga' }, { id: 'announcements', icon: Megaphone, label: 'Pengumuman' }, { id: 'officials', icon: Briefcase, label: 'Pengurus' }] }, { title: "Sistem", items: [{ id: 'settings', icon: Settings, label: 'Pengaturan' }] }];

  const renderNav = () => (
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          {navGroups.map((group, idx) => (
              <div key={idx}>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-3">{group.title}</h3>
                  <div className="space-y-1">
                      {group.items.map(item => (
                          <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 font-bold group relative overflow-hidden ${activeTab === item.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-300' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>
                              <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} /> <span className="text-sm">{item.label}</span>
                          </button>
                      ))}
                  </div>
              </div>
          ))}
      </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar Desktop */}
      <div className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 fixed h-full z-30">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3"><div className="bg-slate-900 text-white p-2 rounded-xl"><Shield size={24}/></div><div><h1 className="font-black text-xl text-slate-900 tracking-tight">TERAS Admin</h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dashboard v2.0</p></div></div>
          {renderNav()}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50"><div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm"><div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">A</div><div><p className="text-xs font-bold text-slate-800">Admin Utama</p><p className="text-[10px] text-slate-400">Ketua RT 002</p></div></div><button onClick={() => navigate('/')} className="w-full mt-3 flex items-center justify-center gap-2 p-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><LogOut size={14}/> Keluar Aplikasi</button></div>
      </div>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (<div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={()=>setIsMobileMenuOpen(false)}><div className="w-3/4 h-full bg-white shadow-2xl animate-slide-in-right flex flex-col" onClick={e=>e.stopPropagation()}>{renderNav()}</div></div>)}

      {/* Main Content */}
      <div className="flex-1 md:ml-72 p-4 md:p-8 pb-24 overflow-x-hidden">
          {/* Header Mobile */}
          <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100"><div className="flex items-center gap-2"><div className="bg-slate-900 text-white p-1.5 rounded-lg"><Shield size={18}/></div><span className="font-bold text-slate-800">TERAS Admin</span></div><button onClick={()=>setIsMobileMenuOpen(true)}><Menu size={24} className="text-slate-600"/></button></div>

          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
              <header className="flex justify-between items-end mb-8">
                  <div><h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">{activeTab === 'overview' ? 'Dashboard Overview' : activeTab.replace(/([A-Z])/g, ' $1').trim()}</h1><p className="text-slate-500 mt-1 font-medium">Selamat datang kembali, Pak RT.</p></div>
                  <div className="hidden md:flex gap-3"><Button variant="outline" size="sm" onClick={()=>window.location.reload()}><RefreshCw size={14}/> Refresh</Button><div className="bg-white px-3 py-1.5 rounded-lg border text-xs font-bold text-slate-500 flex items-center gap-2 shadow-sm"><Clock size={14}/> {new Date().toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long'})}</div></div>
              </header>

              {activeTab === 'overview' && (
                  <div className="space-y-8">
                      {/* Stats Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-none shadow-indigo-200">
                             <div className="flex justify-between items-start mb-4"><div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><Users size={24} className="text-white"/></div><span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">Total</span></div>
                             <h3 className="text-4xl font-black mb-1">{houses.reduce((acc:any, h:any)=>acc+(h.occupants||0),0)}</h3><p className="text-indigo-100 text-sm font-medium">Warga Terdaftar</p>
                          </Card>
                          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-none shadow-emerald-200">
                             <div className="flex justify-between items-start mb-4"><div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><Wallet size={24} className="text-white"/></div><span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">Kas</span></div>
                             <h3 className="text-4xl font-black mb-1">Rp {cashFlow.reduce((acc:any,c:any)=>c.type==='Income'?acc+c.amount:acc-c.amount,0).toLocaleString()}</h3><p className="text-emerald-100 text-sm font-medium">Saldo Tersedia</p>
                          </Card>
                          <Card className="bg-white border-slate-200">
                             <div className="flex justify-between items-start mb-4"><div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><AlertTriangle size={24}/></div><span className="bg-rose-50 text-rose-600 px-2 py-1 rounded text-[10px] font-bold">Active</span></div>
                             <h3 className="text-4xl font-black mb-1 text-slate-800">{reports.filter((r:any)=>r.status==='Baru').length}</h3><p className="text-slate-400 text-sm font-medium">Laporan Menunggu</p>
                          </Card>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                              { label: 'Tambah Warga', icon: User, color: 'text-blue-600', bg: 'bg-blue-50', action: () => { resetForms(); setModalType('editHouse'); setIsModalOpen(true); } }, // Just opens generic add, logic handled in component
                              { label: 'Catat Kas', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', action: () => { resetForms(); setModalType('cash'); setIsModalOpen(true); } },
                              { label: 'Buat Info', icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-50', action: () => { resetForms(); setModalType('announcement'); setIsModalOpen(true); } },
                              { label: 'Cek Laporan', icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50', action: () => setActiveTab('services') }
                          ].map((item, i) => (
                              <button key={i} onClick={item.action} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 group">
                                  <div className={`p-3 rounded-full ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}><item.icon size={20}/></div>
                                  <span className="text-xs font-bold text-slate-700">{item.label}</span>
                              </button>
                          ))}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <Card title="Pengumuman Terbaru" icon={Megaphone} action={<Button size="sm" variant="ghost" onClick={()=>setActiveTab('announcements')}>Lihat Semua</Button>}>
                             <div className="space-y-4">{announcements.slice(0,3).map((a:any)=>(<div key={a.id} className="flex gap-4 items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0"><div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${a.type==='Urgent'?'bg-rose-500':a.type==='Event'?'bg-purple-500':'bg-blue-500'}`}></div><div><h4 className="font-bold text-sm text-slate-800">{a.title}</h4><p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.content}</p><p className="text-[10px] text-slate-400 mt-2">{new Date(a.date).toLocaleDateString()}</p></div></div>))}</div>
                          </Card>
                          <Card title="Transaksi Terakhir" icon={DollarSign} action={<Button size="sm" variant="ghost" onClick={()=>setActiveTab('finance')}>Lihat Semua</Button>}>
                             <div className="space-y-3">{cashFlow.slice(0,4).map((c:any)=>(<div key={c.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${c.type==='Income'?'bg-emerald-100 text-emerald-600':'bg-rose-100 text-rose-600'}`}>{c.type==='Income'?<ArrowUpRight size={16}/>:<ArrowDownRight size={16}/>}</div><div><p className="text-xs font-bold text-slate-800">{c.description}</p><p className="text-[10px] text-slate-500">{c.date}</p></div></div><span className={`text-xs font-bold ${c.type==='Income'?'text-emerald-600':'text-rose-600'}`}>{c.type==='Income'?'+':'-'} Rp {c.amount.toLocaleString()}</span></div>))}</div>
                          </Card>
                      </div>
                  </div>
              )}

              {activeTab === 'residents' && (
                  <div className="space-y-6">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                          <div className="relative w-full md:w-96"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Cari nama, blok, nomor..." className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-medium outline-none text-slate-800 placeholder:text-slate-400" value={searchResident} onChange={(e) => setSearchResident(e.target.value)} /></div>
                          <div className="flex gap-2 p-2">
                              <Button size="sm" variant="primary" onClick={()=>console.log('Export CSV')}><Download size={16}/> CSV</Button>
                              <div className="flex bg-slate-100 p-1 rounded-xl"><button onClick={() => setResidentView('grid')} className={`p-2 rounded-lg transition-all ${residentView === 'grid' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}><Grid size={18} /></button><button onClick={() => setResidentView('table')} className={`p-2 rounded-lg transition-all ${residentView === 'table' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}><List size={18} /></button></div>
                          </div>
                      </div>

                      {residentView === 'grid' ? (
                          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><HouseMap houses={houses} isAdmin={true} onEditHouse={openEditHouse} onPayDues={openDuesModal} reports={reports} officials={officials} /></div>
                      ) : (
                          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                              <table className="w-full text-sm text-left whitespace-nowrap">
                                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider"><tr><th className="p-4 pl-6">Blok/No</th><th className="p-4">Kepala Keluarga</th><th className="p-4">Status</th><th className="p-4">Tagihan</th><th className="p-4 text-center">Aksi</th></tr></thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {houses.filter((h:any) => h.headOfFamily.toLowerCase().includes(searchResident.toLowerCase()) || h.block.includes(searchResident.toUpperCase())).map((h:any) => (
                                          <tr key={h.id} className="hover:bg-slate-50 transition-colors group">
                                              <td className="p-4 pl-6 font-black text-slate-800">{h.block}-{h.number}</td>
                                              <td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">{h.headOfFamily ? h.headOfFamily.charAt(0) : '-'}</div><span className="font-bold text-slate-700">{h.headOfFamily || 'Belum Ada Data'}</span></div></td>
                                              <td className="p-4"><span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${h.status==='Occupied'?'bg-emerald-50 text-emerald-600 border-emerald-100':h.status==='Business'?'bg-purple-50 text-purple-600 border-purple-100':'bg-slate-100 text-slate-500 border-slate-200'}`}>{h.status==='Occupied'?`Dihuni (${h.residenceType})`:h.status==='Business'?'Usaha':'Kosong'}</span></td>
                                              <td className="p-4"><span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${h.paymentStatus==='Lunas'?'bg-blue-50 text-blue-600':h.paymentStatus==='Menunggak'?'bg-rose-50 text-rose-600':'bg-amber-50 text-amber-600'}`}>{h.paymentStatus}</span></td>
                                              <td className="p-4 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button onClick={() => openEditHouse(h)} className="p-2 bg-white border border-slate-200 rounded-lg hover:border-slate-800 text-slate-500 hover:text-slate-900 shadow-sm"><Edit2 size={14}/></button>
                                                  <button onClick={() => openDuesModal(h)} className="p-2 bg-white border border-slate-200 rounded-lg hover:border-emerald-600 text-slate-500 hover:text-emerald-600 shadow-sm"><DollarSign size={14}/></button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      )}
                  </div>
              )}

              {activeTab === 'finance' && (
                  <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="bg-emerald-600 text-white border-none shadow-xl shadow-emerald-200">
                             <h3 className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2">Total Pemasukan</h3>
                             <p className="text-3xl font-black">Rp {cashFlow.filter((c:any)=>c.type==='Income').reduce((a:any,b:any)=>a+b.amount,0).toLocaleString()}</p>
                          </Card>
                          <Card className="bg-rose-600 text-white border-none shadow-xl shadow-rose-200">
                             <h3 className="text-rose-100 text-xs font-bold uppercase tracking-wider mb-2">Total Pengeluaran</h3>
                             <p className="text-3xl font-black">Rp {cashFlow.filter((c:any)=>c.type==='Expense').reduce((a:any,b:any)=>a+b.amount,0).toLocaleString()}</p>
                          </Card>
                      </div>
                      <Card title="Riwayat Transaksi" icon={DollarSign} action={<Button size="sm" onClick={() => { resetForms(); setModalType('cash'); setIsModalOpen(true); }}><Plus size={16}/> Catat Transaksi</Button>}>
                          <div className="overflow-hidden rounded-xl border border-slate-100">
                              <table className="w-full text-sm text-left">
                                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]"><tr><th className="p-4">Tanggal</th><th className="p-4">Ket/Kategori</th><th className="p-4 text-right">Nominal</th><th className="p-4 text-center">Aksi</th></tr></thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {cashFlow.map((c:any) => (
                                          <tr key={c.id} className="hover:bg-slate-50">
                                              <td className="p-4 text-slate-500 font-medium">{c.date}</td>
                                              <td className="p-4">
                                                  <p className="font-bold text-slate-800">{c.description}</p>
                                                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">{c.category}</span>
                                              </td>
                                              <td className={`p-4 text-right font-black ${c.type==='Income'?'text-emerald-600':'text-rose-600'}`}>{c.type==='Income'?'+':'-'} {c.amount.toLocaleString()}</td>
                                              <td className="p-4 text-center"><button onClick={() => handleDeleteTransaction(c.id)} className="text-slate-300 hover:text-rose-600"><Trash2 size={16}/></button></td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </Card>
                  </div>
              )}

              {activeTab === 'services' && (
                  <div className="space-y-6">
                      <div className="flex gap-4 border-b border-slate-200">
                          <button onClick={() => setServiceTab('surat')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all ${serviceTab==='surat'?'border-slate-800 text-slate-800':'border-transparent text-slate-400 hover:text-slate-600'}`}>Permohonan Surat</button>
                          <button onClick={() => setServiceTab('laporan')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all ${serviceTab==='laporan'?'border-rose-600 text-rose-600':'border-transparent text-slate-400 hover:text-slate-600'}`}>Laporan Warga</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {serviceTab === 'surat' ? letters.map((l:any) => (
                              <div key={l.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
                                  <div>
                                      <div className="flex justify-between items-start mb-3"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">{l.type}</span><span className={`text-[10px] font-bold ${l.status==='Approved'?'text-emerald-600':l.status==='Rejected'?'text-rose-600':'text-amber-600'}`}>{l.status}</span></div>
                                      <h4 className="font-bold text-slate-800">{l.applicantName}</h4>
                                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{l.purposeDetail || 'Keperluan pengurusan administrasi.'}</p>
                                  </div>
                                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                      <span className="text-[10px] text-slate-400">{l.date}</span>
                                      <div className="flex gap-2">
                                          {l.status === 'Pending' ? <><button onClick={()=>updateLetterStatus(l.id,'Approved')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"><Check size={14}/></button><button onClick={()=>updateLetterStatus(l.id,'Rejected')} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-colors"><X size={14}/></button></> : l.status==='Approved' && <button onClick={()=>generateSuratPengantar(l, pdfConfig, false)} className="p-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex gap-1"><Printer size={14}/> PDF</button>}
                                          <button onClick={()=>deleteLetterFromDb(l.id)} className="p-2 text-slate-300 hover:text-rose-600"><Trash2 size={14}/></button>
                                      </div>
                                  </div>
                              </div>
                          )) : reports.map((r:any) => (
                              <div key={r.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                  <div className="flex items-center gap-2 mb-3"><div className={`p-2 rounded-lg ${r.type==='Keamanan'?'bg-rose-50 text-rose-600':r.type==='Kebersihan'?'bg-emerald-50 text-emerald-600':'bg-blue-50 text-blue-600'}`}><AlertTriangle size={16}/></div><span className="font-bold text-sm text-slate-800">{r.type}</span></div>
                                  <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl italic">"{r.description}"</p>
                                  <div className="flex justify-between items-center">
                                      <div><p className="text-xs font-bold text-slate-700">{r.reporterName}</p><p className="text-[10px] text-slate-400">{r.date}</p></div>
                                      <select className="text-xs font-bold bg-white border rounded-lg p-1 outline-none" value={r.status} onChange={(e)=>updateReportStatus(r.id, e.target.value)}><option>Baru</option><option>Diproses</option><option>Selesai</option></select>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {activeTab === 'umkm' && (
                  <Card title="UMKM & Usaha Warga" icon={Store} action={<Button size="sm" onClick={() => { resetForms(); setModalType('umkm'); setIsModalOpen(true); }}><Plus size={16}/> Tambah</Button>}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {umkm.map((u:any) => (
                              <div key={u.id} className="group relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                                  <div className="h-40 bg-slate-100 relative">
                                      <img src={u.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e)=>{(e.target as HTMLImageElement).src='https://via.placeholder.com/300x200?text=No+Image'}}/>
                                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => openEditUMKM(u)} className="p-2 bg-white/90 backdrop-blur rounded-xl text-slate-700 hover:text-blue-600 shadow-sm"><Edit2 size={14}/></button>
                                          <button onClick={() => handleDeleteUMKM(u.id)} className="p-2 bg-white/90 backdrop-blur rounded-xl text-slate-700 hover:text-rose-600 shadow-sm"><Trash2 size={14}/></button>
                                      </div>
                                  </div>
                                  <div className="p-5">
                                      <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-slate-800">{u.name}</h4><span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold">{u.category}</span></div>
                                      <p className="text-xs text-slate-500 mb-4">{u.description}</p>
                                      <div className="flex items-center gap-2 pt-4 border-t border-slate-50"><div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-bold">{u.owner.charAt(0)}</div><span className="text-xs font-bold text-slate-600">{u.owner}</span><a href={`https://wa.me/${u.contact}`} target="_blank" className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">WA</a></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </Card>
              )}

              {activeTab === 'officials' && (
                  <Card title="Struktur Pengurus RT" icon={Briefcase} action={<Button size="sm" onClick={() => { resetForms(); setModalType('official'); setIsModalOpen(true); }}><Plus size={16}/> Tambah</Button>}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {officials.map((o:any) => (
                              <div key={o.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-slate-300 transition-all relative group">
                                  <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden">{o.photo ? <img src={o.photo} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={20}/></div>}</div>
                                  <div><p className="text-[10px] font-bold text-brand-blue uppercase">{o.role}</p><h4 className="font-bold text-slate-800">{o.name}</h4></div>
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => openEditOfficial(o)} className="p-2 bg-slate-100 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors"><Edit2 size={14}/></button>
                                      <button onClick={() => handleDeleteOfficial(o.id)} className="p-2 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors"><Trash2 size={14}/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </Card>
              )}
              
              {activeTab === 'facilities' && (
                   <div className="space-y-6">
                       <Card title="Inventaris & Aset" icon={Package} action={<Button size="sm" onClick={() => { resetForms(); setModalType('inventory'); setIsModalOpen(true); }}><Plus size={16}/> Tambah</Button>}>
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                               {inventory.map((i:any) => (
                                   <div key={i.id} className="bg-white p-5 rounded-2xl border border-slate-100 relative group hover:shadow-md transition-all">
                                       <div className="flex justify-between items-start mb-3">
                                           <div className={`p-2 rounded-xl ${i.condition==='Baik'?'bg-emerald-50 text-emerald-600':i.condition==='Rusak'?'bg-rose-50 text-rose-600':'bg-amber-50 text-amber-600'}`}><Package size={20}/></div>
                                           <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${i.condition==='Baik'?'bg-emerald-50 text-emerald-600':i.condition==='Rusak'?'bg-rose-50 text-rose-600':'bg-amber-50 text-amber-600'}`}>{i.condition}</span>
                                       </div>
                                       <h4 className="font-bold text-slate-800">{i.name}</h4>
                                       <div className="flex justify-between items-end mt-4">
                                           <div><p className="text-xs text-slate-400">Stok / Total</p><p className="font-mono font-bold text-slate-700">{i.available} / {i.total}</p></div>
                                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                               <button onClick={() => openEditInventory(i)} className="p-1.5 bg-slate-100 rounded hover:text-blue-600"><Edit2 size={14}/></button>
                                               <button onClick={() => handleDeleteInventory(i.id)} className="p-1.5 bg-slate-100 rounded hover:text-rose-600"><Trash2 size={14}/></button>
                                           </div>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </Card>
                       <Card title="Jadwal Ronda Mingguan" icon={Moon}>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                               {ronda.map((r:any) => (
                                   <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-100 relative group">
                                       <button onClick={() => openEditRonda(r)} className="absolute top-2 right-2 p-1.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={12}/></button>
                                       <h4 className="font-black text-slate-800 mb-2">{r.day}</h4>
                                       <ul className="space-y-1">{r.members.map((m:string,i:number)=><li key={i} className="text-xs font-bold text-slate-500 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>{m}</li>)}</ul>
                                   </div>
                               ))}
                           </div>
                       </Card>
                   </div>
              )}

              {activeTab === 'announcements' && (
                  <Card title="Daftar Pengumuman" icon={Megaphone} action={<Button size="sm" onClick={() => { resetForms(); setModalType('announcement'); setIsModalOpen(true); }}><Plus size={16}/> Buat Baru</Button>}>
                      <div className="space-y-4">
                          {announcements.map((a:any) => (
                              <div key={a.id} className="flex gap-6 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors group">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-lg ${a.type==='Urgent'?'bg-rose-500 shadow-rose-200':a.type==='Event'?'bg-purple-500 shadow-purple-200':'bg-blue-500 shadow-blue-200'}`}><Megaphone size={20}/></div>
                                  <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1"><h4 className="font-bold text-slate-800">{a.title}</h4><span className="text-[10px] px-2 py-0.5 bg-slate-200 rounded font-bold text-slate-600">{a.type}</span></div>
                                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{a.content}</p>
                                      <p className="text-xs text-slate-400 mt-2 font-medium">{new Date(a.date).toLocaleDateString('id-ID', {weekday: 'long', day:'numeric', month:'long'})}</p>
                                  </div>
                                  <button onClick={() => handleDeleteAnnouncement(a.id)} className="self-center p-2 text-slate-300 hover:text-rose-500 bg-white rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                              </div>
                          ))}
                      </div>
                  </Card>
              )}
          </div>

          <Modal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              title={
                  modalType === 'editHouse' ? 'Edit Data Warga' :
                  modalType === 'announcement' ? 'Buat Pengumuman' :
                  modalType === 'cash' ? 'Catat Transaksi' :
                  modalType === 'official' ? 'Data Pengurus' :
                  modalType === 'inventory' ? 'Inventaris' :
                  modalType === 'umkm' ? 'Data UMKM' :
                  modalType === 'ronda' ? 'Jadwal Ronda' : 'Form'
              }
              headerColor={
                  modalType === 'editHouse' && editHouseForm.unifiedStatus === 'Empty' ? 'bg-slate-50' :
                  modalType === 'editHouse' && editHouseForm.unifiedStatus === 'Business' ? 'bg-purple-50' :
                  modalType === 'editHouse' ? 'bg-blue-50' : 'bg-white'
              }
          >
              {modalType === 'editHouse' && selectedHouse && (
                  <form onSubmit={handleSaveHouse} className="space-y-6">
                      {/* Unified Status Selector */}
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Status Hunian</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {[
                                  { id: 'Tetap', label: 'Dihuni (Tetap)', icon: Home, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
                                  { id: 'Kontrak', label: 'Dihuni (Sewa)', icon: Key, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                                  { id: 'Kost', label: 'Dihuni (Kost)', icon: GraduationCap, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
                                  { id: 'Business', label: 'Tempat Usaha', icon: Store, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
                                  { id: 'Empty', label: 'Rumah Kosong', icon: Ban, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' },
                              ].map((option) => (
                                  <button
                                      type="button"
                                      key={option.id}
                                      onClick={() => setEditHouseForm({...editHouseForm, unifiedStatus: option.id})}
                                      className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 h-24 justify-center ${
                                          editHouseForm.unifiedStatus === option.id 
                                          ? `${option.bg} ${option.border} ring-2 ring-offset-2 ring-${option.color.split('-')[1]}-400` 
                                          : 'bg-white border-slate-100 hover:border-slate-300 text-slate-400 hover:bg-slate-50'
                                      }`}
                                  >
                                      <option.icon size={24} className={editHouseForm.unifiedStatus === option.id ? option.color : 'text-slate-400'}/>
                                      <span className={`text-[10px] font-bold ${editHouseForm.unifiedStatus === option.id ? option.color : 'text-slate-500'}`}>{option.label}</span>
                                  </button>
                              ))}
                          </div>
                      </div>

                      {editHouseForm.unifiedStatus !== 'Empty' && (
                          <div className="space-y-4 animate-fade-in">
                              <div><label className="block text-xs font-bold mb-1 ml-1 text-slate-600">Nama Kepala Keluarga / P.J.</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none" value={editHouseForm.headOfFamily} onChange={e=>setEditHouseForm({...editHouseForm, headOfFamily: e.target.value})} required/></div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div><label className="block text-xs font-bold mb-1 ml-1 text-slate-600">Jml Penghuni</label><input type="number" min="1" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" value={editHouseForm.occupants} onChange={e=>setEditHouseForm({...editHouseForm, occupants: e.target.value})}/></div>
                                  <div><label className="block text-xs font-bold mb-1 ml-1 text-slate-600">No. WhatsApp</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" value={editHouseForm.phone} onChange={e=>setEditHouseForm({...editHouseForm, phone: e.target.value})} placeholder="08..."/></div>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={12}/> Detail Demografi</p>
                                  <div className="grid grid-cols-3 gap-3">
                                      <div><label className="text-[10px] font-bold text-pink-600 mb-1 block">Ibu Hamil</label><input type="number" min="0" className="w-full p-2 text-center bg-white border border-slate-200 rounded-lg text-sm font-bold" value={editHouseForm.pregnantCount} onChange={e=>setEditHouseForm({...editHouseForm, pregnantCount: parseInt(e.target.value)||0})}/></div>
                                      <div><label className="text-[10px] font-bold text-cyan-600 mb-1 block">Bayi</label><input type="number" min="0" className="w-full p-2 text-center bg-white border border-slate-200 rounded-lg text-sm font-bold" value={editHouseForm.babyCount} onChange={e=>setEditHouseForm({...editHouseForm, babyCount: parseInt(e.target.value)||0})}/></div>
                                      <div><label className="text-[10px] font-bold text-orange-600 mb-1 block">Balita</label><input type="number" min="0" className="w-full p-2 text-center bg-white border border-slate-200 rounded-lg text-sm font-bold" value={editHouseForm.toddlerCount} onChange={e=>setEditHouseForm({...editHouseForm, toddlerCount: parseInt(e.target.value)||0})}/></div>
                                      <div><label className="text-[10px] font-bold text-lime-600 mb-1 block">Remaja</label><input type="number" min="0" className="w-full p-2 text-center bg-white border border-slate-200 rounded-lg text-sm font-bold" value={editHouseForm.teenagerCount} onChange={e=>setEditHouseForm({...editHouseForm, teenagerCount: parseInt(e.target.value)||0})}/></div>
                                      <div><label className="text-[10px] font-bold text-purple-600 mb-1 block">Lansia</label><input type="number" min="0" className="w-full p-2 text-center bg-white border border-slate-200 rounded-lg text-sm font-bold" value={editHouseForm.elderlyCount} onChange={e=>setEditHouseForm({...editHouseForm, elderlyCount: parseInt(e.target.value)||0})}/></div>
                                  </div>
                              </div>
                          </div>
                      )}
                      
                      {editHouseForm.unifiedStatus === 'Empty' && <div className="bg-slate-100 p-8 rounded-2xl text-center border-2 border-dashed border-slate-200"><p className="text-slate-500 text-sm font-medium">Data penghuni akan otomatis dikosongkan.</p></div>}
                      <Button type="submit" className="w-full py-4 text-base shadow-xl shadow-slate-200">Simpan Data Warga</Button>
                  </form>
              )}

              {modalType === 'announcement' && (
                  <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                      <div><label className="block text-xs font-bold mb-1">Judul</label><input className="w-full p-3 border rounded-xl" value={annTitle} onChange={e=>setAnnTitle(e.target.value)} required/></div>
                      <div><label className="block text-xs font-bold mb-1">Tipe</label><select className="w-full p-3 border rounded-xl bg-white" value={annType} onChange={e=>setAnnType(e.target.value as any)}><option>General</option><option>Urgent</option><option>Event</option></select></div>
                      <div><label className="block text-xs font-bold mb-1">Konten (AI Draft Available)</label><div className="flex gap-2 mb-2"><input className="flex-1 p-2 border rounded-lg text-xs" placeholder="Topik..." value={draftTopic} onChange={e=>setDraftTopic(e.target.value)} /><Button type="button" size="sm" onClick={handleGenerateDraft} disabled={isGenerating}>{isGenerating?'...':'Buat Draft'}</Button></div><textarea className="w-full p-3 border rounded-xl h-32" value={annContent} onChange={e=>setAnnContent(e.target.value)} required/></div>
                      <Button type="submit" className="w-full">Terbitkan</Button>
                  </form>
              )}

              {modalType === 'cash' && (
                  <form onSubmit={handleAddTransaction} className="space-y-4">
                      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4"><button type="button" onClick={()=>setCashType('Income')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${cashType==='Income'?'bg-white text-emerald-600 shadow-sm':'text-slate-400'}`}>Pemasukan</button><button type="button" onClick={()=>setCashType('Expense')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${cashType==='Expense'?'bg-white text-rose-600 shadow-sm':'text-slate-400'}`}>Pengeluaran</button></div>
                      <div><label className="block text-xs font-bold mb-1">Nominal (Rp)</label><input type="number" className="w-full p-3 border rounded-xl text-lg font-bold" value={cashAmount} onChange={e=>setCashAmount(e.target.value)} required/></div>
                      <div><label className="block text-xs font-bold mb-1">Keterangan</label><input className="w-full p-3 border rounded-xl" value={cashDesc} onChange={e=>setCashDesc(e.target.value)} required/></div>
                      <div><label className="block text-xs font-bold mb-1">Kategori</label><select className="w-full p-3 border rounded-xl bg-white" value={cashCategory} onChange={e=>setCashCategory(e.target.value)}><option>Iuran Warga</option><option>Fasilitas</option><option>Kegiatan</option><option>Keamanan</option><option>Lainnya</option></select></div>
                      <Button type="submit" className="w-full">Simpan Transaksi</Button>
                  </form>
              )}

              {modalType === 'official' && (
                  <form onSubmit={handleSaveOfficial} className="space-y-4">
                      <div><label className="block text-xs font-bold mb-1">Nama</label><input className="w-full p-3 border rounded-xl" value={offName} onChange={e=>setOffName(e.target.value)} required/></div>
                      <div><label className="block text-xs font-bold mb-1">Jabatan</label><input className="w-full p-3 border rounded-xl" value={offRole} onChange={e=>setOffRole(e.target.value)} required/></div>
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-xs font-bold mb-1">HP</label><input className="w-full p-3 border rounded-xl" value={offPhone} onChange={e=>setOffPhone(e.target.value)}/></div>
                          <div><label className="block text-xs font-bold mb-1">Rumah</label><input className="w-full p-3 border rounded-xl" value={offHouse} onChange={e=>setOffHouse(e.target.value)}/></div>
                      </div>
                      <Button type="submit" className="w-full">Simpan</Button>
                  </form>
              )}

              {modalType === 'umkm' && (
                  <form onSubmit={handleSaveUMKM} className="space-y-4">
                      <div><label className="block text-xs font-bold mb-1">Nama Usaha</label><input className="w-full p-3 border rounded-xl" value={umkmName} onChange={e=>setUmkmName(e.target.value)} required/></div>
                      <div><label className="block text-xs font-bold mb-1">Pemilik</label><input className="w-full p-3 border rounded-xl" value={umkmOwner} onChange={e=>setUmkmOwner(e.target.value)} required/></div>
                      <div><label className="block text-xs font-bold mb-1">Kategori</label><input className="w-full p-3 border rounded-xl" value={umkmCategory} onChange={e=>setUmkmCategory(e.target.value)} placeholder="Kuliner, Jasa..."/></div>
                      <div><label className="block text-xs font-bold mb-1">Deskripsi</label><textarea className="w-full p-3 border rounded-xl h-24" value={umkmDesc} onChange={e=>setUmkmDesc(e.target.value)}/></div>
                      <div><label className="block text-xs font-bold mb-1">Kontak (WA)</label><input className="w-full p-3 border rounded-xl" value={umkmContact} onChange={e=>setUmkmContact(e.target.value)}/></div>
                      <div><label className="block text-xs font-bold mb-1">URL Foto</label><input className="w-full p-3 border rounded-xl" value={umkmImage} onChange={e=>setUmkmImage(e.target.value)}/></div>
                      <Button type="submit" className="w-full">Simpan</Button>
                  </form>
              )}

              {modalType === 'dues' && (
                  <form onSubmit={handleSaveDues} className="space-y-6 text-center">
                      <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-2"><DollarSign size={32}/></div>
                      <h3 className="font-bold text-lg text-slate-800">Catat Pembayaran Iuran</h3>
                      <div><label className="block text-xs font-bold mb-2 text-slate-500">Nominal (Rp)</label><input type="number" className="w-full p-4 border rounded-2xl text-center text-2xl font-black text-slate-800" value={duesAmount} onChange={e=>setDuesAmount(e.target.value)}/></div>
                      <div className="flex gap-2 justify-center">
                          <button type="button" onClick={()=>setDuesStatus(PaymentStatus.PAID)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${duesStatus===PaymentStatus.PAID?'bg-emerald-600 text-white border-emerald-600':'bg-white text-slate-500 border-slate-200'}`}>Lunas</button>
                          <button type="button" onClick={()=>setDuesStatus(PaymentStatus.PENDING)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${duesStatus===PaymentStatus.PENDING?'bg-amber-500 text-white border-amber-500':'bg-white text-slate-500 border-slate-200'}`}>Belum</button>
                          <button type="button" onClick={()=>setDuesStatus(PaymentStatus.UNPAID)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${duesStatus===PaymentStatus.UNPAID?'bg-rose-500 text-white border-rose-500':'bg-white text-slate-500 border-slate-200'}`}>Menunggak</button>
                      </div>
                      <Button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700">Konfirmasi Pembayaran</Button>
                  </form>
              )}

              {modalType === 'ronda' && (
                  <form onSubmit={handleSaveRonda} className="space-y-4">
                      <div><label className="block text-xs font-bold mb-1">Hari</label><input className="w-full p-3 border rounded-xl bg-slate-100" value={rondaDay} disabled/></div>
                      <div><label className="block text-xs font-bold mb-1">Anggota (Pisahkan Koma)</label><textarea className="w-full p-3 border rounded-xl h-32" value={rondaMembers} onChange={e=>setRondaMembers(e.target.value)}/></div>
                      <Button type="submit" className="w-full">Update Jadwal</Button>
                  </form>
              )}

              {modalType === 'inventory' && (
                  <form onSubmit={handleSaveInventory} className="space-y-4">
                      <div><label className="block text-xs font-bold mb-1">Nama Barang</label><input className="w-full p-3 border rounded-xl" value={invName} onChange={e=>setInvName(e.target.value)} required/></div>
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-xs font-bold mb-1">Total</label><input type="number" className="w-full p-3 border rounded-xl" value={invTotal} onChange={e=>setInvTotal(e.target.value)} required/></div>
                          <div><label className="block text-xs font-bold mb-1">Tersedia</label><input type="number" className="w-full p-3 border rounded-xl" value={invAvailable} onChange={e=>setInvAvailable(e.target.value)} required/></div>
                      </div>
                      <div><label className="block text-xs font-bold mb-1">Kondisi</label><select className="w-full p-3 border rounded-xl bg-white" value={invCondition} onChange={e=>setInvCondition(e.target.value as any)}><option>Baik</option><option>Perlu Perbaikan</option><option>Rusak</option></select></div>
                      <div><label className="block text-xs font-bold mb-1">Catatan</label><textarea className="w-full p-3 border rounded-xl" value={invNotes} onChange={e=>setInvNotes(e.target.value)}/></div>
                      <Button type="submit" className="w-full">Simpan</Button>
                  </form>
              )}
          </Modal>
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
             <PublicUMKM umkm={umkm} />
             <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
            </>
        } />
        <Route path="/info" element={
            <>
             <PublicHeader />
             <PublicInfo announcements={announcements} ronda={ronda} officials={officials} cashFlow={cashFlow} />
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

export default App;
