
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, FileText, Megaphone, AlertTriangle, User, Users, LogIn, Menu, X, 
  LayoutDashboard, CreditCard, Send, Bot, Check, Trash2, Clock, CheckCircle, XCircle, Search, Edit2, Plus,
  Shield, Phone, TrendingUp, TrendingDown, Wallet, Calendar, ChevronRight, Moon, Sun, CloudRain, 
  MoreVertical, LogOut, ChevronDown, Filter, Download, Save, RefreshCw, Image as ImageIcon, Printer,
  DollarSign, Briefcase, MapPin, Sparkles, Loader2, Store
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

const Badge: React.FC<{ children: React.ReactNode, type?: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = ({ children, type = 'default' }) => {
  const styles = {
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-rose-100 text-rose-700 border-rose-200',
    info: 'bg-sky-100 text-sky-700 border-sky-200',
    default: 'bg-slate-100 text-slate-700 border-slate-200'
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[type]}`}>{children}</span>;
};

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

const PublicServices = () => {
  const [activeTab, setActiveTab] = useState<'surat' | 'lapor'>('surat');
  
  // Form States
  const [requestType, setRequestType] = useState<LetterRequest['type']>('Pengantar KTP');
  const [applicantName, setApplicantName] = useState('');
  const [houseId, setHouseId] = useState('');
  const [reportType, setReportType] = useState<Report['type']>('Fasilitas');
  const [reportDesc, setReportDesc] = useState('');
  const [reporterName, setReporterName] = useState('');

  const handleSubmitSurat = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct request object for PDF
    const letterData: LetterRequest = {
        id: Date.now().toString(),
        type: requestType,
        applicantName: applicantName,
        houseId: houseId,
        nik: '7271xxxxxxxxxxxx', // Placeholder for demo purposes
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
    
    generateSuratPengantar(letterData);
    alert("Permohonan berhasil! Surat pengantar telah diunduh otomatis.");
  };

  const handleSubmitLapor = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Laporan berhasil dikirim! Akan segera ditindaklanjuti.");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 mb-20">
       <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Layanan Digital</h1>
          <p className="text-slate-500">Urus surat dan laporan warga tanpa perlu antri.</p>
       </div>

       <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
             <button onClick={() => setActiveTab('surat')} className={`flex-1 py-4 text-center font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'surat' ? 'text-brand-blue bg-blue-50 border-b-2 border-brand-blue' : 'text-slate-500 hover:bg-slate-50'}`}>
                <FileText size={18}/> Buat Surat Pengantar
             </button>
             <button onClick={() => setActiveTab('lapor')} className={`flex-1 py-4 text-center font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'lapor' ? 'text-rose-500 bg-rose-50 border-b-2 border-rose-500' : 'text-slate-500 hover:bg-slate-50'}`}>
                <AlertTriangle size={18}/> Lapor Masalah
             </button>
          </div>

          <div className="p-6 md:p-10">
             {activeTab === 'surat' ? (
                <form onSubmit={handleSubmitSurat} className="space-y-6 animate-fade-in">
                   <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-sm text-blue-800 mb-6">
                      <div className="bg-blue-100 p-2 rounded-lg h-fit"><FileText size={16}/></div>
                      <div>
                         <p className="font-bold mb-1">Syarat Pengajuan:</p>
                         <ul className="list-disc pl-4 space-y-1 text-xs opacity-90">
                            <li>Lunas iuran bulanan berjalan.</li>
                            <li>Foto KTP & KK Asli (dibawa saat pengambilan).</li>
                            <li>Surat akan diunduh otomatis dalam format PDF.</li>
                         </ul>
                      </div>
                   </div>

                   <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-700 uppercase">Jenis Surat</label>
                         <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none" value={requestType} onChange={(e) => setRequestType(e.target.value as any)}>
                            <option>Pengantar KTP</option>
                            <option>Pengantar KK</option>
                            <option>Domisili</option>
                            <option>Kematian</option>
                            <option>Kelahiran</option>
                            <option>Surat Keterangan Usaha (SKU)</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-700 uppercase">Nama Pemohon</label>
                         <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none" placeholder="Sesuai KTP" value={applicantName} onChange={e => setApplicantName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-700 uppercase">Blok / No. Rumah</label>
                         <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none" placeholder="Contoh: C5-12" value={houseId} onChange={e => setHouseId(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-700 uppercase">No. WhatsApp</label>
                         <input type="tel" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none" placeholder="08..." />
                      </div>
                   </div>
                   
                   <div className="pt-4">
                      <Button type="submit" className="w-full py-4 text-base shadow-lg shadow-blue-200 hover:-translate-y-1"><Download size={20}/> Unduh Surat Pengantar</Button>
                   </div>
                </form>
             ) : (
                <form onSubmit={handleSubmitLapor} className="space-y-6 animate-fade-in">
                   <div className="bg-rose-50 p-4 rounded-xl flex gap-3 text-sm text-rose-800 mb-6">
                      <div className="bg-rose-100 p-2 rounded-lg h-fit"><Shield size={16}/></div>
                      <p>Identitas pelapor akan dirahasiakan jika Anda memilih opsi anonim.</p>
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Jenis Laporan</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         {['Keamanan', 'Kebersihan', 'Fasilitas', 'Lainnya'].map((type) => (
                            <button key={type} type="button" onClick={() => setReportType(type as any)} className={`p-3 rounded-xl border text-sm font-medium transition-all ${reportType === type ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                               {type}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Deskripsi Masalah</label>
                      <textarea required rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" placeholder="Ceritakan kronologi atau detail masalah..." value={reportDesc} onChange={e => setReportDesc(e.target.value)}></textarea>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Nama Pelapor (Opsional)</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" placeholder="Kosongkan jika ingin anonim" value={reporterName} onChange={e => setReporterName(e.target.value)} />
                   </div>

                   <div className="pt-4">
                      <Button type="submit" variant="danger" className="w-full py-4 text-base shadow-lg shadow-rose-200 hover:-translate-y-1">Kirim Laporan</Button>
                   </div>
                </form>
             )}
          </div>
       </div>
    </div>
  );
};

const PublicUMKM = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(MOCK_UMKM.map(u => u.category)))];
  const filteredUMKM = MOCK_UMKM.filter(u => 
    (category === 'All' || u.category === category) &&
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 mb-20">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
         <div>
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">UMKM Warga</h1>
            <p className="text-slate-500">Dukung ekonomi tetangga dengan berbelanja di lingkungan sendiri.</p>
         </div>
         <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                  type="text" 
                  placeholder="Cari produk..." 
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue w-full sm:w-64"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <select 
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue"
                value={category}
                onChange={e => setCategory(e.target.value)}
             >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredUMKM.map(umkm => (
            <div key={umkm.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group flex flex-col h-full animate-fade-in">
               <div className="h-48 overflow-hidden relative">
                  <img src={umkm.image} alt={umkm.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-slate-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                     {umkm.category}
                  </span>
               </div>
               <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{umkm.name}</h3>
                  <p className="text-slate-500 text-xs mb-3 flex items-center gap-1"><User size={12}/> {umkm.owner}</p>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">{umkm.description}</p>
                  <a 
                    href={`https://wa.me/${umkm.contact}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-auto w-full py-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-white transition-all"
                  >
                     <Phone size={18}/> Pesan via WhatsApp
                  </a>
               </div>
            </div>
         ))}
         {filteredUMKM.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
               <Store size={48} className="mx-auto mb-4 opacity-20"/>
               <p>Tidak ada UMKM yang ditemukan.</p>
            </div>
         )}
      </div>
    </div>
  );
};

const PublicInfo = ({ officials, announcements, ronda }: { officials: Official[], announcements: Announcement[], ronda: RondaSchedule[] }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 mb-20">
       <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Informasi RT</h1>
          <p className="text-slate-500">Transparansi data dan struktur organisasi lingkungan.</p>
       </div>

       <div className="grid md:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-8">
             <Card title="Struktur Pengurus RT" className="overflow-hidden">
                <div className="grid sm:grid-cols-2 gap-4">
                   {officials.map(official => (
                      <div key={official.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-blue/30 transition-colors">
                         <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-sm shrink-0 overflow-hidden">
                            {official.photo ? (
                                <img src={official.photo} alt={official.name} className="w-full h-full object-cover"/>
                            ) : (
                                <User size={24}/>
                            )}
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-brand-blue uppercase tracking-wider mb-0.5">{official.role}</p>
                            <h4 className="font-bold text-slate-800">{official.name}</h4>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Home size={10}/> {official.houseId}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </Card>

             <Card title="Informasi Lingkungan">
                <div className="space-y-4">
                   <div className="flex gap-4 items-start">
                      <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0"><MapPin size={20}/></div>
                      <div>
                         <h4 className="font-bold text-slate-800 text-sm">Alamat Sekretariat</h4>
                         <p className="text-slate-600 text-sm mt-1">{RT_ADDRESS}</p>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start">
                      <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 shrink-0"><DollarSign size={20}/></div>
                      <div>
                         <h4 className="font-bold text-slate-800 text-sm">Iuran Wajib</h4>
                         <p className="text-slate-600 text-sm mt-1">Rp 25.000 / Bulan (Keamanan + Sampah)</p>
                         <p className="text-xs text-slate-400 mt-1">*Pembayaran paling lambat tanggal 10 setiap bulan.</p>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start">
                      <div className="bg-amber-100 p-2 rounded-lg text-amber-600 shrink-0"><Trash2 size={20}/></div>
                      <div>
                         <h4 className="font-bold text-slate-800 text-sm">Jadwal Pengangkutan Sampah</h4>
                         <p className="text-slate-600 text-sm mt-1">Senin & Kamis (Pagi, Pukul 07.00 - 09.00 WITA)</p>
                      </div>
                   </div>
                </div>
             </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
             <Card title="Jadwal Ronda">
                <div className="space-y-2">
                   {ronda.map(r => (
                      <div key={r.day} className="text-sm">
                         <div className="flex justify-between font-medium text-slate-700 mb-1">
                            <span>{r.day}</span>
                            <span className="text-slate-400 text-xs">{r.members.length} Orang</span>
                         </div>
                         <p className="text-xs text-slate-500 truncate">{r.members.join(', ')}</p>
                         <div className="h-px bg-slate-100 my-2"></div>
                      </div>
                   ))}
                </div>
             </Card>
          </div>
       </div>
    </div>
  );
};

// --- Admin Views ---

const AdminDashboard = ({ 
  houses, setHouses, 
  announcements, setAnnouncements,
  cashFlow, setCashFlow,
  officials, setOfficials
}: any) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [letters, setLetters] = useState(INITIAL_LETTERS);
  const [reports, setReports] = useState(INITIAL_REPORTS);
  
  // States for CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add'|'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form states for Officials
  const [formOfficial, setFormOfficial] = useState<Partial<Official>>({});
  
  // Finance Form
  const [financeForm, setFinanceForm] = useState({ description: '', amount: '', type: 'Income', category: 'Lainnya' });

  // Announcement Form
  const [announcementForm, setAnnouncementForm] = useState<Partial<Announcement>>({ title: '', content: '', type: 'General' });
  const [isGenerating, setIsGenerating] = useState(false);

  // Stats
  const totalWarga = houses.reduce((acc: number, curr: House) => acc + curr.occupants, 0);
  const kasMasuk = cashFlow.filter((c: CashFlow) => c.type === 'Income').reduce((acc: number, curr: CashFlow) => acc + curr.amount, 0);
  const kasKeluar = cashFlow.filter((c: CashFlow) => c.type === 'Expense').reduce((acc: number, curr: CashFlow) => acc + curr.amount, 0);
  const saldo = kasMasuk - kasKeluar;

  const handleAddOfficial = () => {
    setFormOfficial({});
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleEditOfficial = (official: Official) => {
    setFormOfficial(official);
    setSelectedItem(official);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const deleteOfficial = (id: string) => {
      if(confirm("Apakah Anda yakin ingin menghapus data pengurus ini?")) {
          setOfficials(officials.filter((o: Official) => o.id !== id));
      }
  };

  const saveOfficial = () => {
    if (!formOfficial.name || !formOfficial.role) {
        alert("Nama dan Jabatan wajib diisi!");
        return;
    }
    
    if (modalMode === 'add') {
        const newOfficial = {
            ...formOfficial,
            id: Date.now().toString(),
            // Ensure photo is valid or undefined
            photo: formOfficial.photo || undefined 
        } as Official;
        setOfficials([...officials, newOfficial]);
    } else {
        const updated = officials.map((o: Official) => 
            o.id === selectedItem.id ? { ...o, ...formOfficial } : o
        );
        setOfficials(updated);
    }
    setIsModalOpen(false);
  };

  const addTransaction = () => {
    if (!financeForm.description || !financeForm.amount) return;
    const newTx = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description: financeForm.description,
      amount: parseInt(financeForm.amount),
      type: financeForm.type,
      category: financeForm.category
    };
    setCashFlow([newTx, ...cashFlow]);
    setFinanceForm({ description: '', amount: '', type: 'Income', category: 'Lainnya' });
  };

  const deleteTransaction = (id: string) => {
    if (confirm('Yakin ingin menghapus transaksi ini?')) {
      setCashFlow(cashFlow.filter((c: CashFlow) => c.id !== id));
    }
  };

  const handleDraftAI = async () => {
    if(!announcementForm.title) {
        alert("Mohon isi judul topik terlebih dahulu untuk dibuatkan drafnya.");
        return;
    }
    setIsGenerating(true);
    const draft = await generateAnnouncementDraft(announcementForm.title, "Formal");
    setAnnouncementForm(prev => ({...prev, content: draft}));
    setIsGenerating(false);
  };

  const addAnnouncement = () => {
    if (!announcementForm.title || !announcementForm.content) return;
    const newAnn = {
      id: Date.now().toString(),
      title: announcementForm.title,
      content: announcementForm.content,
      type: announcementForm.type,
      date: new Date().toISOString().split('T')[0]
    };
    setAnnouncements([newAnn, ...announcements]);
    setAnnouncementForm({ title: '', content: '', type: 'General' });
    alert('Pengumuman berhasil diterbitkan!');
  };

  const deleteAnnouncement = (id: string) => {
    if (confirm('Hapus pengumuman ini?')) {
      setAnnouncements(announcements.filter((a: Announcement) => a.id !== id));
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white border-slate-100">
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-50 text-brand-blue"><Users size={24}/></div>
                    <div><p className="text-slate-500 text-xs font-bold uppercase">Total Warga</p><p className="text-2xl font-black text-slate-800">{totalWarga}</p></div>
                 </div>
              </Card>
              <Card className="bg-white border-slate-100">
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><Wallet size={24}/></div>
                    <div><p className="text-slate-500 text-xs font-bold uppercase">Saldo Kas</p><p className="text-2xl font-black text-slate-800">Rp {(saldo/1000).toFixed(0)}k</p></div>
                 </div>
              </Card>
              <Card className="bg-white border-slate-100">
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600"><FileText size={24}/></div>
                    <div><p className="text-slate-500 text-xs font-bold uppercase">Surat Pending</p><p className="text-2xl font-black text-slate-800">{letters.filter((l:any) => l.status === 'Pending').length}</p></div>
                 </div>
              </Card>
              <Card className="bg-white border-slate-100">
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={24}/></div>
                    <div><p className="text-slate-500 text-xs font-bold uppercase">Laporan Baru</p><p className="text-2xl font-black text-slate-800">{reports.filter((r:any) => r.status === 'Baru').length}</p></div>
                 </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-4">Statistik Keuangan (Bulan Ini)</h3>
                  <div className="h-64">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cashFlow.slice(0, 7).reverse()}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                           <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false}/>
                           <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`}/>
                           <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                           <Bar dataKey="amount" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={40}/>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-4">Status Hunian</h3>
                  <div className="h-64">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie 
                              data={[
                                 {name: 'Dihuni', value: houses.filter((h: House) => h.status === 'Occupied').length},
                                 {name: 'Kosong', value: houses.filter((h: House) => h.status === 'Empty').length},
                                 {name: 'Usaha', value: houses.filter((h: House) => h.status === 'Business').length},
                              ]}
                              innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                           >
                              <Cell fill="#0EA5E9"/>
                              <Cell fill="#CBD5E1"/>
                              <Cell fill="#A855F7"/>
                           </Pie>
                           <RechartsTooltip />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 text-xs font-bold text-slate-500">
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-blue"></div> Dihuni</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Kosong</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Usaha</div>
                  </div>
               </div>
            </div>
          </div>
        );
      
      case 'warga':
         return (
            <div className="space-y-6 animate-fade-in">
               <HouseMap houses={houses} isAdmin={true} onHouseClick={(h) => alert(`Detail warga: ${h.headOfFamily}`)} />
            </div>
         );

      case 'keuangan':
         return (
            <div className="space-y-6 animate-fade-in">
               {/* Add Transaction Form */}
               <Card title="Input Transaksi Baru" className="border-l-4 border-l-brand-blue">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                     <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Keterangan</label>
                        <input type="text" className="w-full p-2 border border-slate-200 rounded-lg" value={financeForm.description} onChange={e => setFinanceForm({...financeForm, description: e.target.value})} placeholder="Contoh: Iuran Bapak Budi"/>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Nominal (Rp)</label>
                        <input type="number" className="w-full p-2 border border-slate-200 rounded-lg" value={financeForm.amount} onChange={e => setFinanceForm({...financeForm, amount: e.target.value})}/>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Tipe</label>
                        <select className="w-full p-2 border border-slate-200 rounded-lg" value={financeForm.type} onChange={e => setFinanceForm({...financeForm, type: e.target.value})}>
                           <option value="Income">Pemasukan (+)</option>
                           <option value="Expense">Pengeluaran (-)</option>
                        </select>
                     </div>
                     <Button onClick={addTransaction} className="h-[42px]"><Plus size={18}/> Tambah</Button>
                  </div>
               </Card>

               <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                           <th className="p-4 text-xs font-bold text-slate-500 uppercase">Tanggal</th>
                           <th className="p-4 text-xs font-bold text-slate-500 uppercase">Keterangan</th>
                           <th className="p-4 text-xs font-bold text-slate-500 uppercase">Kategori</th>
                           <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Nominal</th>
                           <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Aksi</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {cashFlow.map((flow: CashFlow) => (
                           <tr key={flow.id} className="hover:bg-slate-50">
                              <td className="p-4 text-sm text-slate-600">{flow.date}</td>
                              <td className="p-4 text-sm font-medium text-slate-800">{flow.description}</td>
                              <td className="p-4 text-xs"><span className="bg-slate-100 px-2 py-1 rounded text-slate-600">{flow.category}</span></td>
                              <td className={`p-4 text-sm font-bold text-right ${flow.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 {flow.type === 'Income' ? '+' : '-'} Rp {flow.amount.toLocaleString('id-ID')}
                              </td>
                              <td className="p-4 text-center">
                                 <button onClick={() => deleteTransaction(flow.id)} className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={16}/></button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         );
      
      case 'pengurus':
         return (
            <div className="space-y-6 animate-fade-in">
               <Card title="Manajemen Pengurus & Struktur Organisasi" action={
                  <Button onClick={handleAddOfficial} className="text-xs h-9"><Plus size={16}/> Tambah Pengurus</Button>
               }>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                           <tr>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Foto</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Jabatan</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Nama Lengkap</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Rumah</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Kontak</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Aksi</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {officials.map((official: Official) => (
                              <tr key={official.id} className="hover:bg-slate-50">
                                 <td className="p-4">
                                     <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                                        {official.photo ? (
                                            <img src={official.photo} alt={official.name} className="w-full h-full object-cover"/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={20}/></div>
                                        )}
                                     </div>
                                 </td>
                                 <td className="p-4 font-bold text-brand-blue text-sm">{official.role}</td>
                                 <td className="p-4 text-sm font-medium text-slate-800">{official.name}</td>
                                 <td className="p-4 text-sm text-slate-600">{official.houseId}</td>
                                 <td className="p-4 text-sm text-slate-600">{official.phone}</td>
                                 <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => handleEditOfficial(official)} className="p-2 bg-slate-100 hover:bg-brand-blue hover:text-white rounded-lg transition-colors">
                                            <Edit2 size={16}/>
                                        </button>
                                        <button onClick={() => deleteOfficial(official.id)} className="p-2 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-lg transition-colors">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                           {officials.length === 0 && (
                               <tr>
                                   <td colSpan={6} className="p-8 text-center text-slate-400 italic">Belum ada data pengurus. Silakan tambah data baru.</td>
                               </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </Card>
            </div>
         );

      case 'pengumuman':
        return (
          <div className="space-y-6 animate-fade-in">
            <Card title="Buat Pengumuman Baru" className="border-l-4 border-l-brand-blue">
               <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Judul Topik</label>
                    <input type="text" className="w-full p-2 border border-slate-200 rounded-lg" value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} placeholder="Contoh: Kerja Bakti Minggu Ini"/>
                 </div>
                 
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Isi Pengumuman</label>
                        <button 
                            onClick={handleDraftAI} 
                            disabled={isGenerating}
                            className="text-[10px] flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 disabled:opacity-50 transition-colors"
                        >
                            {isGenerating ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>}
                            {isGenerating ? "Sedang Menulis..." : "Buat Draf dengan AI"}
                        </button>
                    </div>
                    <textarea rows={4} className="w-full p-2 border border-slate-200 rounded-lg" value={announcementForm.content} onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} placeholder="Ketik isi pengumuman atau gunakan tombol AI untuk membuat draf otomatis..."/>
                 </div>

                 <div className="flex gap-4">
                    <div className="flex-1">
                       <label className="text-xs font-bold text-slate-500 uppercase">Tipe</label>
                       <select className="w-full p-2 border border-slate-200 rounded-lg" value={announcementForm.type} onChange={e => setAnnouncementForm({...announcementForm, type: e.target.value as any})}>
                          <option value="General">General (Umum)</option>
                          <option value="Urgent">Urgent (Penting)</option>
                          <option value="Event">Event (Kegiatan)</option>
                       </select>
                    </div>
                    <div className="flex items-end">
                       <Button onClick={addAnnouncement} className="h-[42px]"><Send size={18}/> Terbitkan</Button>
                    </div>
                 </div>
               </div>
            </Card>

            <div className="grid gap-4">
              {announcements.map((ann: Announcement) => (
                <div key={ann.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ann.type === 'Urgent' ? 'bg-rose-100 text-rose-600' : ann.type === 'Event' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>{ann.type}</span>
                      <span className="text-xs text-slate-400">{ann.date}</span>
                    </div>
                    <h4 className="font-bold text-slate-800">{ann.title}</h4>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{ann.content}</p>
                  </div>
                  <button onClick={() => deleteAnnouncement(ann.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div>Halaman belum tersedia</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-300 fixed h-full z-30 hidden lg:block">
         <div className="p-6">
            <div className="flex items-center gap-2 font-bold text-white mb-8">
               <div className="bg-brand-blue p-1.5 rounded-lg"><Shield size={20}/></div>
               Admin Panel
            </div>
            <nav className="space-y-1">
               <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-brand-blue text-white shadow-lg shadow-blue-900/20' : 'hover:bg-white/5'}`}>
                  <LayoutDashboard size={18}/> Dashboard
               </button>
               <button onClick={() => setActiveTab('warga')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'warga' ? 'bg-brand-blue text-white shadow-lg shadow-blue-900/20' : 'hover:bg-white/5'}`}>
                  <Home size={18}/> Data Warga
               </button>
               <button onClick={() => setActiveTab('keuangan')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'keuangan' ? 'bg-brand-blue text-white shadow-lg shadow-blue-900/20' : 'hover:bg-white/5'}`}>
                  <DollarSign size={18}/> Keuangan
               </button>
               <button onClick={() => setActiveTab('pengumuman')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'pengumuman' ? 'bg-brand-blue text-white shadow-lg shadow-blue-900/20' : 'hover:bg-white/5'}`}>
                  <Megaphone size={18}/> Pengumuman
               </button>
               <button onClick={() => setActiveTab('pengurus')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'pengurus' ? 'bg-brand-blue text-white shadow-lg shadow-blue-900/20' : 'hover:bg-white/5'}`}>
                  <User size={18}/> Pengurus (Info)
               </button>
            </nav>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
         <header className="bg-white border-b border-slate-100 px-8 py-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h2>
            <div className="flex items-center gap-4">
               <span className="text-sm font-medium text-slate-500">Hi, Pak RT</span>
               <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">RT</div>
            </div>
         </header>
         <main className="p-8">
            {renderContent()}
         </main>
      </div>

      {/* Edit Modal for Officials */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? 'Tambah Pengurus Baru' : 'Edit Data Pengurus'}>
         <div className="space-y-4">
            <div>
               <label className="block text-xs font-bold uppercase mb-1">Nama Lengkap</label>
               <input type="text" className="w-full p-2 border rounded-lg" value={formOfficial.name || ''} onChange={e => setFormOfficial({...formOfficial, name: e.target.value})}/>
            </div>
            <div>
               <label className="block text-xs font-bold uppercase mb-1">Jabatan</label>
               <input type="text" className="w-full p-2 border rounded-lg" placeholder="Contoh: Ketua RT, Sekretaris, Seksi Keamanan" value={formOfficial.role || ''} onChange={e => setFormOfficial({...formOfficial, role: e.target.value})}/>
            </div>
            <div>
               <label className="block text-xs font-bold uppercase mb-1">Alamat Rumah (Blok/No)</label>
               <input type="text" className="w-full p-2 border rounded-lg" value={formOfficial.houseId || ''} onChange={e => setFormOfficial({...formOfficial, houseId: e.target.value})}/>
            </div>
            <div>
               <label className="block text-xs font-bold uppercase mb-1">Nomor Telepon</label>
               <input type="text" className="w-full p-2 border rounded-lg" value={formOfficial.phone || ''} onChange={e => setFormOfficial({...formOfficial, phone: e.target.value})}/>
            </div>
             <div>
               <label className="block text-xs font-bold uppercase mb-1">Link Foto (Opsional)</label>
               <input type="text" className="w-full p-2 border rounded-lg" placeholder="https://..." value={formOfficial.photo || ''} onChange={e => setFormOfficial({...formOfficial, photo: e.target.value})}/>
               <p className="text-[10px] text-slate-400 mt-1">Kosongkan jika tidak ada foto.</p>
            </div>
            <div className="pt-4 flex justify-end gap-2">
               <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
               <Button onClick={saveOfficial}>Simpan Perubahan</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};


// --- Main App Component ---

const App = () => {
  // State Initialization with LocalStorage Persistence
  const [houses, setHouses] = useState<House[]>(() => {
    const saved = localStorage.getItem('houses');
    return saved ? JSON.parse(saved) : generateHouses();
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('announcements');
    return saved ? JSON.parse(saved) : MOCK_ANNOUNCEMENTS;
  });

  const [cashFlow, setCashFlow] = useState<CashFlow[]>(() => {
    const saved = localStorage.getItem('cashFlow');
    return saved ? JSON.parse(saved) : MOCK_CASHFLOW;
  });

  const [officials, setOfficials] = useState<Official[]>(() => {
    const saved = localStorage.getItem('officials');
    return saved ? JSON.parse(saved) : INITIAL_OFFICIALS;
  });
  
  const [ronda, setRonda] = useState<RondaSchedule[]>(() => {
     const saved = localStorage.getItem('ronda');
     return saved ? JSON.parse(saved) : MOCK_RONDA;
  });

  // Persist Data Effects
  useEffect(() => { localStorage.setItem('houses', JSON.stringify(houses)); }, [houses]);
  useEffect(() => { localStorage.setItem('announcements', JSON.stringify(announcements)); }, [announcements]);
  useEffect(() => { localStorage.setItem('cashFlow', JSON.stringify(cashFlow)); }, [cashFlow]);
  useEffect(() => { localStorage.setItem('officials', JSON.stringify(officials)); }, [officials]);
  useEffect(() => { localStorage.setItem('ronda', JSON.stringify(ronda)); }, [ronda]);

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-brand-blue/20">
      <Routes>
        <Route path="/admin/*" element={
          <AdminRouteWrapper isAdmin={true} onLogin={() => {}}>
             <AdminDashboard 
                houses={houses} setHouses={setHouses}
                announcements={announcements} setAnnouncements={setAnnouncements}
                cashFlow={cashFlow} setCashFlow={setCashFlow}
                officials={officials} setOfficials={setOfficials}
             />
          </AdminRouteWrapper>
        }/>
        <Route path="*" element={
          <>
            <PublicHeader />
            <Routes>
              <Route path="/" element={<PublicHome houses={houses} announcements={announcements} ronda={ronda} />} />
              <Route path="/services" element={<PublicServices />} />
              <Route path="/umkm" element={<PublicUMKM />} />
              <Route path="/info" element={<PublicInfo officials={officials} announcements={announcements} ronda={ronda} />} />
            </Routes>
            
            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-12 mt-auto">
               <div className="max-w-7xl mx-auto px-6 text-center">
                  <Logo />
                  <p className="mt-4 text-slate-500 text-sm">
                    &copy; 2024 RT 002 RW 020 Kelurahan Tondo. <br/>
                    Dikembangkan dengan ❤️ untuk warga.
                  </p>
               </div>
            </footer>
            
            {/* Global Floating Elements */}
            <PanicButton />
            <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
          </>
        }/>
      </Routes>
    </div>
  );
};

export default () => (
  <HashRouter>
    <App />
  </HashRouter>
);