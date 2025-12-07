
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
  Heart, Baby, Accessibility, Smile, GraduationCap, Key, Calculator, UserCheck, Info, Ban
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { jsPDF } from "jspdf";

// Components & Services
import { Logo, generateHouses, MOCK_ANNOUNCEMENTS, MOCK_UMKM, MOCK_RONDA, MOCK_CASHFLOW, MOCK_GALLERY, INITIAL_OFFICIALS, DEFAULT_PDF_CONFIG, MOCK_INVENTORY } from '../constants';
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
}: any) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'announcement' | 'cash' | 'official' | 'editHouse' | 'inventory' | 'ronda' | 'umkm' | 'dues' | 'import'>('announcement');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false); 
  const [importPreview, setImportPreview] = useState<any[]>([]); 
  const navigate = useNavigate();

  const [residentView, setResidentView] = useState<'grid' | 'table'>('table');
  const [searchResident, setSearchResident] = useState('');
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  
  // --- UNIFIED STATUS STATE ---
  // Combines 'status' (Occupied/Empty/Business) and 'residenceType' (Tetap/Kontrak/Kost) into one field for UI
  const [editHouseForm, setEditHouseForm] = useState<{
    headOfFamily: string;
    occupants: number;
    phone: string;
    paymentStatus: string;
    unifiedStatus: 'Tetap' | 'Kontrak' | 'Kost' | 'Business' | 'Empty';
    pregnantCount: number;
    babyCount: number;
    toddlerCount: number;
    teenagerCount: number; 
    elderlyCount: number;
  }>({ 
      headOfFamily: '', occupants: 0, phone: '', paymentStatus: '', unifiedStatus: 'Tetap',
      pregnantCount: 0, babyCount: 0, toddlerCount: 0, teenagerCount: 0, elderlyCount: 0 
  });

  const [serviceTab, setServiceTab] = useState<'surat' | 'laporan'>('surat');
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

  const handleCreateAnnouncement = async (e: React.FormEvent) => { e.preventDefault(); await addAnnouncementToDb({ title: annTitle, content: annContent, type: annType, date: new Date().toISOString() }); setIsModalOpen(false); resetForms(); };
  const handleDeleteAnnouncement = async (id: string) => { if (confirm("Hapus pengumuman ini?")) await deleteAnnouncementFromDb(id); };
  const handleGenerateDraft = async () => { if(!draftTopic) return; setIsGenerating(true); const draft = await generateAnnouncementDraft(draftTopic); setAnnContent(draft); setAnnTitle(draftTopic); setIsGenerating(false); };
  const handleAddTransaction = async (e: React.FormEvent) => { e.preventDefault(); await addTransactionToDb({ description: cashDesc, amount: parseInt(cashAmount), type: cashType, category: cashCategory, date: new Date().toISOString().split('T')[0] }); setIsModalOpen(false); resetForms(); };
  const handleDeleteTransaction = async (id: string) => { if (confirm("Hapus transaksi ini?")) await deleteTransactionFromDb(id); };
  const handleSaveDues = async (e: React.FormEvent) => { e.preventDefault(); if (!duesHouseId) return; await updateHouseData(duesHouseId, { paymentStatus: duesStatus }); if (duesStatus === PaymentStatus.PAID) { const house = houses.find((h:House) => h.id === duesHouseId); await addTransactionToDb({ description: `Iuran Warga ${duesHouseId} (${house?.headOfFamily || 'Warga'})`, amount: parseInt(duesAmount), type: 'Income', category: 'Iuran Warga', date: new Date().toISOString().split('T')[0] }); } setIsModalOpen(false); resetForms(); };
  const handleExportCSV = () => { const headers = ["Blok", "Nomor", "Kepala Keluarga", "Status Hunian", "Jumlah Penghuni", "Status Iuran", "No. HP"]; const rows = houses.map((h:House) => { let statusIndo = h.status === 'Occupied' ? 'Dihuni' : h.status === 'Empty' ? 'Kosong' : 'Usaha'; if(h.status === 'Occupied') { if(h.residenceType === 'Kost') statusIndo += ' (Kost)'; else if(h.residenceType === 'Kontrak') statusIndo += ' (Kontrak)'; else statusIndo += ' (Tetap)'; } return [h.block, h.number, `"${h.headOfFamily}"`, statusIndo, h.occupants, h.paymentStatus, h.phone || '-']; }); const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n"); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", `Data_Warga_RT002_${new Date().toISOString().split('T')[0]}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); };
  const handleDownloadTemplate = () => { const headers = "Blok,Nomor,Kepala Keluarga,Status Hunian,Jumlah Penghuni,Status Iuran,No. HP"; const example = "C5,01,Bpk. Contoh,Dihuni (Tetap/Kontrak/Kost),4,Lunas,08123456789"; const csvContent = `${headers}\n${example}`; const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", "Template_Data_Warga.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link); };
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (event) => { const text = event.target?.result as string; if (!text) return; const rows = text.split('\n').map(r => r.trim()).filter(r => r); if (rows.length < 2) { alert("File CSV kosong atau tidak valid."); return; } const firstRow = rows[0]; const delimiter = firstRow.includes(';') ? ';' : ','; const headers = firstRow.split(delimiter); if (!headers[0].includes('Blok')) { alert("Format Header CSV Salah! Pastikan kolom pertama adalah 'Blok'."); return; } const newHouses: any[] = []; for (let i = 1; i < rows.length; i++) { const cols = rows[i].split(delimiter).map(c => c.replace(/"/g, '').trim()); if (cols.length < 2) continue; const block = cols[0].trim().toUpperCase(); const rawNumber = cols[1].trim(); const number = rawNumber.length === 1 ? `0${rawNumber}` : rawNumber; const headOfFamily = cols[2]; const statusRaw = cols[3].toLowerCase(); const occupants = parseInt(cols[4]) || 0; const paymentStatusRaw = cols[5]; const phone = cols[6] === '-' ? '' : cols[6]; let status = 'Occupied'; if (statusRaw.includes('kosong')) status = 'Empty'; else if (statusRaw.includes('usaha')) status = 'Business'; let residenceType = 'Tetap'; if (statusRaw.includes('kontrak')) residenceType = 'Kontrak'; else if (statusRaw.includes('kost') || statusRaw.includes('mahasiswa') || statusRaw.includes('asrama')) residenceType = 'Kost'; let paymentStatus = PaymentStatus.UNPAID; if (paymentStatusRaw === 'Lunas') paymentStatus = PaymentStatus.PAID; else if (paymentStatusRaw === 'Belum Lunas') paymentStatus = PaymentStatus.PENDING; newHouses.push({ id: `${block}-${number}`, block, number, headOfFamily, status, residenceType, occupants, paymentStatus, phone }); } if (newHouses.length > 0) { setImportPreview(newHouses); setModalType('import'); setIsModalOpen(true); } else { alert("Tidak ada data valid yang ditemukan dalam file."); } }; reader.readAsText(file); e.target.value = ''; };
  const executeImport = async () => { try { setIsImporting(true); await batchUpdateHouses(importPreview); alert("Import Data Berhasil! Data lama telah diperbarui."); setIsModalOpen(false); setImportPreview([]); } catch (e) { alert("Gagal mengupdate data. Cek koneksi internet."); } finally { setIsImporting(false); } };
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
  
  // --- FIX: OPEN EDIT HOUSE LOGIC ---
  const openEditHouse = (h: House) => { 
      setSelectedHouse(h);
      
      // Determine unified status for the form
      let unified: any = 'Tetap';
      if (h.status === 'Empty') unified = 'Empty';
      else if (h.status === 'Business') unified = 'Business';
      else if (h.status === 'Occupied') {
          if (h.residenceType === 'Kost') unified = 'Kost';
          else if (h.residenceType === 'Kontrak') unified = 'Kontrak';
          else unified = 'Tetap';
      }

      setEditHouseForm({ 
          headOfFamily: h.headOfFamily, 
          occupants: h.occupants, 
          phone: h.phone || '', 
          paymentStatus: h.paymentStatus, 
          unifiedStatus: unified, // Use unified field
          
          pregnantCount: h.pregnantCount || (h.hasPregnant ? 1 : 0),
          babyCount: h.babyCount || (h.hasBaby ? 1 : 0),
          toddlerCount: h.toddlerCount || (h.hasToddler ? 1 : 0),
          teenagerCount: h.teenagerCount || (h.hasTeenager ? 1 : 0),
          elderlyCount: h.elderlyCount || (h.hasElderly ? 1 : 0)
      }); 
      setModalType('editHouse'); 
      setIsModalOpen(true); 
  };
  
  const openDuesModal = (h: House) => { setDuesHouseId(h.id); setDuesStatus(PaymentStatus.PAID); setModalType('dues'); setIsModalOpen(true); };
  
  // --- FIX: SAVE HOUSE LOGIC ---
  const handleSaveHouse = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!selectedHouse) return;

      // Logic to split unified status back to separate fields
      let finalStatus: 'Occupied' | 'Empty' | 'Business' = 'Occupied';
      let finalResidenceType: 'Tetap' | 'Kontrak' | 'Kost' = 'Tetap';

      if (editHouseForm.unifiedStatus === 'Empty') {
          finalStatus = 'Empty';
          finalResidenceType = 'Tetap'; // Default value, won't be used
      } else if (editHouseForm.unifiedStatus === 'Business') {
          finalStatus = 'Business';
          finalResidenceType = 'Tetap'; // Default value
      } else {
          finalStatus = 'Occupied';
          // Need to cast here because unifiedStatus contains more keys than residenceType
          finalResidenceType = editHouseForm.unifiedStatus as 'Tetap' | 'Kontrak' | 'Kost'; 
      }

      await updateHouseData(selectedHouse.id, { 
          headOfFamily: finalStatus === 'Empty' ? '-' : editHouseForm.headOfFamily, 
          occupants: finalStatus === 'Empty' ? 0 : parseInt(editHouseForm.occupants as any), 
          phone: finalStatus === 'Empty' ? '' : editHouseForm.phone, 
          paymentStatus: editHouseForm.paymentStatus, 
          
          // Apply computed values
          status: finalStatus,
          residenceType: finalResidenceType,
          
          pregnantCount: editHouseForm.pregnantCount,
          babyCount: editHouseForm.babyCount,
          toddlerCount: editHouseForm.toddlerCount,
          teenagerCount: editHouseForm.teenagerCount,
          elderlyCount: editHouseForm.elderlyCount,
          hasPregnant: editHouseForm.pregnantCount > 0,
          hasBaby: editHouseForm.babyCount > 0,
          hasToddler: editHouseForm.toddlerCount > 0,
          hasTeenager: editHouseForm.teenagerCount > 0,
          hasElderly: editHouseForm.elderlyCount > 0
      }); 
      setIsModalOpen(false); 
  };

  const handleUpdateReport = async (id: string, s: string) => await updateReportStatus(id, s);
  const handleDeleteReport = async (id: string) => await deleteReportFromDb(id);
  const handleUpdateLetter = async (id: string, s: string) => await updateLetterStatus(id, s);
  const handleDeleteLetter = async (id: string) => await deleteLetterFromDb(id);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PdfConfig) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setLocalConfig(prev => ({ ...prev, [field]: reader.result as string })); reader.readAsDataURL(file); } };
  const handleSaveConfig = () => { try { setPdfConfig(localConfig); localStorage.setItem('pdf_config', JSON.stringify(localConfig)); alert("Disimpan!"); } catch (e) { alert("Gagal menyimpan."); } };
  const resetForms = () => { setAnnTitle(''); setAnnContent(''); setDraftTopic(''); setCashDesc(''); setCashAmount(''); setCashType('Income'); setOffName(''); setOffRole(''); setOffPhone(''); setOffHouse(''); setOffPhoto(''); setOffId(null); setInvName(''); setInvTotal(''); setInvAvailable(''); setInvNotes(''); setInvId(null); setRondaMembers(''); setSelectedRondaId(null); setUmkmName(''); setUmkmOwner(''); setUmkmCategory(''); setUmkmDesc(''); setUmkmContact(''); setUmkmImage(''); setUmkmId(null); setDuesHouseId(''); setDuesAmount('25000'); setDuesStatus(PaymentStatus.PAID); };

  const navGroups = [{ title: "Menu Utama", items: [{ id: 'overview', icon: LayoutDashboard, label: 'Dashboard' }] }, { title: "Administrasi", items: [{ id: 'residents', icon: Users, label: 'Data Warga' }, { id: 'services', icon: Archive, label: 'Layanan Surat & Laporan' }, { id: 'finance', icon: DollarSign, label: 'Keuangan & Kas' }] }, { title: "Lingkungan", items: [{ id: 'facilities', icon: Package, label: 'Fasilitas & Jadwal' }, { id: 'umkm', icon: ShoppingBag, label: 'UMKM Warga' }, { id: 'announcements', icon: Megaphone, label: 'Pengumuman' }, { id: 'officials', icon: Briefcase, label: 'Pengurus' }] }, { title: "Sistem", items: [{ id: 'settings', icon: Settings, label: 'Pengaturan' }] }];
  const renderNavItems = () => (<nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">{navGroups.map((group, groupIdx) => (<div key={groupIdx}><h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-4">{group.title}</h3><div className="space-y-1">{group.items.map(item => (<button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group font-medium ${activeTab === item.id ? 'bg-blue-50 text-brand-blue shadow-sm ring-1 ring-blue-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}><item.icon size={18} className={activeTab === item.id ? 'text-brand-blue' : 'text-slate-400 group-hover:text-slate-600'} /> <span className="text-sm">{item.label}</span>{activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-blue"></div>}</button>))}</div></div>))}</nav>);

  return (
    <div className="min-h-screen bg-slate-50 flex relative">
      {/* ... (Menu & Sidebar - No Change) */}
      {isMobileMenuOpen && (<div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}><div className="w-72 bg-white h-full shadow-2xl animate-slide-in-right flex flex-col border-r border-slate-200" onClick={e => e.stopPropagation()}><div className="p-6 border-b border-slate-100 flex justify-between items-center"><div><h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight"><Shield className="text-brand-blue" size={20}/> TERAS Admin</h2><p className="text-xs text-slate-500">RT 002 / RW 020</p></div><button onClick={() => setIsMobileMenuOpen(false)} className="bg-slate-50 p-1.5 rounded-full text-slate-400 hover:text-slate-800"><X size={18}/></button></div>{renderNavItems()}<div className="p-4 border-t border-slate-100 bg-slate-50"><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><LogOut size={18} /> <span className="font-medium text-sm">Keluar / Ke Beranda</span></button></div></div></div>)}<div className="w-64 bg-white border-r border-slate-200 fixed h-full hidden md:flex flex-col z-30 shadow-sm"><div className="p-6 border-b border-slate-100"><h2 className="text-xl font-black flex items-center gap-2 tracking-tight text-slate-800"><div className="bg-brand-blue p-1 rounded-lg"><Shield size={20} className="text-white"/></div> TERAS Admin</h2><p className="text-xs text-slate-400 mt-2 pl-1">Management Dashboard v1.0</p></div>{renderNavItems()}<div className="p-4 border-t border-slate-100 bg-slate-50"><button onClick={() => navigate('/')} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all text-xs font-bold border border-slate-200 hover:border-rose-200"><LogOut size={14} /> Keluar Aplikasi</button></div></div>

      <div className="flex-1 md:ml-64 p-4 md:p-8 pb-safe-area-pb md:pb-8 max-w-full overflow-hidden">
          {/* ... (Header - No Change) */}
          <div className="flex justify-between items-center mb-6 md:mb-8 sticky top-0 bg-slate-50/90 backdrop-blur-md z-20 py-3 border-b border-slate-200/50 md:border-none md:bg-transparent md:backdrop-blur-none"><div className="flex items-center gap-3"><button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-white rounded-lg border border-slate-200 shadow-sm active:scale-95"><Menu size={24} /></button><h1 className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-tight line-clamp-1">{activeTab}</h1></div><div className="flex items-center gap-3"><div className="bg-white p-2 rounded-full shadow-sm border border-slate-200"><User size={20} className="text-slate-700"/></div><span className="font-bold text-sm text-slate-700 hidden md:block">Ketua RT 002</span></div></div>

          {/* ... (Tab Contents - Overview, UMKM - No Change) */}
          {activeTab === 'overview' && (<div className="space-y-6 animate-fade-in"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow"><div className="p-4 bg-sky-50 text-sky-600 rounded-2xl"><Users size={28}/></div><div><p className="text-slate-500 text-sm font-medium">Total Warga</p><h3 className="text-2xl font-black text-slate-800">{houses.filter((h:House) => h.status === 'Occupied').length} KK</h3></div></div><div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow"><div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Wallet size={28}/></div><div><p className="text-slate-500 text-sm font-medium">Saldo Kas</p><h3 className="text-2xl font-black text-slate-800">Rp {(cashFlow.reduce((acc, c) => c.type === 'Income' ? acc + c.amount : acc - c.amount, 0)).toLocaleString()}</h3></div></div><div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow"><div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><AlertTriangle size={28}/></div><div><p className="text-slate-500 text-sm font-medium">Laporan Baru</p><h3 className="text-2xl font-black text-slate-800">{reports.filter((r:Report) => r.status === 'Baru').length}</h3></div></div></div></div>)}
          {activeTab === 'umkm' && (<div className="animate-fade-in space-y-6"><div className="flex justify-between items-center bg-white p-4 rounded-xl border"><h2 className="font-bold text-lg">Daftar Usaha Warga</h2><Button onClick={() => { resetForms(); setModalType('umkm'); setIsModalOpen(true); }}><Plus size={18}/> Tambah</Button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{umkm.map((u:UMKM) => (<div key={u.id} className="bg-white rounded-xl shadow-sm border overflow-hidden group"><div className="h-32 bg-slate-200 relative"><img src={u.image} className="w-full h-full object-cover" onError={(e)=>{(e.target as HTMLImageElement).src='https://via.placeholder.com/300x200?text=No+Image'}} /><div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openEditUMKM(u)} className="p-1.5 bg-white rounded-lg shadow text-slate-700 hover:text-blue-600"><Edit2 size={14}/></button><button onClick={() => handleDeleteUMKM(u.id)} className="p-1.5 bg-white rounded-lg shadow text-slate-700 hover:text-rose-600"><Trash2 size={14}/></button></div></div><div className="p-4"><div className="flex justify-between items-start"><h3 className="font-bold text-slate-800">{u.name}</h3><span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-bold">{u.category}</span></div><p className="text-xs text-slate-500 mt-1">Pemilik: {u.owner}</p></div></div>))}</div></div>)}
          
          {/* UPDATED RESIDENTS TAB UI */}
          {activeTab === 'residents' && (
              <div className="animate-fade-in space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={20}/></div><div><p className="text-[10px] uppercase text-slate-400 font-bold">Total Jiwa</p><h4 className="text-xl font-black text-slate-800">{houses.reduce((acc: number, h: House) => acc + (h.occupants || 0), 0)}</h4></div></div>
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3"><div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Home size={20}/></div><div><p className="text-[10px] uppercase text-slate-400 font-bold">Total KK</p><h4 className="text-xl font-black text-slate-800">{houses.filter((h:House) => h.status === 'Occupied').length}</h4></div></div>
                  </div>
                  {/* Toolbar */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="relative w-full md:w-96"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Cari warga, blok..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={searchResident} onChange={(e) => setSearchResident(e.target.value)} /></div>
                      <div className="flex gap-2 items-center flex-wrap">
                          <label className={`flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 text-xs font-bold transition-all shadow-md active:scale-95 h-10 ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}>{isImporting ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>} {isImporting ? 'Memproses...' : 'Import CSV'}<input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} disabled={isImporting} /></label>
                          <Button onClick={handleDownloadTemplate} variant="outline" className="text-xs h-10 text-slate-600 border-dashed border-2"><FileText size={16}/> Template</Button>
                          <Button onClick={() => generateResidentReportPDF(houses, pdfConfig)} className="text-xs h-10 bg-slate-800 text-white"><Printer size={16}/> Cetak PDF</Button>
                          <Button onClick={handleExportCSV} variant="outline" className="text-xs h-10"><Download size={16}/> CSV</Button>
                          <div className="flex bg-slate-100 p-1 rounded-xl"><button onClick={() => setResidentView('grid')} className={`p-2 rounded-lg transition-all ${residentView === 'grid' ? 'bg-white shadow text-brand-blue' : 'text-slate-400'}`}><Grid size={18} /></button><button onClick={() => setResidentView('table')} className={`p-2 rounded-lg transition-all ${residentView === 'table' ? 'bg-white shadow text-brand-blue' : 'text-slate-400'}`}><List size={18} /></button></div>
                      </div>
                  </div>
                  {/* Table/Grid View */}
                  {residentView === 'grid' ? (<div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm"><HouseMap houses={houses} isAdmin={true} onEditHouse={openEditHouse} onPayDues={openDuesModal} reports={reports} officials={officials} /></div>) : (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs"><tr><th className="p-4">No</th><th className="p-4">Blok</th><th className="p-4">Nomor</th><th className="p-4">Kepala Keluarga / P.J.</th><th className="p-4">Status & Kontak</th><th className="p-4">Iuran</th><th className="p-4 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-50">{houses.filter((h:House) => h.headOfFamily.toLowerCase().includes(searchResident.toLowerCase()) || h.block.toLowerCase().includes(searchResident.toLowerCase()) || h.number.includes(searchResident)).map((h:House, i:number) => (<tr key={h.id} className="hover:bg-slate-50 transition-colors"><td className="p-4 text-slate-500">{i+1}</td><td className="p-4 font-bold">{h.block}</td><td className="p-4 font-bold">{h.number}</td><td className="p-4">{h.headOfFamily}</td><td className="p-4"><div className="flex flex-col gap-1.5 items-start"><span className={`px-2 py-1 rounded-full text-xs font-bold border ${h.status === 'Empty' ? 'bg-slate-100 text-slate-500 border-slate-200' : h.status === 'Business' ? 'bg-purple-50 text-purple-600 border-purple-200' : h.residenceType === 'Kost' ? 'bg-cyan-50 text-cyan-600 border-cyan-200' : h.residenceType === 'Kontrak' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>{h.status === 'Empty' ? 'Kosong' : h.status === 'Business' ? 'Usaha' : h.residenceType === 'Kost' ? 'Kost' : h.residenceType === 'Kontrak' ? 'Kontrak' : 'Tetap'}</span>{h.phone ? (<a href={`https://wa.me/${h.phone.replace(/^0/, '62').replace(/-/g, '')}`} target="_blank" className="text-xs text-slate-500 flex items-center gap-1 hover:text-green-600 font-medium"><Phone size={12}/> {h.phone}</a>) : (<span className="text-xs text-slate-400 italic pl-1">-</span>)}</div></td><td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${h.paymentStatus===PaymentStatus.PAID?'bg-blue-100 text-blue-700':h.paymentStatus===PaymentStatus.PENDING?'bg-amber-100 text-amber-700':'bg-rose-100 text-rose-700'}`}>{h.paymentStatus}</span></td><td className="p-4 flex justify-center gap-2"><button onClick={() => openEditHouse(h)} className="p-2 text-slate-500 hover:text-blue-600 bg-white border rounded-lg shadow-sm"><Edit2 size={16}/></button><button onClick={() => openDuesModal(h)} className="p-2 text-slate-500 hover:text-emerald-600 bg-white border rounded-lg shadow-sm"><DollarSign size={16}/></button></td></tr>))}</tbody></table></div></div>)}</div>)}

          {/* ... (Other Tabs - Services, Finance, Facilities, Announcements, Officials, Settings - No Change) */}
          {activeTab === 'services' && (<div className="animate-fade-in space-y-6"><div className="flex gap-4 border-b border-slate-200"><button onClick={() => setServiceTab('surat')} className={`pb-3 px-1 font-bold text-sm border-b-2 transition-all ${serviceTab === 'surat' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-400'}`}>Permohonan Surat</button><button onClick={() => setServiceTab('laporan')} className={`pb-3 px-1 font-bold text-sm border-b-2 transition-all ${serviceTab === 'laporan' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-400'}`}>Laporan Warga</button></div>{serviceTab === 'surat' ? (<div className="space-y-4">{letters.map((l:LetterRequest) => (<div key={l.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div><div className="flex items-center gap-2 mb-1"><span className="font-bold text-slate-800">{l.type}</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${l.status==='Approved'?'bg-emerald-100 text-emerald-600':l.status==='Rejected'?'bg-rose-100 text-rose-600':'bg-amber-100 text-amber-600'}`}>{l.status}</span></div><p className="text-sm text-slate-600">Pemohon: <b>{l.applicantName}</b></p><p className="text-xs text-slate-400">{l.date}</p></div><div className="flex gap-2">{l.status === 'Pending' && <><Button variant="success" className="h-9 text-xs" onClick={() => handleUpdateLetter(l.id, 'Approved')}>Setujui</Button><Button variant="danger" className="h-9 text-xs" onClick={() => handleUpdateLetter(l.id, 'Rejected')}>Tolak</Button></>} {l.status === 'Approved' && <Button onClick={() => generateSuratPengantar(l, pdfConfig, false)} className="h-9 text-xs"><Printer size={16}/> Cetak</Button>}<button onClick={() => handleDeleteLetter(l.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={18}/></button></div></div>))}</div>) : (<div className="space-y-4">{reports.map((r:Report) => (<div key={r.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className={`font-bold ${r.type==='Keamanan'?'text-rose-600':'text-slate-800'}`}>{r.type}</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.status==='Selesai'?'bg-emerald-100 text-emerald-600':r.status==='Diproses'?'bg-blue-100 text-blue-600':'bg-rose-100 text-rose-600'}`}>{r.status}</span></div><p className="text-sm text-slate-600 line-clamp-2">{r.description}</p><p className="text-xs text-slate-400 mt-1">Pelapor: {r.reporterName} • {r.date}</p></div><div className="flex gap-2 shrink-0"><select className="bg-slate-50 border rounded-lg text-xs p-2 font-bold" value={r.status} onChange={(e) => handleUpdateReport(r.id, e.target.value)}><option>Baru</option><option>Diproses</option><option>Selesai</option></select><button onClick={() => handleDeleteReport(r.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={18}/></button></div></div>))}</div>)}</div>)}
          {activeTab === 'finance' && (<div className="animate-fade-in space-y-6"><div className="flex justify-between items-center bg-white p-4 rounded-xl border"><h2 className="font-bold text-lg">Arus Kas & Keuangan</h2><Button onClick={() => { resetForms(); setModalType('cash'); setIsModalOpen(true); }}><Plus size={18}/> Catat Transaksi</Button></div><div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs"><tr><th className="p-4">Tanggal</th><th className="p-4">Kategori</th><th className="p-4">Keterangan</th><th className="p-4 text-right">Nominal</th><th className="p-4 text-center">Aksi</th></tr></thead><tbody>{cashFlow.map((c:CashFlow) => (<tr key={c.id} className="border-b last:border-0 hover:bg-slate-50"><td className="p-4">{c.date}</td><td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{c.category}</span></td><td className="p-4 font-medium">{c.description}</td><td className={`p-4 text-right font-bold ${c.type==='Income'?'text-emerald-600':'text-rose-600'}`}>{c.type==='Income'?'+':'-'} {c.amount.toLocaleString()}</td><td className="p-4 text-center"><button onClick={() => handleDeleteTransaction(c.id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></div>)}
          {activeTab === 'facilities' && (<div className="animate-fade-in space-y-8"><div className="space-y-4"><div className="flex justify-between items-center bg-white p-4 rounded-xl border"><h2 className="font-bold text-lg">Inventaris & Aset RT</h2><Button onClick={() => { resetForms(); setModalType('inventory'); setIsModalOpen(true); }}><Plus size={18}/> Tambah Aset</Button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{inventory.map((item:InventoryItem) => (<div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-start"><div><h4 className="font-bold text-slate-800">{item.name}</h4><p className="text-sm text-slate-500">Total: {item.total} | Tersedia: {item.available}</p><span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-2 inline-block ${item.condition==='Baik'?'bg-emerald-100 text-emerald-600':item.condition==='Rusak'?'bg-rose-100 text-rose-600':'bg-amber-100 text-amber-600'}`}>{item.condition}</span></div><div className="flex gap-1"><button onClick={() => openEditInventory(item)} className="p-2 text-blue-500 bg-blue-50 rounded-lg"><Edit2 size={16}/></button><button onClick={() => handleDeleteInventory(item.id)} className="p-2 text-rose-500 bg-rose-50 rounded-lg"><Trash2 size={16}/></button></div></div>))}</div></div><div className="space-y-4"><div className="flex justify-between items-center bg-white p-4 rounded-xl border"><h2 className="font-bold text-lg">Jadwal Ronda Mingguan</h2></div><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{ronda.map((r:RondaSchedule) => (<div key={r.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative group"><button onClick={() => openEditRonda(r)} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={14}/></button><h4 className="font-bold text-brand-blue mb-2">{r.day}</h4><ul className="text-sm text-slate-600 space-y-1">{r.members.map((m, i) => <li key={i}>• {m}</li>)}</ul></div>))}</div></div></div>)}
          {activeTab === 'announcements' && (<div className="animate-fade-in space-y-6"><div className="flex justify-between items-center bg-white p-4 rounded-xl border"><h2 className="font-bold text-lg">Pengumuman Warga</h2><Button onClick={() => { resetForms(); setModalType('announcement'); setIsModalOpen(true); }}><Plus size={18}/> Buat Pengumuman</Button></div><div className="grid grid-cols-1 gap-4">{announcements.map((a:Announcement) => (<div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-4"><div className="flex-1"><div className="flex items-center gap-2 mb-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.type==='Urgent'?'bg-rose-100 text-rose-600':a.type==='Event'?'bg-purple-100 text-purple-600':'bg-slate-100 text-slate-600'}`}>{a.type}</span><span className="text-xs text-slate-400">{new Date(a.date).toLocaleDateString()}</span></div><h3 className="font-bold text-lg text-slate-800">{a.title}</h3><p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{a.content}</p></div><button onClick={() => handleDeleteAnnouncement(a.id)} className="self-start md:self-center p-2 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-lg"><Trash2 size={18}/></button></div>))}</div></div>)}
          {activeTab === 'settings' && (<div className="animate-fade-in max-w-2xl mx-auto space-y-6"><div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings size={20}/> Konfigurasi PDF Surat</h2><div className="space-y-4"><div><label className="block text-xs font-bold mb-1">Nama RT/RW</label><input className="w-full p-2 border rounded" value={localConfig.rtName} onChange={e=>setLocalConfig({...localConfig, rtName: e.target.value})} /></div><div><label className="block text-xs font-bold mb-1">Alamat Lengkap</label><input className="w-full p-2 border rounded" value={localConfig.rtAddress} onChange={e=>setLocalConfig({...localConfig, rtAddress: e.target.value})} /></div><div className="grid grid-cols-3 gap-4"><div><label className="block text-xs font-bold mb-1">Logo (Kop)</label><input type="file" onChange={e => handleFileChange(e, 'logo')} className="text-xs"/>{localConfig.logo && <img src={localConfig.logo} className="h-10 mt-2 object-contain"/>}</div><div><label className="block text-xs font-bold mb-1">Stempel RT</label><input type="file" onChange={e => handleFileChange(e, 'stamp')} className="text-xs"/>{localConfig.stamp && <img src={localConfig.stamp} className="h-10 mt-2 object-contain"/>}</div><div><label className="block text-xs font-bold mb-1">Tanda Tangan</label><input type="file" onChange={e => handleFileChange(e, 'signature')} className="text-xs"/>{localConfig.signature && <img src={localConfig.signature} className="h-10 mt-2 object-contain"/>}</div></div><Button onClick={handleSaveConfig} className="w-full mt-4">Simpan Konfigurasi</Button></div></div></div>)}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={
          modalType === 'announcement' ? 'Buat Pengumuman' : 
          modalType === 'cash' ? 'Catat Transaksi' : 
          modalType === 'official' ? 'Data Pengurus' : 
          modalType === 'editHouse' ? 'Edit Data Warga' : 
          modalType === 'inventory' ? 'Data Inventaris' :
          modalType === 'ronda' ? 'Edit Jadwal Ronda' :
          modalType === 'umkm' ? 'Data UMKM' : 
          modalType === 'import' ? 'Preview Import CSV' : 'Catat Iuran'
      }>
          {/* ... (Existing Modals: Announcement, Cash, Official, Inventory, Ronda, UMKM, Import - No Change) */}
          {modalType === 'announcement' && (
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                  <div><label className="block text-xs font-bold mb-1">Judul</label><input className="w-full p-2 border rounded" value={annTitle} onChange={e=>setAnnTitle(e.target.value)} required/></div>
                  <div><label className="block text-xs font-bold mb-1">Tipe</label><select className="w-full p-2 border rounded" value={annType} onChange={e=>setAnnType(e.target.value as any)}><option>General</option><option>Urgent</option><option>Event</option></select></div>
                  <div><label className="block text-xs font-bold mb-1">Konten</label><textarea className="w-full p-2 border rounded h-32" value={annContent} onChange={e=>setAnnContent(e.target.value)} required/></div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100"><p className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1"><Sparkles size={12}/> Generate with AI</p><div className="flex gap-2"><input placeholder="Topik pengumuman..." className="flex-1 p-2 border rounded text-xs" value={draftTopic} onChange={e=>setDraftTopic(e.target.value)} /><Button type="button" onClick={handleGenerateDraft} disabled={isGenerating} className="text-xs">{isGenerating ? '...' : 'Buat'}</Button></div></div>
                  <Button type="submit" className="w-full">Terbitkan</Button>
              </form>
          )}
          {modalType === 'cash' && (
              <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div><label className="block text-xs font-bold mb-1">Jenis</label><div className="flex gap-2"><button type="button" onClick={()=>setCashType('Income')} className={`flex-1 py-2 rounded font-bold text-sm ${cashType==='Income'?'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300':'bg-slate-100 text-slate-400'}`}>Pemasukan</button><button type="button" onClick={()=>setCashType('Expense')} className={`flex-1 py-2 rounded font-bold text-sm ${cashType==='Expense'?'bg-rose-100 text-rose-700 ring-1 ring-rose-300':'bg-slate-100 text-slate-400'}`}>Pengeluaran</button></div></div>
                  <div><label className="block text-xs font-bold mb-1">Nominal (Rp)</label><input type="number" className="w-full p-2 border rounded" value={cashAmount} onChange={e=>setCashAmount(e.target.value)} required/></div>
                  <div><label className="block text-xs font-bold mb-1">Kategori</label><select className="w-full p-2 border rounded" value={cashCategory} onChange={e=>setCashCategory(e.target.value)}><option>Iuran Warga</option><option>Fasilitas</option><option>Kegiatan</option><option>Keamanan</option><option>Sosial</option><option>Lainnya</option></select></div>
                  <div><label className="block text-xs font-bold mb-1">Keterangan</label><input className="w-full p-2 border rounded" value={cashDesc} onChange={e=>setCashDesc(e.target.value)} required/></div>
                  <Button type="submit" className="w-full">Simpan Transaksi</Button>
              </form>
          )}
          {modalType === 'official' && (
              <form onSubmit={handleSaveOfficial} className="space-y-4">
                  <div><label className="block text-xs font-bold mb-1">Nama Lengkap</label><input className="w-full p-2 border rounded" value={offName} onChange={e=>setOffName(e.target.value)} required/></div>
                  <div><label className="block text-xs font-bold mb-1">Jabatan</label><input className="w-full p-2 border rounded" value={offRole} onChange={e=>setOffRole(e.target.value)} required placeholder="Contoh: Ketua RT"/></div>
                  <div><label className="block text-xs font-bold mb-1">No. HP</label><input className="w-full p-2 border rounded" value={offPhone} onChange={e=>setOffPhone(e.target.value)} required/></div>
                  <div><label className="block text-xs font-bold mb-1">Rumah (Blok-No)</label><input className="w-full p-2 border rounded" value={offHouse} onChange={e=>setOffHouse(e.target.value)} required placeholder="C5-01"/></div>
                  <Button type="submit" className="w-full">Simpan Data</Button>
              </form>
          )}
          {modalType === 'inventory' && (
              <form onSubmit={handleSaveInventory} className="space-y-4">
                  <div><label className="block text-xs font-bold mb-1">Nama Barang</label><input className="w-full p-2 border rounded" value={invName} onChange={e=>setInvName(e.target.value)} required/></div>
                  <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold mb-1">Total</label><input type="number" className="w-full p-2 border rounded" value={invTotal} onChange={e=>setInvTotal(e.target.value)} required/></div>
                      <div><label className="block text-xs font-bold mb-1">Tersedia</label><input type="number" className="w-full p-2 border rounded" value={invAvailable} onChange={e=>setInvAvailable(e.target.value)} required/></div>
                  </div>
                  <div><label className="block text-xs font-bold mb-1">Kondisi</label><select className="w-full p-2 border rounded" value={invCondition} onChange={e=>setInvCondition(e.target.value as any)}><option>Baik</option><option>Perlu Perbaikan</option><option>Rusak</option></select></div>
                  <div><label className="block text-xs font-bold mb-1">Catatan</label><textarea className="w-full p-2 border rounded" value={invNotes} onChange={e=>setInvNotes(e.target.value)}/></div>
                  <Button type="submit" className="w-full">Simpan</Button>
              </form>
          )}
          {modalType === 'ronda' && (
              <form onSubmit={handleSaveRonda} className="space-y-4">
                  <div><label className="block text-xs font-bold mb-1">Hari</label><input className="w-full p-2 border rounded bg-slate-100" value={rondaDay} disabled/></div>
                  <div><label className="block text-xs font-bold mb-1">Anggota (Pisahkan dengan koma)</label><textarea className="w-full p-2 border rounded h-24" value={rondaMembers} onChange={e=>setRondaMembers(e.target.value)} placeholder="Pak Budi, Pak Asep..."/></div>
                  <Button type="submit" className="w-full">Update Jadwal</Button>
              </form>
          )}
          {modalType === 'umkm' && (
              <form onSubmit={handleSaveUMKM} className="space-y-4">
                  <div><label className="block text-xs font-bold mb-1">Nama Usaha</label><input className="w-full p-2 border rounded" value={umkmName} onChange={e=>setUmkmName(e.target.value)} required/></div>
                  <div><label className="block text-xs font-bold mb-1">Pemilik</label><input className="w-full p-2 border rounded" value={umkmOwner} onChange={e=>setUmkmOwner(e.target.value)} required/></div>
                  <div><label className="block text-xs font-bold mb-1">Kategori</label><input className="w-full p-2 border rounded" value={umkmCategory} onChange={e=>setUmkmCategory(e.target.value)} required placeholder="Kuliner / Jasa / Retail"/></div>
                  <div><label className="block text-xs font-bold mb-1">Deskripsi</label><textarea className="w-full p-2 border rounded" value={umkmDesc} onChange={e=>setUmkmDesc(e.target.value)} required/></div>
                  <div><label className="block text-xs font-bold mb-1">No. WhatsApp (Format: 628...)</label><input className="w-full p-2 border rounded" value={umkmContact} onChange={e=>setUmkmContact(e.target.value)} required placeholder="628123456789"/></div>
                  <div><label className="block text-xs font-bold mb-1">URL Gambar</label><input className="w-full p-2 border rounded" value={umkmImage} onChange={e=>setUmkmImage(e.target.value)} required/></div>
                  <Button type="submit" className="w-full">Simpan Data UMKM</Button>
              </form>
          )}
          {modalType === 'import' && (
              <div className="space-y-4">
                  <p className="text-sm text-slate-600">Ditemukan {importPreview.length} data valid dari CSV. Apakah Anda yakin ingin memproses import ini? Data dengan Blok & Nomor yang sama akan ditimpa.</p>
                  <div className="bg-slate-100 p-2 rounded max-h-40 overflow-y-auto text-xs font-mono">
                      {importPreview.slice(0, 5).map((h, i) => (
                          <div key={i}>{h.block}-{h.number}: {h.headOfFamily} ({h.status})</div>
                      ))}
                      {importPreview.length > 5 && <div>... dan {importPreview.length - 5} lainnya</div>}
                  </div>
                  <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Batal</Button>
                      <Button className="flex-1" onClick={executeImport} disabled={isImporting}>{isImporting ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}{isImporting ? 'Memproses...' : 'Ya, Import Data'}</Button>
                  </div>
              </div>
          )}
          
          {modalType === 'editHouse' && selectedHouse && (
              <form onSubmit={handleSaveHouse} className="space-y-5">
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="bg-white p-3 rounded-full border shadow-sm">
                          <Home size={24} className="text-slate-700"/>
                      </div>
                      <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kavling Rumah</p>
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedHouse.block}-{selectedHouse.number}</h3>
                      </div>
                  </div>

                  {/* VISUAL STATUS SELECTOR */}
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Status Kepemilikan & Hunian</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                                  onClick={() => setEditHouseForm({...editHouseForm, unifiedStatus: option.id as any})}
                                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center h-24 ${
                                      editHouseForm.unifiedStatus === option.id 
                                      ? `${option.bg} ${option.border} ring-2 ring-offset-1 ring-${option.color.split('-')[1]}-400` 
                                      : 'bg-white border-slate-100 hover:border-slate-300 text-slate-400 hover:bg-slate-50'
                                  }`}
                              >
                                  <option.icon size={20} className={editHouseForm.unifiedStatus === option.id ? option.color : 'text-slate-400'}/>
                                  <span className={`text-[10px] font-bold ${editHouseForm.unifiedStatus === option.id ? option.color : 'text-slate-500'}`}>{option.label}</span>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* DYNAMIC FIELDS BASED ON STATUS */}
                  {editHouseForm.unifiedStatus !== 'Empty' && (
                      <div className="space-y-4 animate-fade-in">
                          <div>
                             <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">
                                {editHouseForm.unifiedStatus === 'Kost' ? 'Nama Penanggung Jawab / Perwakilan' : 
                                 editHouseForm.unifiedStatus === 'Business' ? 'Nama Pemilik Usaha' : 'Nama Kepala Keluarga'}
                             </label>
                             <input 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all" 
                                value={editHouseForm.headOfFamily} 
                                onChange={e=>setEditHouseForm({...editHouseForm, headOfFamily: e.target.value})}
                                placeholder="Masukkan Nama Lengkap..."
                             />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Total Penghuni</label>
                                  <div className="relative">
                                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input type="number" className="w-full pl-9 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={editHouseForm.occupants} onChange={e=>setEditHouseForm({...editHouseForm, occupants: parseInt(e.target.value)||0})}/>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">No. Handphone (WA)</label>
                                  <div className="relative">
                                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input className="w-full pl-9 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={editHouseForm.phone} onChange={e=>setEditHouseForm({...editHouseForm, phone: e.target.value})} placeholder="08..."/>
                                  </div>
                              </div>
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Status Iuran Bulanan</label>
                              <select 
                                  className={`w-full p-3 border rounded-xl outline-none font-bold text-sm ${
                                      editHouseForm.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      editHouseForm.paymentStatus === PaymentStatus.PENDING ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}
                                  value={editHouseForm.paymentStatus} 
                                  onChange={e=>setEditHouseForm({...editHouseForm, paymentStatus: e.target.value})}
                              >
                                  <option value={PaymentStatus.PAID}>Lunas</option>
                                  <option value={PaymentStatus.PENDING}>Belum Lunas</option>
                                  <option value={PaymentStatus.UNPAID}>Menunggak</option>
                              </select>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2"><Info size={14}/> Data Demografi (Jumlah)</p>
                              <div className="grid grid-cols-3 gap-3">
                                  <div><label className="text-[10px] font-bold text-pink-600 mb-1 block">Ibu Hamil</label><input type="number" min="0" className="w-full p-2 text-center border rounded-lg text-sm font-bold text-slate-700" value={editHouseForm.pregnantCount} onChange={e=>setEditHouseForm({...editHouseForm, pregnantCount: parseInt(e.target.value) || 0})}/></div>
                                  <div><label className="text-[10px] font-bold text-cyan-600 mb-1 block">Bayi</label><input type="number" min="0" className="w-full p-2 text-center border rounded-lg text-sm font-bold text-slate-700" value={editHouseForm.babyCount} onChange={e=>setEditHouseForm({...editHouseForm, babyCount: parseInt(e.target.value) || 0})}/></div>
                                  <div><label className="text-[10px] font-bold text-orange-600 mb-1 block">Balita</label><input type="number" min="0" className="w-full p-2 text-center border rounded-lg text-sm font-bold text-slate-700" value={editHouseForm.toddlerCount} onChange={e=>setEditHouseForm({...editHouseForm, toddlerCount: parseInt(e.target.value) || 0})}/></div>
                                  <div><label className="text-[10px] font-bold text-lime-600 mb-1 block">Remaja</label><input type="number" min="0" className="w-full p-2 text-center border rounded-lg text-sm font-bold text-slate-700" value={editHouseForm.teenagerCount} onChange={e=>setEditHouseForm({...editHouseForm, teenagerCount: parseInt(e.target.value) || 0})}/></div>
                                  <div><label className="text-[10px] font-bold text-purple-600 mb-1 block">Lansia</label><input type="number" min="0" className="w-full p-2 text-center border rounded-lg text-sm font-bold text-slate-700" value={editHouseForm.elderlyCount} onChange={e=>setEditHouseForm({...editHouseForm, elderlyCount: parseInt(e.target.value) || 0})}/></div>
                              </div>
                          </div>
                      </div>
                  )}

                  {editHouseForm.unifiedStatus === 'Empty' && (
                      <div className="bg-slate-100 p-6 rounded-xl border border-dashed border-slate-300 text-center">
                          <p className="text-slate-500 text-sm italic">Rumah kosong tidak memerlukan data penghuni.</p>
                      </div>
                  )}

                  <Button type="submit" className="w-full py-3.5 text-base shadow-lg shadow-slate-200 mt-2">Simpan Perubahan</Button>
              </form>
          )}

          {modalType === 'dues' && (
              <form onSubmit={handleSaveDues} className="space-y-4">
                  <div className="text-center font-bold text-lg text-brand-blue mb-4">Catat Pembayaran Iuran</div>
                  <div><label className="block text-xs font-bold mb-1">Nominal</label><input type="number" className="w-full p-2 border rounded font-bold text-lg" value={duesAmount} onChange={e=>setDuesAmount(e.target.value)}/></div>
                  <div><label className="block text-xs font-bold mb-1">Status Baru</label><select className="w-full p-2 border rounded" value={duesStatus} onChange={e=>setDuesStatus(e.target.value as any)}><option value={PaymentStatus.PAID}>Lunas</option><option value={PaymentStatus.PENDING}>Belum Lunas</option><option value={PaymentStatus.UNPAID}>Menunggak</option></select></div>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Simpan Pembayaran</Button>
              </form>
          )}
      </Modal>
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
