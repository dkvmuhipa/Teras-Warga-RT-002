
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { 
  Home, FileText, Megaphone, AlertTriangle, User, Users, Menu, X, 
  LayoutDashboard, Send, Bot, Trash2, Clock, CheckCircle, XCircle, Search, Edit2, Plus,
  Shield, Phone, Wallet, Moon, Sun, CloudRain, 
  LogOut, Download, Package, ShoppingBag,
  ArrowUpRight, ArrowDownRight, ShieldCheck, FileDown, Target, HelpCircle, MapPin as MapIcon,
  Briefcase, Store, Archive, History, BarChart3, Grid, List, Upload, Printer,
  RefreshCw, Calendar, DollarSign, Settings, Filter, MoreHorizontal, Heart, Baby, Smile, GraduationCap, Accessibility, Key, UserCheck, MessageCircle, ImageIcon, Link as LinkIcon, AlertCircle, Wrench, Battery, BatteryMedium, BatteryWarning, ChevronRight,
  Database, Lock, Eye, EyeOff, Save, Trash, Sparkles, Loader2, CheckSquare, Bell, Vote, BarChart2, PieChart, LocateFixed, Navigation, ShoppingCart, Repeat
} from 'lucide-react';
import { CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, BarChart, Bar, Cell, Legend } from 'recharts';

// Destructure React Router DOM components
const { HashRouter, Routes, Route, useNavigate, useLocation, useSearchParams } = ReactRouterDOM;

// Components & Services
import { Logo, generateHouses, MOCK_ANNOUNCEMENTS, MOCK_UMKM, MOCK_RONDA, MOCK_CASHFLOW, MOCK_GALLERY, INITIAL_OFFICIALS, DEFAULT_PDF_CONFIG, MOCK_INVENTORY, INITIAL_REPORTS, INITIAL_LETTERS, MOCK_POLLS, MOCK_RONDA_LOGS, MOCK_MARKET_ITEMS } from './constants';
import { House, Announcement, Report, LetterRequest, PaymentStatus, UMKM, CashFlow, Official, RondaSchedule, PdfConfig, InventoryItem, AppNotification, Poll, PollOption, RondaCheckLog, MarketItem } from './types';
import { HouseMap } from './components/HouseMap';
import { generateAnnouncementDraft, generateDashboardSummary } from './services/geminiService';
import { generateSuratPengantar, generateResidentReportPDF } from './services/pdfService';
import { AdminRouteWrapper } from './components/AdminComponents'; 
import { ChatBot } from './components/ChatBot';

// Firebase imports
import { isFirebaseConfigured, auth } from './services/firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";
import { 
  subscribeToCollection, 
  subscribeToNotifications,
  subscribeToActiveReports,
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

// --- Shared Components ---
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success', size?: 'sm' | 'md' | 'lg' }> = ({ children, variant = 'primary', size = 'md', className, ...props }) => {
  const base = "rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
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

// --- NOTIFICATION COMPONENTS ---
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
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-brand-blue transition-colors">
                <Bell size={20}/>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in origin-top-right">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h4 className="font-bold text-sm text-slate-800">Notifikasi</h4>
                        {unreadCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full">{unreadCount} Baru</span>}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? notifications.map(n => (
                            <div key={n.id} onClick={() => onMarkRead(n.id)} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${n.isRead ? 'opacity-60' : 'bg-blue-50/30'}`}>
                                <div className="flex gap-3">
                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === 'Alert' ? 'bg-rose-500' : n.type === 'Success' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                    <div>
                                        <h5 className={`text-xs font-bold ${n.isRead ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</h5>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                                        <p className="text-[10px] text-slate-400 mt-2">{new Date(n.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-slate-400 text-xs italic">
                                Belum ada notifikasi.
                            </div>
                        )}
                    </div>
                </div>
            )}
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
    { path: '/voting', icon: Vote, label: 'Voting' }, 
    { path: '/market', icon: ShoppingCart, label: 'Pasar' },
    { path: '/services', icon: FileText, label: 'Layanan' },
    { path: '/info', icon: Shield, label: 'Info' },
  ];
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

const PublicHeader = ({ notifications, onMarkRead }: { notifications: AppNotification[], onMarkRead: (id: string) => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? "text-brand-blue bg-blue-50" : "text-slate-600 hover:text-brand-blue";
  
  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}><Logo /></div>
            <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center space-x-1 mr-4">
                  <button onClick={() => navigate('/')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/')}`}>Beranda</button>
                  <button onClick={() => navigate('/voting')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/voting')}`}>E-Voting</button>
                  <button onClick={() => navigate('/market')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/market')}`}>Pasar Warga</button>
                  <button onClick={() => navigate('/services')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/services')}`}>Layanan</button>
                  <button onClick={() => navigate('/umkm')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/umkm')}`}>UMKM</button>
                  <button onClick={() => navigate('/info')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/info')}`}>Info RT</button>
                </div>
                <NotificationCenter notifications={notifications} onMarkRead={onMarkRead} />
                <div className="hidden md:block h-6 w-px bg-slate-200 mx-2"></div>
                <Button onClick={() => navigate('/admin')} variant="outline" className="hidden md:flex ml-2 text-xs h-9">Login Admin</Button>
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
                    <p className="text-3xl md:text-4xl font-black tracking-tighter">{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-[10px] md:text-xs font-medium text-blue-100 uppercase tracking-widest">{date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
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

const PublicHome = ({ houses, announcements, ronda, reports, officials }: any) => {
  const navigate = useNavigate();
  const dateObj = new Date();
  const today = dateObj.toLocaleDateString('id-ID', {weekday:'long'});
  const fullDate = dateObj.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
  const todayRonda = ronda.find((r:any) => r.day === today);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 animate-fade-in mb-20 md:mb-20">
      <HeroSection />
      <div className="flex overflow-x-auto gap-4 pb-4 -mt-2 md:-mt-4 relative z-10 px-1 no-scrollbar snap-x">
        {[{ label: 'Buat Surat', icon: FileText, color: 'text-brand-blue', bg: 'bg-blue-50', link: '/services' }, { label: 'Pasar Warga', icon: ShoppingCart, color: 'text-emerald-500', bg: 'bg-emerald-50', link: '/market' }, { label: 'E-Voting', icon: Vote, color: 'text-indigo-500', bg: 'bg-indigo-50', link: '/voting' }, { label: 'Lapor Warga', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50', link: '/services?tab=lapor' }].map((action, idx) => (
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
                {announcements.map((ann:any) => (
                    <div key={ann.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide ${ann.type === 'Urgent' ? 'bg-rose-100 text-rose-600' : ann.type === 'Event' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>{ann.type}</span>
                        <span className="text-[10px] md:text-xs text-slate-400 font-medium flex items-center gap-1"><Clock size={12} /> {new Date(ann.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-slate-800 mb-2">{ann.title}</h3>
                    <p className="text-slate-600 leading-relaxed text-xs md:text-sm whitespace-pre-line">{ann.content}</p>
                    </div>
                ))}
                {announcements.length === 0 && <div className="text-center p-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm italic">Belum ada pengumuman terbaru.</div>}
                </div>
            </div>
        </div>
        <div className="space-y-6 md:space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Card title="Ronda Malam Ini" className="bg-gradient-to-b from-slate-800 to-slate-900 text-white border-0 shadow-lg shadow-slate-300 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Moon size={120} />
             </div>
             <div className="mb-4 pb-4 border-b border-white/10 relative z-10 flex justify-between items-end">
                <div>
                   <p className="text-3xl font-black text-emerald-400 leading-none mb-1">{today}</p>
                   <p className="text-xs text-slate-400 font-medium flex items-center gap-1"><Calendar size={12}/> {fullDate}</p>
                </div>
                <div className="bg-white/10 px-3 py-1 rounded-lg">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Shift</span>
                </div>
             </div>
             <div className="space-y-3 relative z-10">
               {todayRonda && todayRonda.members.length > 0 ? todayRonda.members.map((member:any, i:any) => (
                   <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                       <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">{i+1}</div>
                       <span className="font-medium text-sm">{member}</span>
                   </div>
               )) : <p className="text-slate-400 text-sm italic py-4 text-center border border-dashed border-slate-700 rounded-xl">Jadwal belum diatur.</p>}
             </div>
             <div className="mt-6 pt-4 border-t border-white/10 text-center relative z-10">
                <button onClick={() => navigate('/info')} className="text-xs font-bold text-blue-200 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto">
                    Lihat Jadwal Lengkap <ChevronRight size={12}/>
                </button>
             </div>
          </Card>
          <Card title="Galeri Kegiatan">
             {MOCK_GALLERY.length > 0 ? (
                 <div className="grid grid-cols-2 gap-2">{MOCK_GALLERY.slice(0,4).map((item: any) => (<div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"><img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2"><span className="text-[10px] text-white font-medium line-clamp-1">{item.title}</span></div></div>))}</div>
             ) : (
                <div className="text-center py-6 text-slate-400 text-sm italic border-dashed border-2 border-slate-100 rounded-xl">Galeri masih kosong</div>
             )}
          </Card>
        </div>
      </div>
    </div>
  );
};

const PublicVoting = ({ polls }: { polls: Poll[] }) => {
    const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
    
    useEffect(() => {
        const loaded = new Set<string>();
        polls.forEach(p => {
            if (localStorage.getItem(`voted_poll_${p.id}`)) {
                loaded.add(p.id);
            }
        });
        setVotedPolls(loaded);
    }, [polls]);

    const handleVote = async (pollId: string, optionId: string, options: PollOption[]) => {
        if (votedPolls.has(pollId)) return;
        if (confirm("Apakah Anda yakin dengan pilihan Anda? Pilihan tidak dapat diubah.")) {
            await submitVote(pollId, optionId, options);
            localStorage.setItem(`voted_poll_${pollId}`, 'true');
            setVotedPolls(prev => new Set(prev).add(pollId));
            alert("Terima kasih! Suara Anda telah direkam.");
        }
    };

    const activePolls = polls.filter(p => p.status === 'Open');
    const closedPolls = polls.filter(p => p.status === 'Closed');

    const renderPollCard = (poll: Poll) => {
        const hasVoted = votedPolls.has(poll.id);
        const isClosed = poll.status === 'Closed';
        const total = poll.totalVotes || 1;
        return (
            <div key={poll.id} className={`bg-white rounded-3xl p-6 border shadow-sm transition-all ${isClosed ? 'border-slate-100 opacity-90' : 'border-indigo-100 shadow-indigo-100 ring-1 ring-indigo-50'}`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${isClosed ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-600 animate-pulse'}`}>
                                 {isClosed ? 'Selesai' : 'Sedang Berlangsung'}
                             </span>
                             <span className="text-xs text-slate-400">Berakhir: {new Date(poll.deadline).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 leading-tight">{poll.title}</h3>
                    </div>
                    {hasVoted && <div className="bg-emerald-50 text-emerald-600 p-2 rounded-full"><CheckCircle size={20}/></div>}
                </div>
                <p className="text-sm text-slate-600 mb-6">{poll.description}</p>
                <div className="space-y-3">
                    {poll.options.map((opt) => {
                        const percent = Math.round((opt.votes / total) * 100) || 0;
                        return (
                            <div key={opt.id} className="relative group">
                                {(!hasVoted && !isClosed) ? (
                                    <button 
                                        onClick={() => handleVote(poll.id, opt.id, poll.options)}
                                        className="w-full p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-left transition-all active:scale-95 flex justify-between items-center group-hover:shadow-md"
                                    >
                                        <span className="font-bold text-slate-700 text-sm group-hover:text-indigo-700">{opt.text}</span>
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-indigo-500"></div>
                                    </button>
                                ) : (
                                    <div className="relative w-full p-4 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                                        <div className="absolute inset-0 bg-indigo-100 origin-left transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                                        <div className="relative flex justify-between items-center z-10">
                                            <span className="font-bold text-slate-800 text-sm">{opt.text}</span>
                                            <span className="text-xs font-bold text-slate-600">{opt.votes} Suara ({percent}%)</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 text-right">
                    <p className="text-xs text-slate-400 font-bold">{poll.totalVotes} Total Suara Masuk</p>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 mb-24 animate-fade-in">
             <div className="text-center mb-10">
                 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-widest mb-4 border border-indigo-100">
                     <Vote size={16}/> Demokrasi Digital
                 </div>
                 <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight mb-4">Suara Warga RT 002</h1>
                 <p className="text-slate-500 max-w-xl mx-auto">
                     Salurkan aspirasi Anda dalam pengambilan keputusan lingkungan. Satu suara Anda sangat berarti untuk kemajuan bersama.
                 </p>
             </div>
             <div className="space-y-8">
                 <div>
                     <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><PieChart className="text-indigo-500"/> Voting Aktif</h2>
                     {activePolls.length > 0 ? activePolls.map(renderPollCard) : <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 italic">Tidak ada voting yang sedang berlangsung.</div>}
                 </div>
                 {closedPolls.length > 0 && (
                     <div className="opacity-80 hover:opacity-100 transition-opacity">
                         <h2 className="text-xl font-black text-slate-500 mb-4 flex items-center gap-2"><History className="text-slate-400"/> Riwayat Voting</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{closedPolls.map(renderPollCard)}</div>
                     </div>
                 )}
             </div>
        </div>
    );
};

const PublicMarket = ({ items }: { items: MarketItem[] }) => {
    const [filter, setFilter] = useState('All');
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [postTitle, setPostTitle] = useState('');
    const [postDesc, setPostDesc] = useState('');
    const [postPrice, setPostPrice] = useState('');
    const [postCategory, setPostCategory] = useState<'Jual' | 'Barter' | 'Gratis'>('Jual');
    const [postSeller, setPostSeller] = useState('');
    const [postContact, setPostContact] = useState('');
    const [postImage, setPostImage] = useState('');
    const [postHouseId, setPostHouseId] = useState('');
    const [accessCode, setAccessCode] = useState('');

    const filteredItems = items.filter(item => {
        const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'All' || item.category === filter;
        return matchSearch && matchFilter && item.status === 'Available';
    });

    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isValid = await validateResidentAccess(postHouseId, accessCode);
        if (!isValid) { alert("Verifikasi Gagal! Kode Akses Rumah tidak valid."); return; }
        const newItem: any = { title: postTitle, description: postDesc, price: parseInt(postPrice) || 0, category: postCategory, sellerName: postSeller, sellerContact: postContact, image: postImage, date: new Date().toISOString(), status: 'Available', houseId: postHouseId };
        await addMarketItem(newItem);
        alert("Iklan berhasil ditayangkan!");
        setIsPostModalOpen(false);
        setPostTitle(''); setPostDesc(''); setPostPrice(''); setPostSeller(''); setPostContact(''); setPostImage(''); setAccessCode(''); setPostHouseId('');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 mb-24 animate-fade-in font-sans">
            <div className="relative rounded-3xl overflow-hidden bg-emerald-900 shadow-2xl shadow-emerald-200 min-h-[250px] flex items-center justify-center text-center px-6 py-12 mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-800 opacity-90"></div>
                <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-100 text-[10px] font-bold uppercase tracking-widest shadow-lg">
                        <ShoppingCart size={14} /> Marketplace Warga
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">Bursa Warga RT 002</h1>
                    <p className="text-emerald-50 text-sm md:text-base font-medium">Jual barang bekas, barter tanaman, atau berbagi makanan. Dari warga, untuk warga.</p>
                </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 sticky top-20 z-30 bg-slate-50/80 backdrop-blur-xl p-4 rounded-3xl border border-white/50 shadow-sm">
                <div className="flex w-full md:w-auto gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {['All', 'Jual', 'Barter', 'Gratis'].map(cat => (
                        <button key={cat} onClick={() => setFilter(cat)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filter === cat ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-emerald-50'}`}>{cat === 'All' ? 'Semua' : cat}</button>
                    ))}
                </div>
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Cari barang..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={search} onChange={e => setSearch(e.target.value)}/></div>
                    <button onClick={() => setIsPostModalOpen(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"><Plus size={16}/> Pasang Iklan</button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <div key={item.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                        <div className="relative h-48 bg-slate-100 overflow-hidden"><img src={item.image || 'https://placehold.co/400x300?text=No+Image'} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/><div className="absolute top-3 left-3"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide shadow-sm backdrop-blur-md ${item.category === 'Gratis' ? 'bg-emerald-500/90 text-white' : item.category === 'Barter' ? 'bg-purple-500/90 text-white' : 'bg-blue-500/90 text-white'}`}>{item.category}</span></div></div>
                        <div className="p-4 flex-1 flex flex-col"><div className="flex justify-between items-start mb-2"><h3 className="font-bold text-slate-800 line-clamp-2 leading-tight">{item.title}</h3></div><p className="text-xs text-slate-500 mb-4 line-clamp-2">{item.description}</p><div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between"><div><p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">{item.sellerName}</p><p className={`font-black text-sm ${item.category === 'Gratis' ? 'text-emerald-600' : 'text-slate-800'}`}>{item.category === 'Gratis' ? 'GRATIS' : item.category === 'Barter' ? 'BARTER' : `Rp ${item.price.toLocaleString()}`}</p></div><a href={`https://wa.me/${item.sellerContact.replace(/^0/, '62').replace(/\D/g, '')}?text=Halo, saya tertarik dengan ${item.title} di Bursa Warga.`} target="_blank" rel="noreferrer" className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"><MessageCircle size={20}/></a></div></div>
                    </div>
                ))}
                {filteredItems.length === 0 && <div className="col-span-full py-16 text-center text-slate-400 italic bg-white rounded-3xl border border-dashed border-slate-200">Tidak ada barang yang ditemukan.</div>}
            </div>
            <Modal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} title="Pasang Iklan Bursa Warga">
                <form onSubmit={handlePostSubmit} className="space-y-4">
                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-xs text-yellow-800 mb-2">Barang yang dijual/barter harus milik sendiri dan legal. Dilarang posting barang terlarang.</div>
                    <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Kategori</label><div className="flex gap-2">{['Jual', 'Barter', 'Gratis'].map(cat => (<button type="button" key={cat} onClick={() => setPostCategory(cat as any)} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${postCategory === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{cat}</button>))}</div></div>
                    <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Judul Barang</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={postTitle} onChange={e=>setPostTitle(e.target.value)} required placeholder="Cth: Sepeda Lipat Polygon"/></div>
                    {postCategory === 'Jual' && (<div><label className="block text-xs font-bold mb-1.5 text-slate-700">Harga (Rp)</label><input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={postPrice} onChange={e=>setPostPrice(e.target.value)} required/></div>)}
                    <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Deskripsi Kondisi</label><textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm h-20" value={postDesc} onChange={e=>setPostDesc(e.target.value)} required placeholder="Jelaskan kondisi barang..."/></div>
                    <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Foto URL</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={postImage} onChange={e=>setPostImage(e.target.value)} placeholder="https://..."/></div>
                    <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold mb-1.5 text-slate-700">Nama Penjual</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={postSeller} onChange={e=>setPostSeller(e.target.value)} required placeholder="Nama Panggilan"/></div><div><label className="block text-xs font-bold mb-1.5 text-slate-700">No. WhatsApp</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={postContact} onChange={e=>setPostContact(e.target.value)} required placeholder="08..."/></div></div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-2"><h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><Lock size={14}/> Verifikasi Warga</h4><div><label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Blok Rumah Anda</label><input className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm" placeholder="Cth: C7-02" value={postHouseId} onChange={e=>setPostHouseId(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Kode Akses Rumah (PIN)</label><input type="password" placeholder="PIN Rumah Anda" className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm" value={accessCode} onChange={e=>setAccessCode(e.target.value)} required/></div></div>
                    <Button type="submit" className="w-full py-3">Tayangkan Iklan</Button>
                </form>
            </Modal>
        </div>
    );
};

const PublicServices = ({ pdfConfig }: { pdfConfig: PdfConfig }) => {
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') === 'lapor' ? 'lapor' : 'surat';
    const initialHouseId = searchParams.get('houseId') || '';
    const [activeTab, setActiveTab] = useState<'surat' | 'lapor' | 'history'>(initialTab as any);
    const [localHistory, setLocalHistory] = useState<any[]>([]);
    const [accessCode, setAccessCode] = useState('');
    
    useEffect(() => { try { const stored = localStorage.getItem('userRequestHistory'); if (stored) setLocalHistory(JSON.parse(stored)); } catch (e) { console.error("Error reading history", e); } }, []);
    useEffect(() => { if(initialHouseId) { if (activeTab === 'lapor') setReportHouseId(initialHouseId); if (activeTab === 'surat') setHouseId(initialHouseId); } }, [initialHouseId, activeTab]);
  
    const saveToHistory = (item: any) => { try { const updated = [item, ...localHistory]; setLocalHistory(updated); localStorage.setItem('userRequestHistory', JSON.stringify(updated)); } catch (e) { console.error("Error saving history", e); } };
    const [reportType, setReportType] = useState<Report['type']>('Fasilitas');
    const [reportDesc, setReportDesc] = useState('');
    const [reporterName, setReporterName] = useState('');
    const [reportHouseId, setReportHouseId] = useState(initialHouseId); 
    const [reporterHouseId, setReporterHouseId] = useState('');

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
        const isValid = await validateResidentAccess(houseId, accessCode);
        if (!isValid) { alert("Verifikasi Gagal! Kode Akses Rumah tidak valid."); return; }
        const letterData: LetterRequest = { id: Date.now().toString(), type: requestType, applicantName, nik, familyHeadName, birthPlace, birthDate, gender, religion, job, maritalStatus, nationality, addressKtp, houseId, purposeDetail, status: 'Pending', date: new Date().toISOString().split('T')[0] }; 
        generateSuratPengantar(letterData, pdfConfig, true); 
        await addLetterToDb(letterData); 
        saveToHistory({...letterData, category: 'Surat', title: `Surat ${requestType}`}); 
        alert("Permohonan berhasil dikirim!"); 
        setApplicantName(''); setNik(''); setFamilyHeadName(''); setBirthPlace(''); setBirthDate(''); setJob(''); setAddressKtp(''); setHouseId(''); setPurposeDetail(''); setAccessCode('');
    };

    const handleSubmitLapor = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        const isValid = await validateResidentAccess(reporterHouseId, accessCode);
        if (!isValid) { alert("Verifikasi Pelapor Gagal! Kode Akses tidak cocok."); return; }
        const newReport: any = { type: reportType, description: reportDesc, reporterName: reporterName || "Anonim", date: new Date().toISOString().split('T')[0], status: 'Baru', houseId: reportHouseId ? reportHouseId.toUpperCase() : undefined }; 
        await addReportToDb(newReport); 
        await addNotificationToDb({ title: `Laporan Warga: ${reportType}`, message: reportDesc, date: new Date().toISOString(), type: 'Alert', target: 'All', isRead: false });
        saveToHistory({...newReport, category: 'Laporan', title: `Laporan ${newReport.type}`}); 
        alert("Laporan berhasil dikirim!"); 
        setReportDesc(''); setReporterName(''); setReportHouseId(''); setReporterHouseId(''); setAccessCode('');
    };
    
    const clearHistory = () => { if(confirm("Hapus riwayat lokal?")) { setLocalHistory([]); localStorage.removeItem('userRequestHistory'); } }
    const reportTags = [{label: "Lampu Mati", icon: CloudRain}, {label: "Sampah Numpuk", icon: Trash2}, {label: "Selokan Mampet", icon: ArrowDownRight}, {label: "Hewan Liar", icon: AlertTriangle}, {label: "Orang Asing", icon: User}];
  
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-20">
         <div className="text-center mb-8 md:mb-10"><span className="inline-block px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-[10px] font-bold uppercase tracking-wider mb-2">Pusat Layanan Warga</span><h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Layanan Digital RT 002</h1><p className="text-sm md:text-base text-slate-500 mt-2 max-w-xl mx-auto">Sistem pelayanan mandiri untuk warga RT 002.</p></div>
         <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[600px]">
            <div className="w-full md:w-72 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-4 md:p-6 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar snap-x">
               <button onClick={() => setActiveTab('surat')} className={`flex-none min-w-[140px] md:min-w-0 p-4 rounded-2xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'surat' ? 'bg-white text-brand-blue shadow-lg shadow-blue-100 ring-1 ring-blue-100' : 'hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800'}`}><div className={`p-2 rounded-xl ${activeTab==='surat' ? 'bg-blue-50' : 'bg-slate-100'}`}><FileText size={20} className="shrink-0" /></div><div><span className="font-bold block text-sm">Surat Pengantar</span></div></button>
               <button onClick={() => setActiveTab('lapor')} className={`flex-none min-w-[140px] md:min-w-0 p-4 rounded-2xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'lapor' ? 'bg-white text-rose-600 shadow-lg shadow-rose-100 ring-1 ring-rose-100' : 'hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800'}`}><div className={`p-2 rounded-xl ${activeTab==='lapor' ? 'bg-rose-50' : 'bg-slate-100'}`}><AlertTriangle size={20} className="shrink-0" /></div><div><span className="font-bold block text-sm">Lapor Pak RT</span></div></button>
               <button onClick={() => setActiveTab('history')} className={`flex-none min-w-[140px] md:min-w-0 p-4 rounded-2xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'history' ? 'bg-white text-emerald-600 shadow-lg shadow-emerald-100 ring-1 ring-emerald-100' : 'hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800'}`}><div className={`p-2 rounded-xl ${activeTab==='history' ? 'bg-emerald-50' : 'bg-slate-100'}`}><History size={20} className="shrink-0" /></div><div><span className="font-bold block text-sm">Riwayat Saya</span></div></button>
            </div>
            <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white/50 relative">
               {activeTab === 'surat' && (
                  <div className="animate-fade-in max-w-2xl mx-auto space-y-8">
                     <form onSubmit={handleSubmitSurat} className="space-y-6">
                         <div className="space-y-4"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2"><FileText size={16}/> Data Surat</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Jenis Surat</label><select className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue rounded-xl w-full text-sm outline-none transition-all" value={requestType} onChange={e=>setRequestType(e.target.value as any)}><option>Surat Izin Keramaian</option><option>Surat Keterangan Usaha (SKU)</option><option>Pengantar KTP</option><option>Pengantar KK</option><option>Domisili</option><option>Kematian</option><option>Kelahiran</option></select></div></div></div>
                         <div className="space-y-4"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2"><User size={16}/> Identitas Pemohon</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Nama Lengkap</label><input placeholder="Sesuai KTP" className="p-3 bg-slate-50 border border-slate-200 rounded-xl w-full text-sm outline-none transition-all" value={applicantName} onChange={e=>setApplicantName(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">NIK</label><input type="number" className="p-3 bg-slate-50 border border-slate-200 rounded-xl w-full text-sm outline-none transition-all" value={nik} onChange={e=>setNik(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Kepala Keluarga</label><input className="p-3 bg-slate-50 border border-slate-200 rounded-xl w-full text-sm outline-none transition-all" value={familyHeadName} onChange={e=>setFamilyHeadName(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Tempat Lahir</label><input className="p-3 bg-slate-50 border border-slate-200 rounded-xl w-full text-sm outline-none transition-all" value={birthPlace} onChange={e=>setBirthPlace(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Tanggal Lahir</label><input type="date" className="p-3 bg-slate-50 border border-slate-200 rounded-xl w-full text-sm outline-none transition-all" value={birthDate} onChange={e=>setBirthDate(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Jenis Kelamin</label><select className="p-3 bg-slate-50 border border-slate-200 rounded-xl w-full text-sm outline-none transition-all" value={gender} onChange={e=>setGender(e.target.value as any)}><option>Laki-laki</option><option>Perempuan</option></select></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Agama</label><select className="p-3 bg-slate-50 border border-slate-200 rounded-xl w-full text-sm outline-none transition-all" value={religion} onChange={e=>setReligion(e.target.value)}><option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option></select></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Pekerjaan</label><input className="p-3 bg-slate-50 border border-slate-200 rounded-xl w-full text-sm outline-none transition-all" value={job} onChange={e=>setJob(e.target.value)} required/></div></div></div>
                         <div className="space-y-4"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2"><MapIcon size={16}/> Alamat & Keperluan</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Alamat Domisili (Blok Rumah)</label><input placeholder="Cth: C5-05" className="p-3 bg-slate-50 border border-slate-200 rounded-xl w-full text-sm outline-none transition-all" value={houseId} onChange={e=>setHouseId(e.target.value)} required/></div><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Keperluan</label><textarea className="p-3 bg-slate-50 border border-slate-200 rounded-xl w-full text-sm outline-none transition-all h-32" value={purposeDetail} onChange={e=>setPurposeDetail(e.target.value)} required/></div></div></div>
                         <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl"><h4 className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-2"><Lock size={14}/> Verifikasi Keamanan</h4><label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Kode Akses Rumah (PIN)</label><input type="password" placeholder="Masukkan Kode Unik Rumah" className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm" value={accessCode} onChange={e=>setAccessCode(e.target.value)} required/></div>
                         <Button type="submit" className="w-full py-3.5"><Download size={20}/> Ajukan Permohonan</Button>
                     </form>
                  </div>
               )}
               {activeTab === 'lapor' && (
                  <div className="animate-fade-in max-w-lg mx-auto md:mx-0 space-y-6">
                      <form onSubmit={handleSubmitLapor} className="space-y-6">
                          <div className="space-y-4"><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Kategori Masalah</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={reportType} onChange={e=>setReportType(e.target.value as any)}><option>Keamanan</option><option>Kebersihan</option><option>Fasilitas</option><option>Lainnya</option></select></div><div><label className="block text-xs font-bold text-slate-700 mb-2 ml-1">Pilih Masalah Cepat</label><div className="flex flex-wrap gap-2">{reportTags.map((tag, idx) => (<button type="button" key={idx} onClick={() => setReportDesc(tag.label)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold"><tag.icon size={12} /> {tag.label}</button>))}</div></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Lokasi Kejadian</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Cth: C5-05" value={reportHouseId} onChange={e=>setReportHouseId(e.target.value)} required /></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Deskripsi Lengkap</label><textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-32" value={reportDesc} onChange={e=>setReportDesc(e.target.value)} required></textarea></div></div>
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"><h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><Lock size={14}/> Verifikasi Pelapor</h4><div><label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Blok Rumah Anda</label><input className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm" placeholder="Cth: C7-02" value={reporterHouseId} onChange={e=>setReporterHouseId(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Kode Akses Rumah (PIN)</label><input type="password" placeholder="PIN Rumah Anda" className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm" value={accessCode} onChange={e=>setAccessCode(e.target.value)} required/></div></div>
                          <Button type="submit" className="w-full py-3.5 bg-rose-600 text-white shadow-lg shadow-rose-200"><Send size={18}/> Kirim Laporan</Button>
                      </form>
                  </div>
               )}
               {activeTab === 'history' && (
                   <div className="animate-fade-in space-y-4 max-w-xl">
                       <div className="flex justify-between items-center mb-6 pb-4 border-b"><div><h3 className="font-bold text-lg text-slate-800">Riwayat Aktivitas</h3></div><button onClick={clearHistory} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold">Hapus Log</button></div>
                       <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">{localHistory.length === 0 ? (<div className="pl-6 text-slate-400 italic text-sm">Belum ada riwayat aktivitas.</div>) : (localHistory.map((item: any, idx: number) => (<div key={idx} className="relative pl-6 group"><div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${item.category === 'Laporan' ? 'bg-rose-500' : 'bg-brand-blue'}`}></div><div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><div className="flex justify-between items-start mb-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.category === 'Laporan' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-brand-blue'}`}>{item.category}</span></div><h4 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h4><p className="text-xs text-slate-500">{item.date}</p></div></div>)))}</div>
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
  const categories = ['All', 'Kuliner', 'Jasa', 'Fashion', 'Retail', 'Lainnya'];
  const filteredUMKM = umkmData.filter(u => (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.description.toLowerCase().includes(searchTerm.toLowerCase())) && (filterCategory === 'All' || u.category === filterCategory));
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 mb-24 md:mb-24 space-y-8 animate-fade-in font-sans">
      <div className="relative rounded-3xl overflow-hidden bg-violet-950 shadow-2xl shadow-violet-200 min-h-[300px] flex items-center justify-center text-center px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 opacity-90"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-yellow-300 text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-lg"> Ekonomi Warga RT 002</div>
           <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">Dukung Usaha Tetangga,<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">Majukan Ekonomi Warga</span></h1>
           <p className="text-violet-100 text-sm md:text-lg font-medium leading-relaxed max-w-lg mx-auto">Temukan berbagai produk kuliner lezat dan jasa terpercaya dari warga kita.</p>
        </div>
      </div>
      <div className="sticky top-20 z-40 -mt-12 px-2">
         <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-3 shadow-xl border border-white/60 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search size={18} /></div><input type="text" placeholder="Cari UMKM..." className="w-full pl-14 pr-4 py-4 bg-white border-2 border-transparent focus:border-violet-200 rounded-2xl outline-none text-sm font-bold text-slate-700 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar items-center px-1">{categories.map(cat => (<button key={cat} onClick={() => setFilterCategory(cat)} className={`whitespace-nowrap px-6 py-3.5 rounded-2xl text-xs font-bold transition-all ${filterCategory === cat ? 'bg-violet-600 text-white shadow-lg shadow-violet-300' : 'bg-white text-slate-500'}`}>{cat}</button>))}</div>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
         {filteredUMKM.map(u => (
            <div key={u.id} className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden relative isolate">
               <div className="h-64 relative overflow-hidden bg-slate-100 rounded-t-3xl"><img src={u.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={u.name}/><div className="absolute top-4 left-4"><span className="bg-white/95 backdrop-blur-md text-violet-700 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 shadow-sm"><ShoppingBag size={12} className="text-violet-500" /> {u.category}</span></div></div>
               <div className="p-6 flex-1 flex flex-col bg-white relative -mt-12 mx-4 mb-4 rounded-3xl shadow-lg border border-slate-50">
                  <h3 className="font-black text-xl text-slate-800 leading-tight mb-3">{u.name}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><User size={14}/> {u.owner}</p>
                  <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex-1"><p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{u.description}</p></div>
                  <a href={`https://wa.me/${u.contact.replace(/^0/, '62').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-emerald-600 transition-all"><MessageCircle size={20}/> Hubungi Penjual</a>
               </div>
            </div>
         ))}
         {filteredUMKM.length === 0 && <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">Belum ada UMKM ditemukan</div>}
      </div>
    </div>
  );
};

const PublicInfo = ({ officials, cashFlow, ronda, rondaLogs }: { officials: Official[], cashFlow: CashFlow[], ronda: RondaSchedule[], rondaLogs: RondaCheckLog[] }) => {
    const totalIncome = cashFlow.filter(c => c.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = cashFlow.filter(c => c.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    const currentBalance = totalIncome - totalExpense;
    const chartData = cashFlow.slice().reverse().map(c => ({ date: new Date(c.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}), amount: c.amount, type: c.type }));
    const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const sortedRonda = [...ronda].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
    const [activeRondaDay, setActiveRondaDay] = useState(new Date().toLocaleDateString('id-ID', {weekday:'long'}));
    const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
    const [checkLocation, setCheckLocation] = useState('');
    const [checkOfficer, setCheckOfficer] = useState('');
    
    const handleCheckSubmit = async (status: 'Aman' | 'Mencurigakan') => {
        if (!checkOfficer || !checkLocation) { alert("Nama petugas dan lokasi wajib diisi!"); return; }
        const newLog: any = { officerName: checkOfficer, location: checkLocation, status, timestamp: new Date().toISOString(), note: status === 'Aman' ? 'Kondisi aman terkendali.' : 'Perlu pemantauan lebih lanjut.' };
        await addRondaLog(newLog);
        alert(`Laporan patroli (${status}) tercatat!`);
        setIsCheckModalOpen(false); setCheckLocation('');
    };
    
    return (
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-20 space-y-8 animate-fade-in">
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl min-h-[400px] flex items-center justify-center">
                <div className="relative z-10 text-center px-6 py-12 md:py-16 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-widest uppercase mb-6 backdrop-blur-sm shadow-lg shadow-indigo-900/50">Transparansi Publik RT 002</div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight drop-shadow-sm">Pusat Informasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Terpadu</span></h1>
                    <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">Akses data kepengurusan, laporan keuangan, dan jadwal kegiatan lingkungan secara terbuka dan akuntabel.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"><div className="relative z-10"><p className="text-emerald-100 font-medium text-xs uppercase mb-2 flex items-center gap-2"><ShieldCheck size={14}/> Keuangan Warga</p><h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">Rp {currentBalance.toLocaleString()}</h2><div className="flex gap-3 text-xs font-bold"><div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">+{totalIncome.toLocaleString()}</div><div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">-{totalExpense.toLocaleString()}</div></div></div></div>
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-100 flex flex-col justify-between"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Struktur Organisasi</p><h2 className="text-4xl font-black text-slate-800 mt-2">{officials.length} <span className="text-lg font-medium text-slate-400">Personil</span></h2></div><div className="bg-brand-blue/5 p-4 rounded-2xl text-brand-blue"><Briefcase size={28}/></div></div></div>
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-100 flex flex-col justify-between"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Jadwal Keamanan</p><h2 className="text-xl font-black text-slate-800 mt-2 capitalize">{new Date().toLocaleDateString('id-ID', {weekday:'long'})}</h2></div><div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><Moon size={28}/></div></div></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm"><div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"><div><h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><BarChart3 className="text-emerald-500" size={20}/> Laporan Arus Kas</h3></div></div><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} /><YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`}/><RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}} itemStyle={{fontSize: '12px', fontWeight: 'bold'}} formatter={(value: number) => [`Rp ${value.toLocaleString()}`, 'Jumlah']} labelStyle={{color: '#64748b', marginBottom: '4px', fontSize: '10px'}} /><Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" /></AreaChart></ResponsiveContainer></div><div className="mt-8 pt-8 border-t border-slate-50"><h4 className="font-bold text-sm text-slate-700 mb-4">Transaksi Terakhir</h4><div className="space-y-3">{cashFlow.slice(0, 4).map(cf => (<div key={cf.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${cf.type==='Income'?'bg-emerald-100 text-emerald-600':'bg-rose-100 text-rose-600'}`}>{cf.type==='Income' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}</div><div><p className="font-bold text-slate-800 text-xs md:text-sm">{cf.description}</p><p className="text-[10px] text-slate-400">{new Date(cf.date).toLocaleDateString('id-ID', {day:'numeric', month:'long'})}</p></div></div><span className={`font-bold text-xs md:text-sm ${cf.type==='Income'?'text-emerald-600':'text-rose-600'}`}>{cf.type==='Income' ? '+' : '-'} Rp {cf.amount.toLocaleString()}</span></div>))}</div></div></div>
                </div>
                <div className="lg:col-span-1"><div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl h-full flex flex-col relative overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center justify-between mb-6 relative z-10"><h3 className="font-bold text-lg flex items-center gap-2"><Shield size={20} className="text-indigo-400"/> Jadwal Siskamling</h3><button onClick={() => setIsCheckModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all">Check Point</button></div>
                    <div className="flex-1 flex flex-col gap-3 relative z-10">{sortedRonda.map((r, i) => (<div key={i} onClick={() => setActiveRondaDay(r.day)} className={`group p-4 rounded-2xl border transition-all cursor-pointer ${activeRondaDay === r.day ? 'bg-indigo-600 border-indigo-500 shadow-lg scale-[1.02]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}><div className="flex justify-between items-center mb-2"><span className={`font-bold text-sm ${activeRondaDay === r.day ? 'text-white' : 'text-slate-300'}`}>{r.day}</span>{r.day === new Date().toLocaleDateString('id-ID', {weekday:'long'}) && <span className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full animate-pulse">HARI INI</span>}</div>{activeRondaDay === r.day && (<div className="space-y-2 animate-fade-in mt-2 pt-2 border-t border-white/20">{r.members.map((m, idx) => (<div key={idx} className="flex items-center gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-indigo-300"></div><span className="text-indigo-100">{m}</span></div>))}{r.members.length === 0 && <p className="text-xs text-white/40 italic">Belum ada petugas.</p>}</div>)}</div>))}</div>
                </div>
                </div>
            </div>
            <Modal isOpen={isCheckModalOpen} onClose={() => setIsCheckModalOpen(false)} title="Laporan Patroli Digital">
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center"><p className="text-xs font-bold text-slate-500 uppercase">Waktu Check-In</p><p className="text-xl font-black text-slate-800 font-mono mt-1">{new Date().toLocaleTimeString()}</p></div>
                    <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Nama Petugas</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" placeholder="Nama Anda" value={checkOfficer} onChange={e => setCheckOfficer(e.target.value)} /></div>
                    <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Lokasi / Titik Pantau</label><select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={checkLocation} onChange={e => setCheckLocation(e.target.value)}><option value="">-- Pilih Lokasi --</option><option value="Gerbang Utama">Gerbang Utama</option><option value="Pos Satpam">Pos Satpam</option><option value="Blok C5">Blok C5</option><option value="Blok C7">Blok C7</option><option value="Blok C8">Blok C8</option><option value="Blok C9">Blok C9</option><option value="Blok C10">Blok C10</option><option value="Blok C11">Blok C11</option><option value="Blok C12">Blok C12</option></select></div>
                    <div className="grid grid-cols-2 gap-3 pt-2"><button onClick={() => handleCheckSubmit('Aman')} className="bg-emerald-500 text-white font-bold py-3 rounded-xl">AMAN</button><button onClick={() => handleCheckSubmit('Mencurigakan')} className="bg-rose-500 text-white font-bold py-3 rounded-xl">MENCURIGAKAN</button></div>
                </div>
            </Modal>
        </div>
    );
};

// --- Admin Dashboard ---
const AdminDashboard = ({ 
  houses, announcements, cashFlow, officials, reports, letters, ronda, inventory, umkm, polls, pdfConfig, setPdfConfig, rondaLogs 
}: any) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'announcement' | 'cash' | 'official' | 'editHouse' | 'inventory' | 'ronda' | 'umkm' | 'dues' | 'import' | 'bulkDues' | 'poll'>('announcement');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [residentView, setResidentView] = useState<'grid' | 'table'>('table');
  const [searchResident, setSearchResident] = useState('');
  const [searchUmkm, setSearchUmkm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [filterBlock, setFilterBlock] = useState('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchInventory, setSearchInventory] = useState('');
  const [filterInventoryCondition, setFilterInventoryCondition] = useState('All');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [serviceTab, setServiceTab] = useState<'surat' | 'laporan'>('surat');
  const [annTitle, setAnnTitle] = useState(''); const [annContent, setAnnContent] = useState(''); const [annType, setAnnType] = useState<Announcement['type']>('General');
  const [annNotify, setAnnNotify] = useState(false); 
  const [cashDesc, setCashDesc] = useState(''); const [cashAmount, setCashAmount] = useState(''); const [cashType, setCashType] = useState<'Income' | 'Expense'>('Income'); const [cashCategory, setCashCategory] = useState('Iuran');
  const [editingCashId, setEditingCashId] = useState<string | null>(null);
  const [pollTitle, setPollTitle] = useState(''); const [pollDesc, setPollDesc] = useState(''); const [pollDeadline, setPollDeadline] = useState(''); const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [offName, setOffName] = useState(''); const [offRole, setOffRole] = useState(''); const [offPhone, setOffPhone] = useState(''); const [offHouse, setOffHouse] = useState(''); const [offPhoto, setOffPhoto] = useState(''); const [offId, setOffId] = useState<string|null>(null);
  const [invName, setInvName] = useState(''); const [invTotal, setInvTotal] = useState(''); const [invAvailable, setInvAvailable] = useState(''); const [invCondition, setInvCondition] = useState<'Baik'|'Perlu Perbaikan'|'Rusak'>('Baik'); const [invNotes, setInvNotes] = useState(''); const [invId, setInvId] = useState<string|null>(null);
  const [umkmName, setUmkmName] = useState(''); const [umkmOwner, setUmkmOwner] = useState(''); const [umkmCategory, setUmkmCategory] = useState('Kuliner'); const [umkmDesc, setUmkmDesc] = useState(''); const [umkmContact, setUmkmContact] = useState(''); const [umkmImage, setUmkmImage] = useState(''); const [umkmId, setUmkmId] = useState<string|null>(null);
  const [rondaDay, setRondaDay] = useState(''); const [rondaMembers, setRondaMembers] = useState(''); const [selectedRondaId, setSelectedRondaId] = useState<string|null>(null);
  const [duesHouseId, setDuesHouseId] = useState(''); const [duesAmount, setDuesAmount] = useState('25000'); const [duesStatus, setDuesStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  const [bulkStatus, setBulkStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [newPassword, setNewPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [isChangingPassword, setIsChangingPassword] = useState(false); const [showPassword, setShowPassword] = useState(false);
  const [editHouseForm, setEditHouseForm] = useState({ headOfFamily: '', occupants: 0, phone: '', paymentStatus: '', unifiedStatus: 'Tetap', hasPregnant: false, hasBaby: false, hasToddler: false, hasTeenager: false, hasElderly: false, accessCode: '' });
  const [isGenerating, setIsGenerating] = useState(false); const [draftTopic, setDraftTopic] = useState(''); const [localConfig, setLocalConfig] = useState<PdfConfig>(pdfConfig);
  const [aiAnalysis, setAiAnalysis] = useState(''); const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => { const unsubMarket = subscribeToMarketItems((data) => setMarketItems(data)); return () => unsubMarket(); }, []);

  const validateAmount = (amount: string) => { const val = parseInt(amount); return !isNaN(val) && val > 0; };
  const validateText = (text: string, minLength = 3) => { return text && text.trim().length >= minLength; };

  const getFilteredHouses = () => {
      return houses.filter((h: House) => {
          const matchSearch = h.headOfFamily.toLowerCase().includes(searchResident.toLowerCase()) || h.id.toLowerCase().includes(searchResident.toLowerCase());
          let matchStatus = true;
          if (filterStatus === 'Occupied') matchStatus = h.status === 'Occupied';
          else if (filterStatus === 'Empty') matchStatus = h.status === 'Empty';
          else if (filterStatus === 'Business') matchStatus = h.status === 'Business';
          else if (filterStatus === 'Kontrak') matchStatus = h.status === 'Occupied' && h.residenceType === 'Kontrak';
          let matchPayment = true;
          if (filterPayment !== 'All') matchPayment = h.paymentStatus === filterPayment;
          let matchBlock = true;
          if (filterBlock !== 'All') matchBlock = h.block === filterBlock;
          return matchSearch && matchStatus && matchPayment && matchBlock;
      });
  };

  const filteredHouses = getFilteredHouses();
  const availableBlocks = (Array.from(new Set(houses.map((h: House) => h.block))) as string[]).sort();

  const resetForms = () => {
      setAnnTitle(''); setAnnContent(''); setDraftTopic(''); setAnnNotify(false);
      setCashDesc(''); setCashAmount(''); setCashType('Income'); setCashCategory('Iuran'); setEditingCashId(null);
      setOffName(''); setOffRole(''); setOffPhone(''); setOffHouse(''); setOffPhoto(''); setOffId(null);
      setInvName(''); setInvTotal(''); setInvAvailable(''); setInvNotes(''); setInvId(null);
      setUmkmName(''); setUmkmOwner(''); setUmkmCategory('Kuliner'); setUmkmDesc(''); setUmkmContact(''); setUmkmImage(''); setUmkmId(null);
      setRondaMembers(''); setSelectedRondaId(null);
      setDuesHouseId(''); setDuesAmount('25000'); setDuesStatus(PaymentStatus.PAID);
      setBulkStatus(PaymentStatus.PAID);
      setPollTitle(''); setPollDesc(''); setPollDeadline(''); setPollOptions(['','']);
      setImportFile(null); setFormErrors({});
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.checked) { setSelectedIds(new Set(filteredHouses.map(h => h.id))); } else { setSelectedIds(new Set()); } };
  const handleSelectOne = (id: string) => { const newSet = new Set(selectedIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedIds(newSet); };
  const handleBulkDuesUpdate = () => { if (selectedIds.size === 0) return; setBulkStatus(PaymentStatus.PAID); setModalType('bulkDues'); setIsModalOpen(true); };
  const handleSaveBulkDues = async (e: React.FormEvent) => { e.preventDefault(); const updates = Array.from(selectedIds).map(id => ({ id, paymentStatus: bulkStatus })); await batchUpdateHouses(updates); setIsModalOpen(false); setSelectedIds(new Set()); resetForms(); };
  const handleDeleteHouse = async (id: string) => { if(confirm("Hapus warga?")) await deleteHouseFromDb(id); };
  const handlePasswordChange = async (e: React.FormEvent) => { e.preventDefault(); if (newPassword !== confirmPassword) { alert("Password tidak cocok!"); return; } setIsChangingPassword(true); try { await updateAdminPassword(newPassword); alert("Password diubah!"); setNewPassword(''); setConfirmPassword(''); } catch (err) { alert("Gagal."); } finally { setIsChangingPassword(false); } };
  const handleResetSystem = async () => { if (confirm("Reset sistem? Ketik 'RESET'")) { if (prompt("Ketik 'RESET'") === 'RESET') { const initialData = { houses: generateHouses(), announcements: MOCK_ANNOUNCEMENTS, cashFlow: MOCK_CASHFLOW, officials: INITIAL_OFFICIALS, reports: INITIAL_REPORTS, ronda: MOCK_RONDA, inventory: MOCK_INVENTORY, umkm: MOCK_UMKM, polls: MOCK_POLLS, rondaLogs: MOCK_RONDA_LOGS }; await seedDatabase(initialData); alert("Reset berhasil."); window.location.reload(); } } };
  const handleExportData = () => { const data = { houses, announcements, cashFlow, officials, reports, letters, ronda, inventory, umkm, polls }; const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2)); const link = document.createElement('a'); link.setAttribute("href", jsonString); link.setAttribute("download", "backup.json"); link.click(); };
  const handleAiAnalysis = async () => { setIsAnalyzing(true); const result = await generateDashboardSummary({ totalResidents: houses.length, cashBalance: 1000000, reportsCount: reports.length, unpaidCount: houses.filter(h=>h.paymentStatus!=='Lunas').length }); setAiAnalysis(result); setIsAnalyzing(false); };
  const handleCreateAnnouncement = async (e: React.FormEvent) => { e.preventDefault(); await addAnnouncementToDb({ title: annTitle, content: annContent, type: annType, date: new Date().toISOString() }); if (annNotify) await addNotificationToDb({ title: `Pengumuman: ${annTitle}`, message: annContent, date: new Date().toISOString(), type: 'Info', target: 'All', isRead: false }); setIsModalOpen(false); resetForms(); };
  const handleDeleteAnnouncement = async (id: string) => { if (confirm("Hapus?")) await deleteAnnouncementFromDb(id); };
  const handleGenerateDraft = async () => { if(!draftTopic) return; setIsGenerating(true); setAnnContent(await generateAnnouncementDraft(draftTopic)); setAnnTitle(draftTopic); setIsGenerating(false); };
  const handleSaveTransaction = async (e: React.FormEvent) => { e.preventDefault(); const transactionData = { description: cashDesc, amount: parseInt(cashAmount), type: cashType, category: cashCategory, date: new Date().toISOString().split('T')[0] }; if (editingCashId) await updateTransactionInDb(editingCashId, transactionData); else await addTransactionToDb(transactionData); setIsModalOpen(false); resetForms(); };
  const openEditCash = (cf: CashFlow) => { setEditingCashId(cf.id); setCashDesc(cf.description); setCashAmount(cf.amount.toString()); setCashType(cf.type); setCashCategory(cf.category); setModalType('cash'); setIsModalOpen(true); };
  const handleDeleteTransaction = async (id: string) => { if (confirm("Hapus?")) await deleteTransactionFromDb(id); };
  const handleSaveDues = async (e: React.FormEvent) => { e.preventDefault(); await updateHouseData(duesHouseId, { paymentStatus: duesStatus }); if (duesStatus === PaymentStatus.PAID) { await addTransactionToDb({ description: `Iuran ${duesHouseId}`, amount: parseInt(duesAmount), type: 'Income', category: 'Iuran Warga', date: new Date().toISOString().split('T')[0] }); } setIsModalOpen(false); resetForms(); };
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
  const openDuesModal = (h: House) => { setDuesHouseId(h.id); setDuesStatus(PaymentStatus.PAID); setModalType('dues'); setIsModalOpen(true); };
  const handleUpdateReport = async (id: string, s: string) => { await updateReportStatus(id, s); if (s === 'Selesai') await addNotificationToDb({ title: "Laporan Selesai", message: "Laporan Anda telah diselesaikan.", date: new Date().toISOString(), type: 'Success', target: 'All' }); };
  const handleDeleteReport = async (id: string) => await deleteReportFromDb(id);
  const handleUpdateLetter = async (id: string, s: string) => await updateLetterStatus(id, s);
  const handleDeleteLetter = async (id: string) => await deleteLetterFromDb(id);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PdfConfig) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setLocalConfig(prev => ({ ...prev, [field]: reader.result as string })); reader.readAsDataURL(file); } };
  const handleSaveConfig = () => { setPdfConfig(localConfig); localStorage.setItem('pdf_config', JSON.stringify(localConfig)); alert("Tersimpan!"); };
  const handleDeleteMarketItem = async (id: string) => { if(confirm("Hapus?")) await deleteMarketItem(id); };
  const handleMarkSold = async (id: string) => { await updateMarketItemStatus(id, 'Sold'); };
  const openEditHouse = (h: House) => { setSelectedHouse(h); let unified = h.status === 'Empty' ? 'Empty' : h.status === 'Business' ? 'Business' : h.residenceType || 'Tetap'; setEditHouseForm({ headOfFamily: h.headOfFamily==='-'?'':h.headOfFamily, occupants: h.occupants||0, phone: h.phone||'', paymentStatus: h.paymentStatus, unifiedStatus: unified, hasPregnant: h.hasPregnant||false, hasBaby: h.hasBaby||false, hasToddler: h.hasToddler||false, hasTeenager: h.hasTeenager||false, hasElderly: h.hasElderly||false, accessCode: h.accessCode || '' }); setModalType('editHouse'); setIsModalOpen(true); };
  const handleSaveHouse = async (e: React.FormEvent) => { e.preventDefault(); if(!selectedHouse) return; let status: House['status'] = 'Occupied'; let residenceType: House['residenceType'] = 'Tetap'; if(editHouseForm.unifiedStatus === 'Empty') status = 'Empty'; else if(editHouseForm.unifiedStatus === 'Business') status = 'Business'; else residenceType = editHouseForm.unifiedStatus as any; await updateHouseData(selectedHouse.id, { headOfFamily: status === 'Empty' ? '-' : editHouseForm.headOfFamily, occupants: status === 'Empty' ? 0 : editHouseForm.occupants, phone: editHouseForm.phone, status, residenceType, paymentStatus: editHouseForm.paymentStatus, hasPregnant: editHouseForm.hasPregnant, hasBaby: editHouseForm.hasBaby, hasToddler: editHouseForm.hasToddler, hasTeenager: editHouseForm.hasTeenager, hasElderly: editHouseForm.hasElderly, accessCode: editHouseForm.accessCode }); setIsModalOpen(false); };
  const handleCreatePoll = async (e: React.FormEvent) => { e.preventDefault(); const validOptions = pollOptions.filter(o => o.trim() !== ''); await addPollToDb({ title: pollTitle, description: pollDesc, deadline: pollDeadline, date: new Date().toISOString(), status: 'Open', totalVotes: 0, options: validOptions.map((text, idx) => ({ id: `opt${idx}`, text, votes: 0 })) }); setIsModalOpen(false); resetForms(); };
  const handleClosePoll = async (id: string) => { if(confirm("Tutup voting?")) await updatePollStatus(id, 'Closed'); };
  const handleDeletePoll = async (id: string) => { if(confirm("Hapus?")) await deletePollFromDb(id); };

  const navGroups = [
      { title: "Menu Utama", items: [{ id: 'overview', icon: LayoutDashboard, label: 'Dashboard' }] },
      { title: "Administrasi", items: [{ id: 'residents', icon: Users, label: 'Data Warga' }, { id: 'services', icon: Archive, label: 'Laporan & Layanan' }, { id: 'finance', icon: DollarSign, label: 'Keuangan' }] },
      { title: "Lingkungan", items: [{ id: 'facilities', icon: Package, label: 'Fasilitas' }, { id: 'market', icon: ShoppingCart, label: 'Bursa Warga' }, { id: 'umkm', icon: ShoppingBag, label: 'UMKM' }, { id: 'announcements', icon: Megaphone, label: 'Pengumuman' }, { id: 'polls', icon: Vote, label: 'E-Voting' }, { id: 'officials', icon: Briefcase, label: 'Pengurus' }] },
      { title: "Sistem", items: [{ id: 'settings', icon: Settings, label: 'Pengaturan' }] }
  ];

  const handleLogout = async () => { await logoutAdmin(); navigate('/'); };

  const renderNav = () => (
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          {navGroups.map((group, idx) => (
              <div key={idx}><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-3">{group.title}</h3><div className="space-y-1">{group.items.map(item => (<button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-bold ${activeTab === item.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}><item.icon size={18}/> <span className="text-sm">{item.label}</span></button>))}</div></div>
          ))}
      </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <div className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 fixed h-full z-30"><div className="p-6 border-b border-slate-100 flex items-center gap-3"><div className="bg-slate-900 text-white p-2 rounded-xl"><Shield size={24}/></div><h1 className="font-black text-xl text-slate-900">TERAS Admin</h1></div>{renderNav()}<div className="p-4 border-t border-slate-100"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg"><LogOut size={14}/> Keluar</button></div></div>
      <div className="flex-1 md:ml-72 p-4 md:p-8 pb-24 overflow-x-hidden">
          <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm"><div className="flex items-center gap-2"><div className="bg-slate-900 text-white p-1.5 rounded-lg"><Shield size={18}/></div><span className="font-bold text-slate-900">TERAS Admin</span></div><button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-50 rounded-lg"><Menu size={20}/></button></div>
          {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Card className="flex items-center gap-4"><div className="p-4 bg-sky-50 text-sky-600 rounded-2xl"><Users size={28}/></div><div><p className="text-slate-500 text-xs font-bold uppercase">Total Warga</p><h3 className="text-3xl font-black text-slate-800">{houses.length} KK</h3></div></Card><Card className="flex items-center gap-4"><div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Wallet size={28}/></div><div><p className="text-slate-500 text-xs font-bold uppercase">Saldo Kas</p><h3 className="text-3xl font-black text-slate-800">Rp {(cashFlow.reduce((acc:number, c:CashFlow) => c.type === 'Income' ? acc + c.amount : acc - c.amount, 0)).toLocaleString()}</h3></div></Card><Card className="flex items-center gap-4"><div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><AlertTriangle size={28}/></div><div><p className="text-slate-500 text-xs font-bold uppercase">Laporan Baru</p><h3 className="text-3xl font-black text-slate-800">{reports.filter((r:Report) => r.status === 'Baru').length}</h3></div></Card></div>
                   <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden"><div className="relative z-10"><div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6"><div><h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Sparkles className="text-indigo-500" size={20}/> AI Smart Analysis</h3></div><button onClick={handleAiAnalysis} disabled={isAnalyzing} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg">{isAnalyzing ? 'Analyzing...' : 'Minta Analisis AI'}</button></div>{aiAnalysis && <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200"><p className="text-slate-600 whitespace-pre-wrap">{aiAnalysis}</p></div>}</div></div>
              </div>
          )}
          {activeTab === 'residents' && (<div className="animate-fade-in space-y-6"><Card title="Data Warga"><div className="flex flex-col md:flex-row gap-4 mb-6"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Cari nama / blok..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={searchResident} onChange={(e) => setSearchResident(e.target.value)} /></div></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]"><tr><th className="px-6 py-4">Blok</th><th className="px-6 py-4">Kepala Keluarga</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Iuran</th><th className="px-6 py-4 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-50">{filteredHouses.map((h:House) => (<tr key={h.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-black">{h.block}-{h.number}</td><td className="px-6 py-4">{h.headOfFamily}</td><td className="px-6 py-4">{h.status}</td><td className="px-6 py-4">{h.paymentStatus}</td><td className="px-6 py-4 text-center"><button onClick={() => openEditHouse(h)} className="p-2 hover:text-blue-600"><Edit2 size={16} /></button><button onClick={() => handleDeleteHouse(h.id)} className="p-2 hover:text-rose-600"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div></Card></div>)}
          {activeTab === 'market' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center"><div><h2 className="font-black text-2xl text-slate-800">Manajemen Bursa Warga</h2></div></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {marketItems.map((item: MarketItem) => (
                          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-4"><div className="w-24 h-24 bg-slate-100 rounded-xl shrink-0 overflow-hidden"><img src={item.image || 'https://placehold.co/100?text=No+Image'} className="w-full h-full object-cover" alt={item.title}/></div><div className="flex-1 min-w-0 flex flex-col"><div className="flex justify-between items-start mb-1"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${item.status === 'Sold' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>{item.status === 'Sold' ? 'Terjual' : 'Aktif'}</span><div className="flex gap-1">{item.status !== 'Sold' && (<button onClick={() => handleMarkSold(item.id)} className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors" title="Tandai Terjual"><CheckCircle size={14}/></button>)}<button onClick={() => handleDeleteMarketItem(item.id)} className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Hapus Iklan"><Trash2 size={14}/></button></div></div><h4 className="font-bold text-slate-800 text-sm truncate">{item.title}</h4><p className="text-xs text-slate-500 mb-2 truncate">{item.sellerName}</p><div className="mt-auto"><span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">{item.category}: {item.price > 0 ? `Rp ${item.price.toLocaleString()}` : 'Gratis'}</span></div></div></div>
                      ))}
                      {marketItems.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">Belum ada iklan.</div>}
                  </div>
              </div>
          )}
          {activeTab === 'polls' && (<div className="space-y-6 animate-fade-in"><div className="flex justify-between items-center"><div><h2 className="font-black text-2xl text-slate-800">Voting</h2></div><Button onClick={() => { resetForms(); setModalType('poll'); setIsModalOpen(true); }}><Plus size={16}/> Buat Baru</Button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{polls.map((poll: Poll) => (<div key={poll.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col"><div className="flex justify-between items-start mb-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">{poll.status}</span><div className="flex gap-2"><button onClick={() => handleDeletePoll(poll.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button></div></div><h3 className="font-bold text-slate-800 mb-2">{poll.title}</h3><p className="text-xs text-slate-700 font-bold">{poll.totalVotes} Suara</p></div>))}</div></div>)}
          {activeTab === 'facilities' && (<div className="space-y-8 animate-fade-in"><div><h2 className="font-black text-2xl text-slate-800 mb-4 flex items-center gap-2"><Moon size={24}/> Jadwal Keamanan</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{ronda.map((r:any) => (<div key={r.id} className="p-5 rounded-3xl border bg-white border-slate-100"><h4 className="font-black text-lg">{r.day}</h4><button onClick={() => openEditRonda(r)} className="text-xs text-blue-600 mt-2">Edit Jadwal</button></div>))}</div></div></div>)}
          {activeTab === 'finance' && (<div className="space-y-6"><Card title="Arus Kas" action={<Button onClick={() => { resetForms(); setModalType('cash'); setIsModalOpen(true); }} size="sm">Tambah</Button>}>{cashFlow.map((cf:CashFlow) => (<div key={cf.id} className="flex justify-between p-3 border-b">{cf.description} <span className={cf.type==='Income'?'text-emerald-600':'text-rose-600'}>Rp {cf.amount.toLocaleString()}</span></div>))}</Card></div>)}
          {activeTab === 'announcements' && (<div className="space-y-6"><div className="flex justify-between items-center"><h2 className="font-black text-2xl text-slate-800">Pengumuman</h2><Button onClick={() => { resetForms(); setModalType('announcement'); setIsModalOpen(true); }}><Plus size={16}/> Buat Baru</Button></div>{announcements.map((a:Announcement) => (<div key={a.id} className="bg-white p-6 rounded-2xl border border-slate-100 flex justify-between"><div><h4 className="font-bold">{a.title}</h4></div><button onClick={() => handleDeleteAnnouncement(a.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={20}/></button></div>))}</div>)}
          {activeTab === 'settings' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in"><Card title="Profil Admin"><form onSubmit={handlePasswordChange} className="space-y-4"><div><label className="block text-xs font-bold mb-1.5">Ganti Password</label><input type="password" className="w-full p-3 border rounded-xl" value={newPassword} onChange={e => setNewPassword(e.target.value)} required/><input type="password" className="w-full p-3 border rounded-xl mt-2" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required/></div><Button type="submit" disabled={isChangingPassword}>Simpan Password</Button></form></Card></div>)}
      </div>
      {isModalOpen && (<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Form Admin">
          {modalType === 'editHouse' && (<form onSubmit={handleSaveHouse} className="space-y-4"><div><label className="block text-xs font-bold mb-1.5">Kepala Keluarga</label><input className="w-full p-3 border rounded-xl" value={editHouseForm.headOfFamily} onChange={e=>setEditHouseForm({...editHouseForm, headOfFamily: e.target.value})}/></div><div><label className="block text-xs font-bold mb-1.5">PIN Akses Rumah</label><input className="w-full p-3 border rounded-xl" value={editHouseForm.accessCode} onChange={e=>setEditHouseForm({...editHouseForm, accessCode: e.target.value})}/></div><Button type="submit" className="w-full">Simpan</Button></form>)}
          {modalType === 'announcement' && (<form onSubmit={handleCreateAnnouncement} className="space-y-4"><div><label className="block text-xs font-bold mb-1.5">Judul</label><input className="w-full p-3 border rounded-xl" value={annTitle} onChange={e=>setAnnTitle(e.target.value)} required/></div><div><label className="block text-xs font-bold mb-1.5">Isi</label><textarea className="w-full p-3 border rounded-xl h-32" value={annContent} onChange={e=>setAnnContent(e.target.value)} required/></div><Button type="submit" className="w-full">Terbitkan</Button></form>)}
          {modalType === 'poll' && (<form onSubmit={handleCreatePoll} className="space-y-4"><div><label className="block text-xs font-bold mb-1.5">Judul Voting</label><input className="w-full p-3 border rounded-xl" value={pollTitle} onChange={e=>setPollTitle(e.target.value)} required/></div><div><label className="block text-xs font-bold mb-1.5">Batas Waktu</label><input type="date" className="w-full p-3 border rounded-xl" value={pollDeadline} onChange={e=>setPollDeadline(e.target.value)} required/></div><Button type="submit" className="w-full">Mulai</Button></form>)}
          {modalType === 'cash' && (<form onSubmit={handleSaveTransaction} className="space-y-4"><div><label className="block text-xs font-bold mb-1.5">Keterangan</label><input className="w-full p-3 border rounded-xl" value={cashDesc} onChange={e=>setCashDesc(e.target.value)} required/></div><div><label className="block text-xs font-bold mb-1.5">Nominal</label><input type="number" className="w-full p-3 border rounded-xl" value={cashAmount} onChange={e=>setCashAmount(e.target.value)} required/></div><Button type="submit" className="w-full">Simpan</Button></form>)}
      </Modal>)}
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
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);
  const [pdfConfig, setPdfConfig] = useState<PdfConfig>(() => { try { const saved = localStorage.getItem('pdf_config'); return saved ? JSON.parse(saved) : DEFAULT_PDF_CONFIG; } catch { return DEFAULT_PDF_CONFIG; } });
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
    const unsubRondaLogs = subscribeToRondaLogs(setRondaLogs);
    const unsubMarket = subscribeToMarketItems(setMarketItems);
    const unsubNotifs = subscribeToNotifications((data) => { setNotifications(data); if (data.length > 0 && !data[0].isRead) setActiveNotification(data[0]); });
    const unsubAuth = onAuthStateChanged(auth, user => setIsAdmin(!!user));
    return () => { unsubHouses(); unsubAnnouncements(); unsubCash(); unsubOfficials(); unsubReports(); unsubLetters(); unsubRonda(); unsubInventory(); unsubUmkm(); unsubPolls(); unsubRondaLogs(); unsubMarket(); unsubNotifs(); unsubAuth(); };
  }, []);

  return (
    <HashRouter>
        {activeNotification && <NotificationToast notification={activeNotification} onClose={() => setActiveNotification(null)} />}
        <Routes>
            <Route path="/admin" element={<AdminRouteWrapper isAdmin={isAdmin} onLogin={() => setIsAdmin(true)}><AdminDashboard houses={houses} announcements={announcements} cashFlow={cashFlow} officials={officials} reports={reports} letters={letters} ronda={ronda} inventory={inventory} umkm={umkm} polls={polls} rondaLogs={rondaLogs} pdfConfig={pdfConfig} setPdfConfig={setPdfConfig}/></AdminRouteWrapper>}/>
            <Route path="*" element={<><PublicHeader notifications={notifications} onMarkRead={() => {}} /><Routes><Route path="/" element={<PublicHome houses={houses} announcements={announcements} ronda={ronda} reports={reports} officials={officials} />} /><Route path="/voting" element={<PublicVoting polls={polls} />} /><Route path="/market" element={<PublicMarket items={marketItems} />} /><Route path="/services" element={<PublicServices pdfConfig={pdfConfig} />} /><Route path="/umkm" element={<PublicUMKM umkmData={umkm} />} /><Route path="/info" element={<PublicInfo officials={officials} cashFlow={cashFlow} ronda={ronda} rondaLogs={rondaLogs} />} /></Routes><ChatBot announcements={announcements} ronda={ronda} officials={officials} /><PanicButton /></>} />
        </Routes>
    </HashRouter>
  );
};
