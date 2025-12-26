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
  Database, Lock, Eye, EyeOff, Save, Trash, Sparkles, Loader2, CheckSquare, Bell, Vote, PieChart, LocateFixed, ShoppingCart, Wand2
} from 'lucide-react';
import { CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

// Destructure React Router DOM components
const { HashRouter, Routes, Route, useNavigate, useLocation, useSearchParams } = ReactRouterDOM;

// Components & Services
import { Logo, generateHouses, MOCK_ANNOUNCEMENTS, MOCK_UMKM, MOCK_RONDA, MOCK_CASHFLOW, MOCK_GALLERY, INITIAL_OFFICIALS, DEFAULT_PDF_CONFIG, MOCK_INVENTORY, INITIAL_REPORTS, MOCK_POLLS, MOCK_RONDA_LOGS } from '@/constants';
import { House, Announcement, Report, LetterRequest, PaymentStatus, UMKM, CashFlow, Official, RondaSchedule, PdfConfig, InventoryItem, AppNotification, Poll, PollOption, RondaCheckLog, MarketItem } from './types';
import { HouseMap } from './components/HouseMap';
import { SmartImage } from './components/SmartImage';
import { generateAnnouncementDraft, generateDashboardSummary } from './services/geminiService';
import { generateSuratPengantar, generateResidentReportPDF } from './services/pdfService';
import { AdminRouteWrapper } from './components/AdminComponents'; 
import { ChatBot } from './components/ChatBot';

// Firebase imports
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
        if ("Notification" in window && Notification.permission === "granted") {
            try {
                new Notification(notification.title, { body: notification.message, icon: '/vite.svg' });
            } catch (e) { console.error("Notification Error:", e); }
        }
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

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={toggleOpen} className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-brand-blue transition-colors">
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
                                        <p className="text-[10px] text-slate-400 mt-2">{new Date(n.date).toLocaleDateString()} • {new Date(n.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
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
      <div className="w-full"><HouseMap houses={houses} isAdmin={false} reports={reports} officials={officials} onReportHouse={(house: House) => navigate(`/services?tab=lapor&houseId=${house.id}`)} /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2"><div className="bg-brand-blue/10 p-2 rounded-lg"><Megaphone className="text-brand-blue" size={20} /></div> Info Terbaru</h2>
                </div>
                <div className="space-y-4">
                {announcements.map((ann:Announcement) => (
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
               {todayRonda && todayRonda.members.length > 0 ? todayRonda.members.map((member:string, i:number) => (
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
                     {activePolls.length > 0 ? (
                         <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                             {activePolls.map(renderPollCard)}
                         </div>
                     ) : (
                         <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 italic">
                             Tidak ada voting yang sedang berlangsung saat ini.
                         </div>
                     )}
                 </div>

                 {closedPolls.length > 0 && (
                     <div className="opacity-80 hover:opacity-100 transition-opacity">
                         <h2 className="text-xl font-black text-slate-500 mb-4 flex items-center gap-2"><History className="text-slate-400"/> Riwayat Voting</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {closedPolls.map(renderPollCard)}
                         </div>
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
    
    // Post Form State
    const [postTitle, setPostTitle] = useState('');
    const [postDesc, setPostDesc] = useState('');
    const [postPrice, setPostPrice] = useState('');
    const [postCategory, setPostCategory] = useState<'Jual' | 'Barter' | 'Gratis'>('Jual');
    const [postSeller, setPostSeller] = useState('');
    const [postContact, setPostContact] = useState('');
    const [postImage, setPostImage] = useState('');
    
    // Auth
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
        if (!isValid) {
            alert("Verifikasi Gagal! Kode Akses Rumah tidak valid.");
            return;
        }

        const newItem: any = {
            title: postTitle,
            description: postDesc,
            price: parseInt(postPrice) || 0,
            category: postCategory,
            sellerName: postSeller,
            sellerContact: postContact,
            image: postImage,
            date: new Date().toISOString(),
            status: 'Available',
            houseId: postHouseId
        };

        await addMarketItem(newItem);
        alert("Iklan berhasil ditayangkan!");
        setIsPostModalOpen(false);
        setPostTitle(''); setPostDesc(''); setPostPrice(''); setPostSeller(''); setPostContact(''); setPostImage(''); setAccessCode(''); setPostHouseId('');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 mb-24 animate-fade-in font-sans">
            <div className="relative rounded-3xl overflow-hidden bg-emerald-900 shadow-2xl shadow-emerald-200 min-h-[250px] flex items-center justify-center text-center px-6 py-12 mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-800 opacity-90"></div>
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-100 text-[10px] font-bold uppercase tracking-widest shadow-lg">
                        <ShoppingCart size={14} /> Marketplace Warga
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                        Bursa Warga RT 002
                    </h1>
                    <p className="text-emerald-50 text-sm md:text-base font-medium">
                        Jual barang bekas, barter tanaman, atau berbagi makanan. Dari warga, untuk warga.
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 sticky top-20 z-30 bg-slate-50/80 backdrop-blur-xl p-4 rounded-3xl border border-white/50 shadow-sm">
                <div className="flex w-full md:w-auto gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {['All', 'Jual', 'Barter', 'Gratis'].map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setFilter(cat)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filter === cat ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-emerald-50'}`}
                        >
                            {cat === 'All' ? 'Semua' : cat}
                        </button>
                    ))}
                </div>
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Cari barang..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setIsPostModalOpen(true)} 
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus size={16}/> Pasang Iklan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <div key={item.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                        <div className="relative h-48 bg-slate-100">
                            <SmartImage 
                                src={item.image} 
                                alt={item.title} 
                                className="w-full h-full"
                            />
                            <div className="absolute top-3 left-3 z-10">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide shadow-sm backdrop-blur-md ${
                                    item.category === 'Gratis' ? 'bg-emerald-500/90 text-white' : 
                                    item.category === 'Barter' ? 'bg-purple-500/90 text-white' : 
                                    'bg-blue-500/90 text-white'
                                }`}>
                                    {item.category}
                                </span>
                            </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight">{item.title}</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{item.description}</p>
                            
                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">{item.sellerName}</p>
                                    <p className={`font-black text-sm ${item.category === 'Gratis' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                        {item.category === 'Gratis' ? 'GRATIS' : item.category === 'Barter' ? 'BARTER' : `Rp ${item.price.toLocaleString()}`}
                                    </p>
                                </div>
                                <a 
                                    href={`https://wa.me/${item.sellerContact.replace(/^0/, '62').replace(/\D/g, '')}?text=Halo, saya tertarik dengan ${item.title} di Bursa Warga.`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                                >
                                    <MessageCircle size={20}/>
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredItems.length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-400 italic bg-white rounded-3xl border border-dashed border-slate-200">
                        Tidak ada barang yang ditemukan.
                    </div>
                )}
            </div>

            <Modal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} title="Pasang Iklan Bursa Warga">
                <form onSubmit={handlePostSubmit} className="space-y-4">
                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-xs text-yellow-800 mb-2">
                        Gunakan Link Google Drive untuk foto jika ukurannya besar atau berupa file PDF/dokumen. Preview akan muncul otomatis.
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-700">Kategori</label>
                        <div className="flex gap-2">
                            {['Jual', 'Barter', 'Gratis'].map(cat => (
                                <button 
                                    type="button" 
                                    key={cat} 
                                    onClick={() => setPostCategory(cat as any)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${postCategory === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Judul Barang</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={postTitle} onChange={e=>setPostTitle(e.target.value)} required placeholder="Cth: Sepeda Lipat Polygon"/></div>
                    
                    {postCategory === 'Jual' && (
                        <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Harga (Rp)</label><input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={postPrice} onChange={e=>setPostPrice(e.target.value)} required/></div>
                    )}

                    <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Deskripsi Kondisi</label><textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm h-20" value={postDesc} onChange={e=>setPostDesc(e.target.value)} required placeholder="Jelaskan kondisi barang, minus, dll..."/></div>
                    
                    <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-700">Link Foto / Google Drive</label>
                        <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={postImage} onChange={e=>setPostImage(e.target.value)} placeholder="https://drive.google.com/..."/>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Nama Penjual</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={postSeller} onChange={e=>setPostSeller(e.target.value)} required placeholder="Nama Panggilan"/></div>
                        <div><label className="block text-xs font-bold mb-1.5 text-slate-700">No. WhatsApp</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={postContact} onChange={e=>setPostContact(e.target.value)} required placeholder="08..."/></div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-2">
                        <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><Lock size={14}/> Verifikasi Warga</h4>
                        <p className="text-[10px] text-slate-400">Verifikasi diperlukan karena Anda tidak memiliki akun. Hubungi Pak RT jika lupa Kode Akses.</p>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Blok Rumah Anda</label>
                            <input className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm" placeholder="Cth: C7-02" value={postHouseId} onChange={e=>setPostHouseId(e.target.value)} required/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Kode Akses Rumah (PIN)</label>
                            <input type="password" placeholder="PIN Rumah Anda" className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm" value={accessCode} onChange={e=>setAccessCode(e.target.value)} required/>
                        </div>
                    </div>

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
        if (!isValid) {
            alert("Verifikasi Gagal! Kode Akses Rumah tidak valid. Silakan hubungi Ketua RT jika lupa kode.");
            return;
        }

        const letterData: LetterRequest = { id: Date.now().toString(), type: requestType, applicantName, nik, familyHeadName, birthPlace, birthDate, gender, religion, job, maritalStatus, nationality, addressKtp, houseId, purposeDetail, status: 'Pending', date: new Date().toISOString().split('T')[0] }; 
        generateSuratPengantar(letterData, pdfConfig, true); 
        await addLetterToDb(letterData); 
        saveToHistory({...letterData, category: 'Surat', title: `Surat ${requestType}`}); 
        alert("Permohonan berhasil dikirim! Bukti DRAFT surat telah diunduh. Silakan hubungi Ketua RT untuk validasi."); 
        setApplicantName(''); setNik(''); setFamilyHeadName(''); setBirthPlace(''); setBirthDate(''); setJob(''); setAddressKtp(''); setHouseId(''); setPurposeDetail(''); setAccessCode('');
    };

    const handleSubmitLapor = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        const isValid = await validateResidentAccess(reporterHouseId, accessCode);
        if (!isValid) {
            alert("Verifikasi Pelapor Gagal! Kode Akses tidak cocok dengan Blok Rumah Anda.");
            return;
        }

        const newReport: any = { type: reportType, description: reportDesc, reporterName: reporterName || "Anonim", date: new Date().toISOString().split('T')[0], status: 'Baru', houseId: reportHouseId ? reportHouseId.toUpperCase() : undefined }; 
        await addReportToDb(newReport); 
        await addNotificationToDb({ title: `Laporan Warga: ${reportType}`, message: `${reporterName || 'Warga'} melaporkan: ${reportDesc}`, date: new Date().toISOString(), type: 'Alert', target: 'All', isRead: false });
        saveToHistory({...newReport, category: 'Laporan', title: `Laporan ${newReport.type}`}); 
        alert("Laporan berhasil dikirim!"); 
        setReportDesc(''); setReporterName(''); setReportHouseId(''); setReporterHouseId(''); setAccessCode('');
    };
    
    const clearHistory = () => { if(confirm("Hapus riwayat lokal?")) { setLocalHistory([]); localStorage.removeItem('userRequestHistory'); } }
    const reportTags = [{label: "Lampu Mati", icon: CloudRain}, {label: "Sampah Numpuk", icon: Trash2}, {label: "Selokan Mampet", icon: ArrowDownRight}, {label: "Hewan Liar", icon: AlertTriangle}, {label: "Orang Asing", icon: User}];
  
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-20">
         <div className="text-center mb-8 md:mb-10"><span className="inline-block px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-[10px] font-bold uppercase tracking-wider mb-2">Pusat Layanan Warga</span><h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Layanan Digital RT 002</h1><p className="text-sm md:text-base text-slate-500 mt-2 max-w-xl mx-auto">Sistem pelayanan mandiri untuk pembuatan surat pengantar, pelaporan masalah, dan pemantauan aktivitas lingkungan.</p></div>
         <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[600px]">
            <div className="w-full md:w-72 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-4 md:p-6 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar snap-x">
               <button onClick={() => setActiveTab('surat')} className={`flex-none min-w-[140px] md:min-w-0 p-4 rounded-2xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'surat' ? 'bg-white text-brand-blue shadow-lg shadow-blue-100 ring-1 ring-blue-100' : 'hover:bg-white hover:shadow-sm text-slate-500 hover:text-brand-blue'}`}><div className={`p-2 rounded-xl ${activeTab==='surat' ? 'bg-blue-50' : 'bg-slate-100'}`}><FileText size={20} className="shrink-0" /></div><div><span className="font-bold block text-sm">Surat Pengantar</span><span className="text-[10px] opacity-70 hidden md:block mt-1">KTP, KK, Domisili, dll</span></div></button>
               <button onClick={() => setActiveTab('lapor')} className={`flex-none min-w-[140px] md:min-w-0 p-4 rounded-2xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'lapor' ? 'bg-white text-rose-600 shadow-lg shadow-rose-100 ring-1 ring-rose-100' : 'hover:bg-white hover:shadow-sm text-slate-500 hover:text-brand-blue'}`}><div className={`p-2 rounded-xl ${activeTab==='lapor' ? 'bg-rose-50' : 'bg-slate-100'}`}><AlertTriangle size={20} className="shrink-0" /></div><div><span className="font-bold block text-sm">Lapor Pak RT</span><span className="text-[10px] opacity-70 hidden md:block mt-1">Keamanan & Fasilitas</span></div></button>
               <button onClick={() => setActiveTab('history')} className={`flex-none min-w-[140px] md:min-w-0 p-4 rounded-2xl text-left flex items-center md:items-start md:flex-col gap-3 transition-all snap-start ${activeTab === 'history' ? 'bg-white text-emerald-600 shadow-lg shadow-emerald-100 ring-1 ring-emerald-100' : 'hover:bg-white hover:shadow-sm text-slate-500 hover:text-brand-blue'}`}><div className={`p-2 rounded-xl ${activeTab==='history' ? 'bg-emerald-50' : 'bg-slate-100'}`}><History size={20} className="shrink-0" /></div><div><span className="font-bold block text-sm">Riwayat Saya</span><span className="text-[10px] opacity-70 hidden md:block mt-1">Log Aktivitas Lokal</span></div></button>
            </div>
            <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white/50 relative">
               {activeTab === 'surat' && (
                  <div className="animate-fade-in max-w-2xl mx-auto space-y-8">
                     <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-800 text-sm"><HelpCircle className="shrink-0" size={20}/><div><p className="font-bold mb-1">Panduan Pengajuan:</p><ul className="list-disc ml-4 space-y-1 text-xs"><li>Isi formulir dengan data yang <strong>valid</strong> sesuai KTP.</li><li>Sistem akan mengunduh bukti <strong>DRAFT (Format PDF)</strong>.</li><li>Surat DRAFT <strong>belum sah</strong> (tanpa TTD/Stempel). Hubungi Ketua RT untuk validasi dan mendapatkan surat resmi.</li></ul></div></div>
                     <form onSubmit={handleSubmitSurat} className="space-y-6">
                         <div className="space-y-4"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2"><FileText size={16}/> Data Surat</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Jenis Surat</label><select className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={requestType} onChange={e=>setRequestType(e.target.value as any)}><option>Surat Izin Keramaian</option><option>Surat Keterangan Usaha (SKU)</option><option>Pengantar KTP</option><option>Pengantar KK</option><option>Domisili</option><option>Kematian</option><option>Kelahiran</option></select></div></div></div>
                         <div className="space-y-4"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2"><User size={16}/> Identitas Pemohon</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Nama Lengkap</label><input placeholder="Sesuai KTP" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={applicantName} onChange={e=>setApplicantName(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">NIK</label><input placeholder="16 Digit Angka" type="number" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={nik} onChange={e=>setNik(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Kepala Keluarga</label><input placeholder="Nama Kepala Keluarga" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={familyHeadName} onChange={e=>setFamilyHeadName(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Tempat Lahir</label><input placeholder="Kota Kelahiran" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={birthPlace} onChange={e=>setBirthPlace(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Tanggal Lahir</label><input type="date" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all text-slate-600" value={birthDate} onChange={e=>setBirthDate(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Jenis Kelamin</label><select className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={gender} onChange={e=>setGender(e.target.value as any)}><option>Laki-laki</option><option>Perempuan</option></select></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Agama</label><select className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={religion} onChange={e=>setReligion(e.target.value)}><option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option></select></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Pekerjaan</label><input placeholder="Cth: Karyawan Swasta" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={job} onChange={e=>setJob(e.target.value)} required/></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Kewarganegaraan</label><input placeholder="Indonesia" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={nationality} onChange={e=>setNationality(e.target.value)} required/></div><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Status Perkawinan</label><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{['Kawin', 'Belum Kawin', 'Cerai Hidup', 'Cerai Mati'].map(status => (<button type="button" key={status} onClick={() => setMaritalStatus(status as any)} className={`p-2 rounded-lg text-xs font-bold border transition-all ${maritalStatus === status ? 'bg-brand-blue text-white border-brand-blue shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{status}</button>))}</div></div></div></div>
                         <div className="space-y-4"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2"><MapIcon size={16}/> Alamat & Keperluan</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Alamat Domisili (Blok Rumah)</label><input placeholder="Cth: C5-05 (Wajib diisi)" className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all" value={houseId} onChange={e=>setHouseId(e.target.value)} required/></div><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Alamat Sesuai KTP</label><textarea placeholder="Jalan, RT/RW, Kelurahan, Kecamatan..." className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all h-20" value={addressKtp} onChange={e=>setAddressKtp(e.target.value)} required/></div><div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Keperluan</label><textarea placeholder="Sebagai pengantar untuk mendapatkan Surat Izin Keramaian..." className="p-3 bg-slate-50 border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 rounded-xl w-full text-sm outline-none transition-all h-32" value={purposeDetail} onChange={e=>setPurposeDetail(e.target.value)} required/></div></div></div>
                         
                         <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                             <h4 className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-2"><Lock size={14}/> Verifikasi Keamanan</h4>
                             <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Kode Akses Rumah (PIN)</label>
                             <input type="password" placeholder="Masukkan Kode Unik Rumah Anda" className="w-full p-3 bg-white border border-slate-300 focus:border-brand-blue rounded-xl text-sm outline-none transition-all" value={accessCode} onChange={e=>setAccessCode(e.target.value)} required/>
                             <p className="text-[10px] text-slate-400 mt-1">*Wajib diisi untuk memvalidasi bahwa Anda adalah warga asli.</p>
                         </div>

                         <div className="pt-4"><Button type="submit" className="w-full py-3.5 text-base shadow-lg shadow-blue-200"><Download size={20}/> Ajukan Permohonan & Unduh Draft</Button></div>
                     </form>
                  </div>
               )}
               {activeTab === 'lapor' && (
                  <div className="animate-fade-in max-w-lg mx-auto md:mx-0 space-y-6">
                      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6"><h3 className="font-bold text-rose-700 text-lg mb-1 flex items-center gap-2"><AlertTriangle size={20}/> Form Laporan Larga</h3><p className="text-xs text-rose-600">Laporan Anda akan masuk ke dashboard Ketua RT & Keamanan. Gunakan fitur ini secara bijak.</p></div>
                      <form onSubmit={handleSubmitLapor} className="space-y-6">
                          <div className="space-y-4"><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Kategori Masalah</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" value={reportType} onChange={e=>setReportType(e.target.value as any)}><option>Keamanan</option><option>Kebersihan</option><option>Fasilitas</option><option>Lainnya</option></select></div><div><label className="block text-xs font-bold text-slate-700 mb-2 ml-1">Pilih Masalah Cepat (Klik untuk isi)</label><div className="flex flex-wrap gap-2">{reportTags.map((tag, idx) => (<button type="button" key={idx} onClick={() => setReportDesc(tag.label)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all"><tag.icon size={12} /> {tag.label}</button>))}</div></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Lokasi Kejadian / Blok Rumah</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="Cth: C5-05 (Wajib diisi)" value={reportHouseId} onChange={e=>setReportHouseId(e.target.value)} required /></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Deskripsi Lengkap</label><textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-32 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="Jelaskan detail kejadian..." value={reportDesc} onChange={e=>setReportDesc(e.target.value)} required></textarea></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Nama Pelapor (Opsional)</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="Boleh dikosongkan jika ingin anonim" value={reporterName} onChange={e=>setReporterName(e.target.value)} /></div></div>
                          
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                             <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><Lock size={14}/> Verifikasi Pelapor</h4>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Blok Rumah Anda</label>
                                 <input className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm" placeholder="Cth: C7-02" value={reporterHouseId} onChange={e=>setReporterHouseId(e.target.value)} required/>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Kode Akses Rumah (PIN)</label>
                                 <input type="password" placeholder="PIN Rumah Anda" className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm" value={accessCode} onChange={e=>setAccessCode(e.target.value)} required/>
                             </div>
                          </div>

                          <Button type="submit" className="w-full py-3.5 bg-rose-600 text-white shadow-lg shadow-rose-200 hover:bg-rose-700 border-transparent"><Send size={18}/> Kirim Laporan</Button>
                      </form>
                  </div>
               )}
               {activeTab === 'history' && (
                   <div className="animate-fade-in space-y-4 max-w-xl">
                       <div className="flex justify-between items-center mb-6 pb-4 border-b"><div><h3 className="font-bold text-lg text-slate-800">Riwayat Aktivitas</h3><p className="text-xs text-slate-400">Log tersimpan di perangkat ini (Local Storage).</p></div><button onClick={clearHistory} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold hover:bg-rose-50 hover:text-rose-600 transition-colors">Hapus Log</button></div>
                       <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">{localHistory.length === 0 ? (<div className="pl-6 text-slate-400 italic text-sm">Belum ada riwayat aktivitas.</div>) : (localHistory.map((item: any, idx: number) => (<div key={idx} className="relative pl-6 group"><div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${item.category === 'Laporan' ? 'bg-rose-500' : 'bg-brand-blue'}`}></div><div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-md transition-all"><div className="flex justify-between items-start mb-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${item.category === 'Laporan' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-brand-blue'}`}>{item.category}</span><span className="text-[10px] text-slate-400 font-medium">{item.date}</span></div><h4 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h4><p className="text-xs text-slate-500 line-clamp-2">{item.type && `Jenis: ${item.type}`} • {item.description || item.applicantName || "Detail tersimpan"}</p></div></div>)))}</div>
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
  const categories = ['All', 'Kuliner', 'Jasa', 'Fashion', 'Retail', 'Kerajinan', 'Lainnya'];
  const filteredUMKM = umkmData.filter(u => (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.description.toLowerCase().includes(searchTerm.toLowerCase())) && (filterCategory === 'All' || u.category === filterCategory));
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 mb-24 md:mb-24 space-y-8 animate-fade-in font-sans">
      <div className="relative rounded-3xl overflow-hidden bg-violet-950 shadow-2xl shadow-violet-200 min-h-[300px] flex items-center justify-center text-center px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 opacity-90"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-yellow-300 text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-lg">
              <Store size={14} className="animate-bounce-slow" /> Ekonomi Warga RT 002
           </div>
           <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              Dukung Usaha Tetangga,<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">Majukan Ekonomi Warga</span>
           </h1>
           <p className="text-violet-100 text-sm md:text-lg font-medium leading-relaxed max-w-lg mx-auto">
              Temukan berbagai produk kuliner lezat, jasa terpercaya, dan kerajinan tangan kreatif dari warga sekitar kita.
           </p>
        </div>
      </div>
      <div className="sticky top-20 z-40 -mt-12 px-2">
         <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-3 shadow-xl shadow-slate-200/50 border border-white/60 ring-1 ring-white/50 flex flex-col md:flex-row gap-3 transition-all">
            <div className="relative flex-1 group">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/50 backdrop-blur-sm p-2 rounded-xl text-slate-400 group-focus-within:bg-violet-50 group-focus-within:text-violet-500 transition-colors">
                  <Search size={18} />
               </div>
               <input type="text" placeholder="Cari nasi kuning, laundry, atau jasa..." className="w-full pl-14 pr-4 py-4 bg-white/50 hover:bg-white focus:bg-white border-2 border-transparent focus:border-violet-200 rounded-2xl outline-none text-sm font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-1 md:pb-0 px-1">
               {categories.map(cat => (<button key={cat} onClick={() => setFilterCategory(cat)} className={`whitespace-nowrap px-6 py-3.5 rounded-2xl text-xs font-bold transition-all active:scale-95 ${filterCategory === cat ? 'bg-violet-600 text-white shadow-lg shadow-violet-300 ring-2 ring-violet-200' : 'bg-white/80 text-slate-500 border border-white shadow-sm hover:bg-white hover:text-slate-700'}`}>{cat}</button>))}
            </div>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
         {filteredUMKM.map(u => (
            <div key={u.id} className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-violet-200/50 hover:-translate-y-2 transition-all duration-300 flex flex-col overflow-hidden relative isolate">
               <div className="h-64 relative overflow-hidden bg-slate-100 rounded-t-3xl">
                  <SmartImage 
                    src={u.image} 
                    alt={u.name} 
                    className="w-full h-full"
                    fallbackIcon={Store}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-white/95 backdrop-blur-md text-violet-700 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 shadow-sm">
                        <ShoppingBag size={12} className="text-violet-500" /> {u.category}
                    </span>
                  </div>
               </div>
               <div className="p-6 flex-1 flex flex-col bg-white relative -mt-12 mx-4 mb-4 rounded-3xl shadow-lg border border-slate-50">
                  <div className="flex justify-between items-start mb-3"><h3 className="font-black text-xl text-slate-800 leading-tight group-hover:text-violet-700 transition-colors line-clamp-2">{u.name}</h3><div className="shrink-0" title={`Pemilik: ${u.owner}`}><div className="w-10 h-10 rounded-full border-2 border-white shadow-md bg-slate-100 overflow-hidden"><img src={`https://ui-avatars.com/api/?name=${u.owner}&background=random`} alt={u.owner} /></div></div></div>
                  <div className="flex items-center gap-2 mb-4"><User size={14} className="text-slate-400"/><span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{u.owner}</span></div>
                  <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex-1 border border-slate-100"><p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{u.description}</p></div>
                  <a href={`https://wa.me/${u.contact.replace(/^0/, '62').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-300 transition-all active:scale-95 group/btn"><MessageCircle size={20} className="group-hover/btn:animate-bounce"/> Hubungi Penjual</a>
               </div>
            </div>
         ))}
         {filteredUMKM.length === 0 && (
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 animate-slide-up shadow-sm">
              <div className="bg-violet-50 p-8 rounded-full shadow-inner mb-6 relative"><Store size={64} className="text-violet-300 relative z-10" /></div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Belum ada UMKM ditemukan</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-8 text-sm">Coba cari dengan kata kunci lain atau pilih kategori berbeda.</p>
              <button onClick={() => {setSearchTerm(''); setFilterCategory('All')}} className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-bold text-sm hover:bg-slate-700 transition-all shadow-lg active:scale-95">Reset Pencarian</button>
            </div>
         )}
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
    const roleHierarchy = ['Ketua RT', 'Sekretaris', 'Bendahara', 'Bendahara RW', 'Koord. Keamanan', 'Seksi'];
    const sortedOfficials = [...officials].sort((a, b) => { const indexA = roleHierarchy.findIndex(r => a.role.includes(r)); const indexB = roleHierarchy.findIndex(r => b.role.includes(r)); return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB); });
    const [activeRondaDay, setActiveRondaDay] = useState(new Date().toLocaleDateString('id-ID', {weekday:'long'}));

    const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
    const [checkLocation, setCheckLocation] = useState('');
    const [checkOfficer, setCheckOfficer] = useState('');
    
    const handleCheckSubmit = async (status: 'Aman' | 'Mencurigakan') => {
        if (!checkOfficer || !checkLocation) { alert("Nama petugas dan lokasi wajib diisi!"); return; }
        const newLog: any = {
            officerName: checkOfficer,
            location: checkLocation,
            status,
            timestamp: new Date().toISOString(),
            note: status === 'Aman' ? 'Kondisi aman terkendali.' : 'Perlu pemantauan lebih lanjut.'
        };
        await addRondaLog(newLog);
        alert(`Laporan patroli (${status}) tercatat!`);
        setIsCheckModalOpen(false);
        setCheckLocation('');
    };
    
    return (
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-20 space-y-8 animate-fade-in">
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl shadow-indigo-900/20 min-h-[400px] flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950"></div>
                <div className="relative z-10 text-center px-6 py-12 md:py-16 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-widest uppercase mb-6 backdrop-blur-sm shadow-lg shadow-indigo-900/50">
                        Transparansi Publik RT 002
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight drop-shadow-sm">
                        Pusat Informasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Terpadu</span>
                    </h1>
                    <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
                        Akses data kepengurusan, laporan keuangan, dan jadwal kegiatan lingkungan secara terbuka, akuntabel, dan realtime.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 relative overflow-hidden group hover:scale-[1.02] transition-transform"><div className="absolute -right-6 -top-6 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Wallet size={140}/></div><div className="relative z-10"><p className="text-emerald-100 font-medium text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><ShieldCheck size={14}/> Keuangan Warga</p><h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">Rp {currentBalance.toLocaleString()}</h2><div className="flex gap-3 text-xs font-bold"><div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl flex items-center gap-1.5 border border-white/10"><div className="bg-white/20 p-1 rounded-full"><ArrowUpRight size={10} className="text-emerald-200"/></div>+{totalIncome.toLocaleString()}</div><div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl flex items-center gap-1.5 border border-white/10"><div className="bg-white/20 p-1 rounded-full"><ArrowDownRight size={10} className="text-rose-200"/></div>-{totalExpense.toLocaleString()}</div></div></div></div>
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-100 flex flex-col justify-between group hover:border-brand-blue/30 transition-colors"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Struktur Organisasi</p><h2 className="text-4xl font-black text-slate-800 mt-2">{officials.length} <span className="text-lg font-medium text-slate-400">Personil</span></h2></div><div className="bg-brand-blue/5 p-4 rounded-2xl text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors"><Briefcase size={28}/></div></div><p className="text-xs text-slate-400 mt-4 leading-relaxed">Siap melayani kebutuhan administrasi, keamanan, dan sosial warga RT 002.</p></div>
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-100 flex flex-col justify-between group hover:border-indigo-200 transition-colors"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Jadwal Keamanan</p><h2 className="text-xl font-black text-slate-800 mt-2 capitalize">{new Date().toLocaleDateString('id-ID', {weekday:'long'})}</h2></div><div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Moon size={28}/></div></div><div className="mt-4"><div className="flex -space-x-2 overflow-hidden py-1">{ronda.find(r => r.day === new Date().toLocaleDateString('id-ID', {weekday:'long'}))?.members.slice(0,4).map((m,i) => (<div key={i} className="w-9 h-9 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-sm" title={m}>{m.charAt(0)}</div>)) || <span className="text-sm text-slate-400 italic">Tidak ada jadwal</span>}</div><p className="text-[10px] text-slate-400 mt-2">*Tim Siskamling Malam Ini</p></div></div>
            </div>
            
            <section className="pt-8 border-t border-slate-200"><div className="flex items-center gap-3 mb-8"><div className="bg-purple-100 p-2.5 rounded-xl text-purple-600"><Users size={24}/></div><div><h2 className="text-xl md:text-2xl font-bold text-slate-800">Struktur Pengurus RT</h2><p className="text-sm text-slate-500">Periode Jabatan 2023 - 2026</p></div></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{sortedOfficials.map(o => (<div key={o.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"><div className={`h-24 relative ${o.role.includes('Ketua') ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-slate-700'}`}><div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div></div><div className="px-6 pb-6 text-center -mt-12 relative"><div className="inline-block p-1.5 bg-white rounded-full shadow-lg"><img src={o.photo||`https://ui-avatars.com/api/?name=${o.name}&background=random&size=128`} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 bg-slate-100" alt={o.name}/></div><h3 className="font-bold text-slate-800 text-lg mt-3">{o.name}</h3><div className="mt-1 mb-4"><span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${o.role.includes('Ketua') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{o.role}</span></div><div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-2 text-left"><div className="bg-slate-50 p-2 rounded-xl"><p className="text-[10px] text-slate-400 font-bold uppercase">Domisili</p><p className="text-xs font-bold text-slate-700 flex items-center gap-1"><Home size={10}/> {o.houseId}</p></div><a href={`https://wa.me/${o.phone}`} target="_blank" rel="noreferrer" className="bg-green-50 hover:bg-green-100 p-2 rounded-xl transition-colors cursor-pointer"><p className="text-[10px] text-green-600 font-bold uppercase">Kontak</p><p className="text-xs font-bold text-green-700 flex items-center gap-1"><Phone size={10}/> WhatsApp</p></a></div></div></div>))}</div></section>
        
            <Modal isOpen={isCheckModalOpen} onClose={() => setIsCheckModalOpen(false)} title="Laporan Patroli Digital">
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                        <p className="text-xs font-bold text-slate-500 uppercase">Waktu Check-In</p>
                        <p className="text-xl font-black text-slate-800 font-mono mt-1">{new Date().toLocaleTimeString()}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-700">Nama Petugas</label>
                        <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" placeholder="Nama Anda" value={checkOfficer} onChange={e => setCheckOfficer(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-700">Lokasi / Titik Pantau</label>
                        <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={checkLocation} onChange={e => setCheckLocation(e.target.value)}>
                            <option value="">-- Pilih Lokasi --</option>
                            <option value="Gerbang Utama">Gerbang Utama</option>
                            <option value="Pos Satpam">Pos Satpam</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button onClick={() => handleCheckSubmit('Aman')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex flex-col items-center justify-center gap-1">
                            <CheckCircle size={24}/>
                            <span>AMAN</span>
                        </button>
                        <button onClick={() => handleCheckSubmit('Mencurigakan')} className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-200 transition-all active:scale-95 flex flex-col items-center justify-center gap-1">
                            <AlertTriangle size={24}/>
                            <span>MENCURIGAKAN</span>
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// --- Admin Dashboard (RECONSTRUCTED) ---

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
  const [cashDesc, setCashDesc] = useState(''); 
  const [cashAmount, setCashAmount] = useState(''); 
  const [cashType, setCashType] = useState<'Income' | 'Expense'>('Income'); 
  const [cashCategory, setCashCategory] = useState('Iuran');
  const [editingCashId, setEditingCashId] = useState<string | null>(null);
  const [pollTitle, setPollTitle] = useState('');
  const [pollDesc, setPollDesc] = useState('');
  const [pollDeadline, setPollDeadline] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [offName, setOffName] = useState(''); const [offRole, setOffRole] = useState(''); const [offPhone, setOffPhone] = useState(''); const [offHouse, setOffHouse] = useState(''); const [offPhoto, setOffPhoto] = useState(''); const [offId, setOffId] = useState<string|null>(null);
  const [invName, setInvName] = useState(''); const [invTotal, setInvTotal] = useState(''); const [invAvailable, setInvAvailable] = useState(''); const [invCondition, setInvCondition] = useState<'Baik'|'Perlu Perbaikan'|'Rusak'>('Baik'); const [invNotes, setInvNotes] = useState(''); const [invId, setInvId] = useState<string|null>(null);
  const [umkmName, setUmkmName] = useState(''); const [umkmOwner, setUmkmOwner] = useState(''); const [umkmCategory, setUmkmCategory] = useState('Kuliner'); const [umkmDesc, setUmkmDesc] = useState(''); const [umkmContact, setUmkmContact] = useState(''); const [umkmImage, setUmkmImage] = useState(''); const [umkmId, setUmkmId] = useState<string|null>(null);
  const [rondaDay, setRondaDay] = useState(''); const [rondaMembers, setRondaMembers] = useState(''); const [selectedRondaId, setSelectedRondaId] = useState<string|null>(null);
  const [duesHouseId, setDuesHouseId] = useState(''); const [duesAmount, setDuesAmount] = useState('25000'); const [duesStatus, setDuesStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  const [bulkStatus, setBulkStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editHouseForm, setEditHouseForm] = useState({
      headOfFamily: '', occupants: 0, phone: '', paymentStatus: '', unifiedStatus: 'Tetap',
      hasPregnant: false, hasBaby: false, hasToddler: false, hasTeenager: false, hasElderly: false,
      accessCode: '' 
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [draftTopic, setDraftTopic] = useState('');
  const [localConfig, setLocalConfig] = useState<PdfConfig>(pdfConfig);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
      const unsubMarket = subscribeToMarketItems((data) => setMarketItems(data));
      return () => unsubMarket();
  }, []);

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
      setImportFile(null);
      setFormErrors({});
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          const allIds = filteredHouses.map(h => h.id);
          setSelectedIds(new Set(allIds));
      } else {
          setSelectedIds(new Set());
      }
  };

  const handleSelectOne = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };
  
  const handleBulkDuesUpdate = () => {
      if (selectedIds.size === 0) return;
      setBulkStatus(PaymentStatus.PAID);
      setModalType('bulkDues');
      setIsModalOpen(true);
  };

  const handleSaveBulkDues = async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedIds.size === 0) return;
      const updates = Array.from(selectedIds).map(id => ({ id, paymentStatus: bulkStatus }));
      try {
          await batchUpdateHouses(updates);
          alert(`Berhasil memperbarui status ${updates.length} warga.`);
          setIsModalOpen(false);
          setSelectedIds(new Set());
          resetForms();
      } catch (e) {
          console.error(e);
          alert("Gagal melakukan update massal.");
      }
  };

  const handleGenerateBulkPins = async () => {
      const isSelective = selectedIds.size > 0;
      const targetHouses = isSelective 
          ? houses.filter((h: House) => selectedIds.has(h.id))
          : houses.filter((h: House) => !h.accessCode || h.accessCode === '');

      if (targetHouses.length === 0) {
          alert("Semua warga sudah memiliki PIN.");
          return;
      }

      if (!confirm(`Generate PIN otomatis untuk ${targetHouses.length} rumah?`)) return;

      const updates = targetHouses.map((h: House) => {
          const randomSuffix = Array(4).fill(0).map(() => Math.floor(Math.random()*36).toString(36).toUpperCase()).join('');
          const newCode = `${h.block}-${h.number}-${randomSuffix}`;
          return { id: h.id, accessCode: newCode };
      });

      try {
          await batchUpdateHouses(updates);
          alert(`Berhasil generate ${updates.length} PIN baru!`);
          setSelectedIds(new Set());
      } catch (e) {
          alert("Gagal generate PIN massal.");
      }
  };

  const handleDeleteHouse = async (id: string) => { if(confirm("Hapus warga?")) await deleteHouseFromDb(id); };
  const handlePasswordChange = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) { alert("Password tidak cocok!"); return; }
      setIsChangingPassword(true);
      try { await updateAdminPassword(newPassword); alert("Password diubah!"); setNewPassword(''); setConfirmPassword(''); } 
      catch (err) { alert("Gagal. Login ulang diperlukan."); } 
      finally { setIsChangingPassword(false); }
  };
  const handleResetSystem = async () => {
      if (confirm("Reset sistem ke awal? Data akan hilang.")) {
          if (prompt("Ketik 'RESET'") === 'RESET') {
              try {
                  const initialData = { houses: generateHouses(), announcements: MOCK_ANNOUNCEMENTS, cashFlow: MOCK_CASHFLOW, officials: INITIAL_OFFICIALS, reports: INITIAL_REPORTS, ronda: MOCK_RONDA, inventory: MOCK_INVENTORY, umkm: MOCK_UMKM, polls: MOCK_POLLS, rondaLogs: MOCK_RONDA_LOGS };
                  await seedDatabase(initialData);
                  alert("Reset berhasil."); window.location.reload();
              } catch (e) { alert("Gagal reset."); }
          }
      }
  };
  const handleExportData = () => {
      const data = { houses, announcements, cashFlow, officials, reports, letters, ronda, inventory, umkm, polls };
      const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", jsonString);
      downloadAnchorNode.setAttribute("download", `backup_rt002_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleAiAnalysis = async () => {
      setIsAnalyzing(true);
      const totalResidents = houses.reduce((acc:any, h:any) => acc + (h.occupants || 0), 0);
      const income = cashFlow.filter((c:any) => c.type === 'Income').reduce((acc:any, c:any) => acc + c.amount, 0);
      const expense = cashFlow.filter((c:any) => c.type === 'Expense').reduce((acc:any, c:any) => acc + c.amount, 0);
      const balance = income - expense;
      const newReports = reports.filter((r:any) => r.status === 'Baru').length;
      const unpaid = houses.filter((h:any) => h.paymentStatus !== 'Lunas').length;
      const result = await generateDashboardSummary({ totalResidents, cashBalance: balance, reportsCount: newReports, unpaidCount: unpaid });
      setAiAnalysis(result);
      setIsAnalyzing(false);
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    await addAnnouncementToDb({ title: annTitle, content: annContent, type: annType, date: new Date().toISOString() }); 
    if (annNotify) await addNotificationToDb({ title: `Pengumuman: ${annTitle}`, message: annContent, date: new Date().toISOString(), type: annType === 'Urgent' ? 'Alert' : 'Info', target: 'All', isRead: false });
    setIsModalOpen(false); resetForms(); 
  };
  const handleDeleteAnnouncement = async (id: string) => { if (confirm("Hapus?")) await deleteAnnouncementFromDb(id); };
  const handleGenerateDraft = async () => { if(!draftTopic) return; setIsGenerating(true); const draft = await generateAnnouncementDraft(draftTopic); setAnnContent(draft); setAnnTitle(draftTopic); setIsGenerating(false); };
  
  const handleSaveTransaction = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    const transactionData = { description: cashDesc, amount: parseInt(cashAmount), type: cashType, category: cashCategory, date: new Date().toISOString().split('T')[0] };
    if (editingCashId) await updateTransactionInDb(editingCashId, transactionData); else await addTransactionToDb(transactionData);
    setIsModalOpen(false); resetForms(); 
  };
  const openEditCash = (cf: CashFlow) => { setEditingCashId(cf.id); setCashDesc(cf.description); setCashAmount(cf.amount.toString()); setCashType(cf.type); setCashCategory(cf.category); setModalType('cash'); setIsModalOpen(true); };
  const handleDeleteTransaction = async (id: string) => { if (confirm("Hapus?")) await deleteTransactionFromDb(id); };
  const handleSaveDues = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!duesHouseId) return; 
    await updateHouseData(duesHouseId, { paymentStatus: duesStatus }); 
    if (duesStatus === PaymentStatus.PAID) { const house = houses.find((h:House) => h.id === duesHouseId); await addTransactionToDb({ description: `Iuran Warga ${duesHouseId} (${house?.headOfFamily || 'Warga'})`, amount: parseInt(duesAmount), type: 'Income', category: 'Iuran Warga', date: new Date().toISOString().split('T')[0] }); } 
    setIsModalOpen(false); resetForms(); 
  };
  
  const handleSaveInventory = async (e: React.FormEvent) => { e.preventDefault(); const itemData = { name: invName, total: parseInt(invTotal), available: parseInt(invAvailable), condition: invCondition, notes: invNotes }; if (invId) await updateInventoryInDb(invId, itemData); else await addInventoryToDb(itemData); setIsModalOpen(false); resetForms(); };
  const openEditInventory = (item: InventoryItem) => { setInvId(item.id); setInvName(item.name); setInvTotal(item.total.toString()); setInvAvailable(item.available.toString()); setInvCondition(item.condition); setInvNotes(item.notes || ''); setModalType('inventory'); setIsModalOpen(true); };
  const handleDeleteInventory = async (id: string) => { if(confirm("Hapus?")) await deleteInventoryFromDb(id); };
  
  const handleSaveUMKM = async (e: React.FormEvent) => { e.preventDefault(); const umkmData = { name: umkmName, owner: umkmOwner, category: umkmCategory, description: umkmDesc, contact: umkmContact, image: umkmImage }; if (umkmId) await updateUMKMInDb(umkmId, umkmData); else await addUMKMToDb(umkmData); setIsModalOpen(false); resetForms(); };
  const openEditUMKM = (u: UMKM) => { setUmkmId(u.id); setUmkmName(u.name); setUmkmOwner(u.owner); setUmkmCategory(u.category); setUmkmDesc(u.description); setUmkmContact(u.contact); setUmkmImage(u.image); setModalType('umkm'); setIsModalOpen(true); };
  const handleDeleteUMKM = async (id: string) => { if (confirm("Hapus?")) await deleteUMKMFromDb(id); };
  
  const openEditRonda = (schedule: RondaSchedule) => { if (!schedule.id) return; setSelectedRondaId(schedule.id); setRondaDay(schedule.day); setRondaMembers(schedule.members.join(', ')); setModalType('ronda'); setIsModalOpen(true); };
  const handleSaveRonda = async (e: React.FormEvent) => { e.preventDefault(); if (!selectedRondaId) return; const membersArray = rondaMembers.split(',').map(m => m.trim()).filter(m => m !== ''); await updateRondaSchedule(selectedRondaId, membersArray); setIsModalOpen(false); resetForms(); };
  
  const handleSaveOfficial = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      const officialData = { name: offName, role: offRole, phone: offPhone, houseId: offHouse, photo: offPhoto || undefined }; 
      if (offId) await updateOfficialInDb(offId, officialData); 
      else await addOfficialToDb(officialData); 
      setIsModalOpen(false); resetForms(); 
  };
  const handleDeleteOfficial = async (id: string) => { if (confirm("Hapus?")) await deleteOfficialFromDb(id); };
  const handleEditOfficial = (o: Official) => { 
      setOffId(o.id); setOffName(o.name); setOffRole(o.role); setOffPhone(o.phone); setOffHouse(o.houseId); setOffPhoto(o.photo||''); 
      setModalType('official'); setIsModalOpen(true); 
  };
  const openDuesModal = (h: House) => { setDuesHouseId(h.id); setDuesStatus(PaymentStatus.PAID); setModalType('dues'); setIsModalOpen(true); };
  
  const handleUpdateReport = async (id: string, s: string) => { await updateReportStatus(id, s); if (s === 'Selesai') await addNotificationToDb({ title: "Laporan Ditindaklanjuti", message: "Laporan Anda telah ditandai selesai oleh Admin.", date: new Date().toISOString(), type: 'Success', target: 'All' }); };
  const handleDeleteReport = async (id: string) => await deleteReportFromDb(id);
  const handleUpdateLetter = async (id: string, s: string) => await updateLetterStatus(id, s);
  const handleDeleteLetter = async (id: string) => await deleteLetterFromDb(id);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PdfConfig) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setLocalConfig(prev => ({ ...prev, [field]: reader.result as string })); reader.readAsDataURL(file); } };
  const handleSaveConfig = () => { try { setPdfConfig(localConfig); localStorage.setItem('pdf_config', JSON.stringify(localConfig)); alert("Konfigurasi tersimpan!"); } catch (e) { alert("Gagal menyimpan."); } };

  const handleDeleteMarketItem = async (id: string) => { if(confirm("Hapus iklan ini?")) await deleteMarketItem(id); };
  const handleMarkSold = async (id: string) => { if(confirm("Tandai terjual?")) await updateMarketItemStatus(id, 'Sold'); };

  const openEditHouse = (h: House) => { 
      setSelectedHouse(h); 
      let unified = 'Tetap'; 
      if(h.status === 'Empty') unified = 'Empty'; 
      else if(h.status === 'Business') unified = 'Business'; 
      else if(h.residenceType === 'Kost') unified = 'Kost'; 
      else if(h.residenceType === 'Kontrak') unified = 'Kontrak'; 
      
      setEditHouseForm({ 
          headOfFamily: h.status === 'Empty' || h.headOfFamily === '-' ? '' : h.headOfFamily, 
          occupants: h.status === 'Empty' ? 1 : h.occupants || 1, 
          phone: h.status === 'Empty' || h.phone === '-' ? '' : h.phone, 
          paymentStatus: h.paymentStatus, 
          unifiedStatus: unified, 
          hasPregnant: h.hasPregnant||false, 
          hasBaby: h.hasBaby||false, 
          hasToddler: h.hasToddler||false, 
          hasTeenager: h.hasTeenager||false, 
          hasElderly: h.hasElderly||false,
          accessCode: h.accessCode || ''
      }); 
      setModalType('editHouse'); 
      setIsModalOpen(true); 
  };

  const handleSaveHouse = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if(!selectedHouse) return; 
      
      let status: House['status'] = 'Occupied'; 
      let residenceType: House['residenceType'] = 'Tetap'; 
      if(editHouseForm.unifiedStatus === 'Empty') status = 'Empty'; 
      else if(editHouseForm.unifiedStatus === 'Business') status = 'Business'; 
      else residenceType = editHouseForm.unifiedStatus as any; 
      
      const payload = { 
          headOfFamily: status === 'Empty' ? '-' : editHouseForm.headOfFamily, 
          occupants: status === 'Empty' ? 0 : parseInt(editHouseForm.occupants as any), 
          phone: status === 'Empty' ? '' : editHouseForm.phone, 
          status, 
          residenceType: status === 'Occupied' ? residenceType : undefined, 
          paymentStatus: editHouseForm.paymentStatus, 
          hasPregnant: editHouseForm.hasPregnant, 
          hasBaby: editHouseForm.hasBaby, 
          hasToddler: editHouseForm.hasToddler, 
          hasTeenager: editHouseForm.hasTeenager, 
          hasElderly: editHouseForm.hasElderly,
          accessCode: editHouseForm.accessCode 
      }; 
      
      await updateHouseData(selectedHouse.id, payload); 
      setIsModalOpen(false); 
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
      e.preventDefault();
      const validOptions = pollOptions.filter(o => o.trim() !== '');
      if (validOptions.length < 2) { alert("Minimal 2 opsi polling."); return; }
      const newPoll = {
          title: pollTitle,
          description: pollDesc,
          deadline: pollDeadline,
          date: new Date().toISOString(),
          status: 'Open',
          totalVotes: 0,
          options: validOptions.map((text, idx) => ({ id: `opt${idx}`, text, votes: 0 }))
      };
      await addPollToDb(newPoll);
      await addNotificationToDb({ title: `Voting Baru: ${pollTitle}`, message: "Ayo berpartisipasi dalam voting warga terbaru!", date: new Date().toISOString(), type: 'Info', target: 'All', isRead: false });
      setIsModalOpen(false);
      resetForms();
  };
  
  const handleClosePoll = async (id: string) => { if(confirm("Tutup voting ini?")) await updatePollStatus(id, 'Closed'); };
  const handleDeletePoll = async (id: string) => { if(confirm("Hapus voting ini selamanya?")) await deletePollFromDb(id); };

  const navGroups = [
      { title: "Menu Utama", items: [{ id: 'overview', icon: LayoutDashboard, label: 'Dashboard' }] },
      { title: "Administrasi", items: [{ id: 'residents', icon: Users, label: 'Data Warga' }, { id: 'services', icon: Archive, label: 'Layanan & Laporan' }, { id: 'finance', icon: DollarSign, label: 'Keuangan & Kas' }] },
      { title: "Lingkungan", items: [{ id: 'facilities', icon: Package, label: 'Fasilitas & Jadwal' }, { id: 'market', icon: ShoppingCart, label: 'Bursa Warga' }, { id: 'umkm', icon: ShoppingBag, label: 'UMKM' }, { id: 'announcements', icon: Megaphone, label: 'Pengumuman' }, { id: 'polls', icon: Vote, label: 'E-Voting' }, { id: 'officials', icon: Briefcase, label: 'Pengurus' }] },
      { title: "Sistem", items: [{ id: 'settings', icon: Settings, label: 'Pengaturan' }] }
  ];

  const handleLogout = async () => { try { await logoutAdmin(); setIsMobileMenuOpen(false); navigate('/'); } catch (e) { console.error(e); } };

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
      <div className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 fixed h-full z-30">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3"><div className="bg-slate-900 text-white p-2 rounded-xl"><Shield size={24}/></div><div><h1 className="font-black text-xl text-slate-900 tracking-tight">TERAS Admin</h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dashboard v2.0</p></div></div>
          {renderNav()}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50"><div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm"><div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">A</div><div><p className="text-xs font-bold text-slate-800">Admin Utama</p><p className="text-[10px] text-slate-400">Ketua RT 002</p></div></div><button onClick={handleLogout} className="w-full mt-3 flex items-center justify-center gap-2 p-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><LogOut size={14}/> Keluar Aplikasi</button></div>
      </div>
      
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="w-3/4 h-full bg-white shadow-2xl animate-slide-in-right flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                      <div className="bg-slate-900 text-white p-2 rounded-xl"><Shield size={24} /></div>
                      <div>
                          <h1 className="font-black text-xl text-slate-900 tracking-tight">TERAS Admin</h1>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Access</p>
                      </div>
                      <button onClick={() => setIsMobileMenuOpen(false)} className="ml-auto p-2 bg-slate-50 text-slate-400 rounded-lg"><X size={20} /></button>
                  </div>
                  {renderNav()}
              </div>
          </div>
      )}

      <div className="flex-1 md:ml-72 p-4 md:p-8 pb-24 overflow-x-hidden">
          <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100"><div className="flex items-center gap-2"><div className="bg-slate-900 text-white p-1.5 rounded-lg"><Shield size={18}/></div><span className="font-bold text-slate-900">TERAS Admin</span></div><button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-50 rounded-lg"><Menu size={20}/></button></div>
          
          {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="flex items-center gap-4 hover:-translate-y-1 transition-transform border-l-4 border-l-sky-500">
                          <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl"><Users size={28}/></div>
                          <div><p className="text-slate-500 text-xs font-bold uppercase">Total Warga</p><h3 className="text-3xl font-black text-slate-800">{houses.filter((h:House) => h.status === 'Occupied').length} KK</h3></div>
                      </Card>
                      <Card className="flex items-center gap-4 hover:-translate-y-1 transition-transform border-l-4 border-l-emerald-500">
                          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Wallet size={28}/></div>
                          <div><p className="text-slate-500 text-xs font-bold uppercase">Saldo Kas</p><h3 className="text-3xl font-black text-slate-800">Rp {(cashFlow.reduce((acc:number, c:CashFlow) => c.type === 'Income' ? acc + c.amount : acc - c.amount, 0)).toLocaleString()}</h3></div>
                      </Card>
                      <Card className="flex items-center gap-4 hover:-translate-y-1 transition-transform border-l-4 border-l-rose-500">
                          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><AlertTriangle size={28}/></div>
                          <div><p className="text-slate-500 text-xs font-bold uppercase">Laporan Baru</p><h3 className="text-3xl font-black text-slate-800">{reports.filter((r:Report) => r.status === 'Baru').length}</h3></div>
                      </Card>
                   </div>
                   <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Bot size={100} className="text-indigo-600"/></div>
                        <div className="relative z-10">
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Sparkles className="text-indigo-500" size={20}/> AI Smart Analysis</h3>
                                    <p className="text-sm text-slate-500 max-w-xl">Analisis otomatis kondisi lingkungan, keuangan, dan laporan warga menggunakan kecerdasan buatan Gemini AI.</p>
                                </div>
                                <button onClick={handleAiAnalysis} disabled={isAnalyzing} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isAnalyzing ? <Loader2 size={18} className="animate-spin"/> : <Bot size={18}/>} {isAnalyzing ? 'Sedang Menganalisis...' : 'Minta Analisis AI'}
                                </button>
                             </div>
                             {aiAnalysis && (
                                 <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 animate-slide-up">
                                     <div className="flex items-start gap-3">
                                         <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-600 border border-slate-100"><FileText size={20}/></div>
                                         <div className="flex-1"><h4 className="font-bold text-slate-800 mb-2">Laporan Eksekutif</h4><div className="prose prose-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{aiAnalysis}</div><p className="text-[10px] text-slate-400 mt-4 text-right">Generated by Google Gemini AI</p></div>
                                     </div>
                                 </div>
                             )}
                        </div>
                   </div>
              </div>
          )}

          {activeTab === 'residents' && (
              <div className="animate-fade-in space-y-6">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"><div><p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Warga</p><h4 className="text-2xl font-black text-slate-800">{houses.reduce((acc:any, h:any) => acc + (h.occupants || 0), 0)} <span className="text-xs font-medium text-slate-400">Jiwa</span></h4></div><div className="p-2 bg-slate-50 rounded-xl"><Users size={20} className="text-slate-400"/></div></div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"><div><p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Kepala Keluarga</p><h4 className="text-2xl font-black text-slate-800">{houses.filter((h:any) => h.status === 'Occupied').length} <span className="text-xs font-medium text-slate-400">KK</span></h4></div><div className="p-2 bg-slate-50 rounded-xl"><User size={20} className="text-slate-400"/></div></div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"><div><p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Rumah Kosong</p><h4 className="text-2xl font-black text-slate-800">{houses.filter((h:any) => h.status === 'Empty').length} <span className="text-xs font-medium text-slate-400">Unit</span></h4></div><div className="p-2 bg-slate-50 rounded-xl"><Home size={20} className="text-slate-400"/></div></div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"><div><p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Iuran Lunas</p><h4 className="text-2xl font-black text-emerald-600">{houses.filter((h:any) => h.status === 'Occupied' && h.paymentStatus === 'Lunas').length} <span className="text-xs font-medium text-slate-400">KK</span></h4></div><div className="p-2 bg-emerald-50 rounded-xl"><CheckCircle size={20} className="text-emerald-500"/></div></div>
                  </div>
                  <Card className="border border-slate-200">
                      <div className="flex flex-col space-y-6 mb-6">
                          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 self-start md:self-center"><List className="text-slate-400" size={24}/> Data Warga</h3>
                              <div className="flex gap-2 w-full md:w-auto">
                                  <div className="relative flex-1 md:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Cari nama / blok..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all" value={searchResident} onChange={(e) => setSearchResident(e.target.value)} /></div>
                                  <div className="flex bg-slate-100 p-1 rounded-xl shrink-0"><button onClick={() => setResidentView('grid')} className={`p-2 rounded-lg transition-all ${residentView === 'grid' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}><Grid size={18}/></button><button onClick={() => setResidentView('table')} className={`p-2 rounded-lg transition-all ${residentView === 'table' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}><List size={18}/></button></div>
                              </div>
                          </div>
                          <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                                    <div className="flex items-center gap-2 mr-2"><Filter size={14} className="text-slate-400" /><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filter:</span></div>
                                    <select className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-600 cursor-pointer hover:border-slate-400 outline-none shadow-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="All">Semua Status Hunian</option><option value="Occupied">Dihuni (Tetap)</option><option value="Kontrak">Dihuni (Kontrak)</option><option value="Empty">Rumah Kosong</option><option value="Business">Tempat Usaha</option></select>
                                    <select className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-600 cursor-pointer hover:border-slate-400 outline-none shadow-sm" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}><option value="All">Semua Status Iuran</option><option value="Lunas">Lunas</option><option value="Belum Lunas">Belum Lunas</option><option value="Menunggak">Menunggak</option></select>
                                    <select className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-600 cursor-pointer hover:border-slate-400 outline-none shadow-sm" value={filterBlock} onChange={e => setFilterBlock(e.target.value)}><option value="All">Semua Blok</option>{availableBlocks.map((b: string) => <option key={b} value={b}>Blok {b}</option>)}</select>
                                </div>
                                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                                    {selectedIds.size > 0 ? (
                                        <div className="flex gap-2 animate-fade-in">
                                            <Button onClick={handleGenerateBulkPins} size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"><Wand2 size={14}/> Generate PIN ({selectedIds.size})</Button>
                                            <Button onClick={handleBulkDuesUpdate} size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"><CheckSquare size={14}/> Update Iuran</Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Button onClick={handleGenerateBulkPins} size="sm" variant="outline" className="h-8 bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50"><Key size={14}/> Generate PIN (Warga Baru)</Button>
                                            <Button onClick={() => { resetForms(); setModalType('import'); setIsModalOpen(true); }} size="sm" variant="outline" className="h-8 bg-white border-blue-200 text-blue-600 hover:bg-blue-50"><Upload size={14}/> Import CSV</Button>
                                            <Button onClick={() => generateResidentReportPDF(houses, pdfConfig)} size="sm" variant="outline" className="h-8 bg-white"><Printer size={14}/> PDF</Button>
                                        </>
                                    )}
                                </div>
                          </div>
                      </div>
                      
                      {residentView === 'grid' ? (
                          <div className="border-4 border-slate-100 rounded-3xl overflow-hidden"><HouseMap houses={filteredHouses} isAdmin={true} onEditHouse={openEditHouse} onPayDues={openDuesModal} reports={reports} officials={officials} /></div>
                      ) : (
                          <div className="overflow-x-auto rounded-2xl border border-slate-100">
                              <table className="w-full text-sm text-left">
                                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                      <tr><th className="px-6 py-4 w-10"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" checked={filteredHouses.length > 0 && selectedIds.size === filteredHouses.length} onChange={handleSelectAll}/></th><th className="px-6 py-4">Kavling Rumah</th><th className="px-6 py-4">Kepala Keluarga</th><th className="px-6 py-4">Akses & PIN</th><th className="px-6 py-4">Demografi</th><th className="px-6 py-4">Status Iuran</th><th className="px-6 py-4 text-center">Aksi</th></tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                      {filteredHouses.length > 0 ? (filteredHouses.map((h:House) => {
                                              const initials = h.headOfFamily !== '-' ? h.headOfFamily.split(' ').slice(0,2).map(n => n[0]).join('') : '?';
                                              const avatarColor = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-amber-100 text-amber-600'][h.headOfFamily.length % 5];
                                              return (<tr key={h.id} className={`transition-colors group ${selectedIds.has(h.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'}`}><td className="px-6 py-4"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" checked={selectedIds.has(h.id)} onChange={() => handleSelectOne(h.id)}/></td><td className="px-6 py-4"><div className="flex flex-col"><span className="font-black text-slate-800 text-base">{h.block}-{h.number}</span><span className="text-[10px] text-slate-400 font-bold uppercase">Blok {h.block}</span></div></td><td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${h.status === 'Empty' ? 'bg-slate-100 text-slate-400' : avatarColor}`}>{initials}</div><div><p className={`font-bold text-sm ${h.status === 'Empty' ? 'text-slate-400 italic' : 'text-slate-700'}`}>{h.headOfFamily}</p>{h.status !== 'Empty' && <p className="text-xs text-slate-500 flex items-center gap-1"><Users size={12}/> {h.occupants} Penghuni</p>}</div></div></td><td className="px-6 py-4"><div className="flex flex-col gap-1.5">{h.accessCode ? (<div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 select-all" title="Klik untuk seleksi PIN">{h.accessCode}</span><Lock size={12} className="text-slate-300"/></div>) : (<span className="text-[10px] text-rose-400 font-bold bg-rose-50 px-2 py-1 rounded border border-rose-100 flex items-center gap-1"><AlertCircle size={10}/> Belum ada PIN</span>)}{h.phone && <div className="flex items-center gap-2"><span className="text-[10px] font-mono text-slate-400">{h.phone}</span><a href={`https://wa.me/${h.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100" title="Kirim PIN via WhatsApp"><MessageCircle size={10} fill="currentColor" /></a></div>}</div></td><td className="px-6 py-4"><div className="flex gap-1">{h.hasPregnant && <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600 border border-pink-100" title="Ibu Hamil"><Heart size={14} fill="currentColor"/></div>}{h.hasBaby && <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100" title="Bayi"><Baby size={14}/></div>}{h.hasToddler && <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100" title="Balita"><Smile size={14}/></div>}{h.hasElderly && <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100" title="Lansia"><Accessibility size={14}/></div>}{!h.hasPregnant && !h.hasBaby && !h.hasToddler && !h.hasElderly && <span className="text-slate-300">-</span>}</div></td><td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${h.paymentStatus === 'Lunas' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : h.paymentStatus === 'Belum Lunas' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}><div className={`w-1.5 h-1.5 rounded-full ${h.paymentStatus === 'Lunas' ? 'bg-emerald-500' : h.paymentStatus === 'Belum Lunas' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>{h.paymentStatus}</span></td><td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => openEditHouse(h)} className="p-2 bg-white border border-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-800 rounded-xl text-slate-500 transition-all shadow-sm active:scale-95" title="Edit Data"><Edit2 size={16} /></button><button onClick={() => handleDeleteHouse(h.id)} className="p-2 bg-white border border-rose-100 hover:bg-rose-500 hover:text-white hover:border-rose-500 rounded-xl text-rose-400 transition-all shadow-sm active:scale-95" title="Hapus Permanen"><Trash2 size={16} /></button></div></td></tr>)})
                                      ) : (<tr><td colSpan={7} className="text-center py-12 text-slate-400 italic bg-slate-50/30">Data tidak ditemukan untuk filter ini.</td></tr>)}
                                  </tbody>
                              </table>
                          </div>
                      )}
                  </Card>
              </div>
          )}
          
          {activeTab === 'market' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                      <div>
                          <h2 className="font-black text-2xl text-slate-800">Bursa Warga</h2>
                          <p className="text-sm text-slate-500 mt-1">Pantau iklan jual beli & barter antar warga.</p>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {marketItems.map((item: MarketItem) => (
                          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-4">
                              <div className="w-24 h-24 shrink-0">
                                  <SmartImage src={item.image} alt={item.title} className="w-full h-full rounded-xl" />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col">
                                  <div className="flex justify-between items-start mb-1">
                                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${item.status === 'Sold' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>{item.status === 'Sold' ? 'Terjual' : 'Aktif'}</span>
                                      <div className="flex gap-1">
                                          {item.status !== 'Sold' && (
                                              <button onClick={() => handleMarkSold(item.id)} className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors" title="Tandai Terjual"><CheckCircle size={14}/></button>
                                          )}
                                          <button onClick={() => handleDeleteMarketItem(item.id)} className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Hapus Iklan"><Trash2 size={14}/></button>
                                      </div>
                                  </div>
                                  <h4 className="font-bold text-slate-800 text-sm truncate">{item.title}</h4>
                                  <p className="text-xs text-slate-500 mb-2 truncate">{item.sellerName} • {new Date(item.date).toLocaleDateString()}</p>
                                  <div className="mt-auto">
                                      <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                          {item.category}: {item.price > 0 ? `Rp ${item.price.toLocaleString()}` : 'Gratis/Barter'}
                                      </span>
                                  </div>
                              </div>
                          </div>
                      ))}
                      {marketItems.length === 0 && (
                          <div className="col-span-full py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-dashed border-slate-200">
                              Belum ada iklan aktif.
                          </div>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'polls' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                      <div><h2 className="font-black text-2xl text-slate-800">Manajemen Voting</h2><p className="text-sm text-slate-500 mt-1">Buat dan kelola jajak pendapat warga.</p></div>
                      <Button onClick={() => { resetForms(); setModalType('poll'); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"><Plus size={16}/> Buat Voting Baru</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {polls.map((poll: Poll) => (
                          <div key={poll.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col">
                              <div className="flex justify-between items-start mb-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${poll.status === 'Open' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{poll.status}</span>
                                  <div className="flex gap-2">
                                      {poll.status === 'Open' && <button onClick={() => handleClosePoll(poll.id)} className="text-xs font-bold text-amber-600 hover:bg-amber-50 px-2 py-1 rounded" title="Tutup Voting">Tutup</button>}
                                      <button onClick={() => handleDeletePoll(poll.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                                  </div>
                              </div>
                              <h3 className="font-bold text-slate-800 mb-2 line-clamp-2">{poll.title}</h3>
                              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{poll.description}</p>
                              <div className="mt-auto">
                                  <div className="w-full h-2 bg-slate-100 rounded-full mb-2 overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (poll.totalVotes/50)*100)}%` }}></div></div>
                                  <p className="text-xs font-bold text-slate-700">{poll.totalVotes} Suara Masuk</p>
                                  <p className="text-[10px] text-slate-400 mt-1">Deadline: {new Date(poll.deadline).toLocaleDateString()}</p>
                              </div>
                          </div>
                      ))}
                      {polls.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-dashed border-slate-200">Belum ada data voting.</div>}
                  </div>
              </div>
          )}

          {activeTab === 'facilities' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                   <h2 className="font-black text-2xl text-slate-800 mb-4 flex items-center gap-2"><Moon size={24} className="text-indigo-600"/> Jadwal Siskamling</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       {ronda.length > 0 ? ronda.map((r:any) => {
                           const isToday = r.day === new Date().toLocaleDateString('id-ID', {weekday:'long'});
                           return (<div key={r.id || r.day} className={`relative p-5 rounded-3xl border transition-all duration-300 group ${isToday ? 'bg-gradient-to-br from-indigo-900 to-indigo-700 border-indigo-500 shadow-xl shadow-indigo-200 ring-2 ring-indigo-300 transform scale-[1.02]' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg'}`}>{isToday && (<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm animate-bounce-slow">Hari Ini</div>)}<div className="flex justify-between items-start mb-4"><div><h4 className={`font-black text-lg ${isToday ? 'text-white' : 'text-slate-700'}`}>{r.day}</h4><p className={`text-xs font-medium ${isToday ? 'text-indigo-200' : 'text-slate-400'}`}>{r.members.length} Personil</p></div><button onClick={() => openEditRonda(r)} className={`p-2 rounded-xl transition-colors ${isToday ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}><Edit2 size={16}/></button></div><div className="space-y-2">{r.members.length > 0 ? r.members.map((m:any, idx:any) => (<div key={idx} className={`flex items-center gap-2 text-sm p-2 rounded-xl ${isToday ? 'bg-white/10 text-indigo-50 border border-white/5' : 'bg-slate-50 text-slate-600'}`}><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isToday ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>{m.charAt(0)}</div><span className="truncate">{m}</span></div>)) : (<div className={`text-center py-4 italic text-xs ${isToday ? 'text-indigo-300' : 'text-slate-400'}`}>Belum ada petugas</div>)}</div></div>);
                       }) : (<div className="col-span-full text-center py-8 text-slate-400 italic bg-slate-50 rounded-2xl border-dashed border-2 border-slate-200">Jadwal ronda belum dikonfigurasi.</div>)}
                   </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4 relative z-10"><div><h2 className="font-black text-xl text-slate-800 flex items-center gap-2"><LocateFixed size={20} className="text-rose-500"/> Live Monitor Patroli</h2><p className="text-slate-500 text-sm mt-1">Pantauan real-time check-point petugas siskamling.</p></div><div className="flex items-center gap-2 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg text-slate-500"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Live Feed</div></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider"><tr><th className="px-4 py-3 rounded-l-xl">Waktu</th><th className="px-4 py-3">Petugas</th><th className="px-4 py-3">Lokasi</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 rounded-r-xl">Catatan</th></tr></thead>
                            <tbody className="divide-y divide-slate-50">{rondaLogs.length > 0 ? rondaLogs.map((log: any) => (<tr key={log.id} className="hover:bg-slate-50/50 transition-colors"><td className="px-4 py-3 font-mono text-xs text-slate-500">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}<span className="block text-[9px] text-slate-300">{new Date(log.timestamp).toLocaleDateString()}</span></td><td className="px-4 py-3 font-bold text-slate-700">{log.officerName}</td><td className="px-4 py-3"><div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 w-fit px-2 py-1 rounded-md"><MapIcon size={10}/> {log.location}</div></td><td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.status === 'Aman' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{log.status}</span></td><td className="px-4 py-3 text-slate-500 text-xs italic">{log.note}</td></tr>)) : (<tr><td colSpan={5} className="text-center py-8 text-slate-400 italic">Belum ada data patroli hari ini.</td></tr>)}</tbody>
                        </table>
                    </div>
                </div>
              </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6">
               <Card title="Arus Kas & Transaksi" icon={DollarSign} action={<Button onClick={() => { resetForms(); setModalType('cash'); setIsModalOpen(true); }} size="sm"><Plus size={16}/> Transaksi</Button>}>
                  <div className="space-y-2">{cashFlow.map((cf:CashFlow) => (<div key={cf.id} className="flex justify-between items-center p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-xl transition-colors group"><div><p className="font-bold text-sm text-slate-800">{cf.description}</p><p className="text-xs text-slate-400">{cf.date} • {cf.category}</p></div><div className="flex items-center gap-4"><span className={`font-bold text-sm ${cf.type==='Income'?'text-emerald-600':'text-rose-600'}`}>{cf.type==='Income'?'+':'-'} {cf.amount.toLocaleString()}</span><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openEditCash(cf)} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 transition-colors shadow-sm"><Edit2 size={14}/></button><button onClick={() => handleDeleteTransaction(cf.id)} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-rose-600 transition-colors shadow-sm"><Trash2 size={14}/></button></div></div></div>))}</div>
               </Card>
            </div>
          )}

          {activeTab === 'officials' && (
             <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center"><div><h2 className="font-black text-2xl text-slate-800">Pengurus RT 002</h2><p className="text-sm text-slate-500 mt-1">Kelola data struktur organisasi Rukun Tetangga.</p></div><Button onClick={() => { resetForms(); setModalType('official'); setIsModalOpen(true); }} className="shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700"><Plus size={16}/> Tambah Personil</Button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{officials.map((o:Official) => { const isChairman = o.role.toLowerCase().includes('ketua'); return (<div key={o.id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"><div className={`h-24 relative ${isChairman ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : 'bg-slate-700'}`}><div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div></div><div className="absolute top-12 left-1/2 -translate-x-1/2"><div className="p-1.5 bg-white rounded-full shadow-lg"><img src={o.photo||`https://ui-avatars.com/api/?name=${o.name}&background=random&size=128`} className="w-20 h-20 rounded-full object-cover bg-slate-100" alt={o.name}/></div></div><div className="pt-14 pb-6 px-6 text-center mt-2"><h3 className="font-bold text-slate-800 text-lg mb-1">{o.name}</h3><p className="text-xs text-slate-400 font-medium mb-4">{o.role}</p><div className="flex justify-center gap-3"><button onClick={() => handleEditOfficial(o)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all shadow-sm"><Edit2 size={16}/></button><button onClick={() => handleDeleteOfficial(o.id)} className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shadow-sm"><Trash2 size={16}/></button></div></div></div>); })}</div>
             </div>
          )}

          {activeTab === 'announcements' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center"><h2 className="font-black text-2xl text-slate-800">Pengumuman</h2><Button onClick={() => { resetForms(); setModalType('announcement'); setIsModalOpen(true); }}><Plus size={16}/> Buat Baru</Button></div>
                <div className="space-y-4">{announcements.map((a:Announcement) => (<div key={a.id} className="bg-white p-6 rounded-2xl border border-slate-100 flex justify-between hover:shadow-md transition-shadow"><div><div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase">{a.type}</span><span className="text-xs text-slate-400">{new Date(a.date).toLocaleDateString()}</span></div><h4 className="font-bold text-lg text-slate-800 mb-1">{a.title}</h4><p className="text-sm text-slate-500 line-clamp-2">{a.content}</p></div><button onClick={() => handleDeleteAnnouncement(a.id)} className="text-slate-300 hover:text-rose-500 h-fit"><Trash2 size={20}/></button></div>))}</div>
             </div>
          )}
          
          {activeTab === 'umkm' && (
             <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <h2 className="font-black text-2xl text-slate-800">UMKM Warga</h2>
                  <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Cari UMKM..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all" 
                        value={searchUmkm} 
                        onChange={(e) => setSearchUmkm(e.target.value)} 
                      />
                    </div>
                    <Button onClick={() => { resetForms(); setModalType('umkm'); setIsModalOpen(true); }}>
                      <Plus size={16}/> Tambah
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {umkm.filter((u: UMKM) => 
                    u.name.toLowerCase().includes(searchUmkm.toLowerCase()) || 
                    u.owner.toLowerCase().includes(searchUmkm.toLowerCase())
                  ).length > 0 ? (
                    umkm.filter((u: UMKM) => 
                      u.name.toLowerCase().includes(searchUmkm.toLowerCase()) || 
                      u.owner.toLowerCase().includes(searchUmkm.toLowerCase())
                    ).map((u: UMKM) => (
                      <div key={u.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm group hover:shadow-lg transition-all">
                        <div className="h-40 bg-slate-100 relative overflow-hidden">
                          <SmartImage src={u.image} alt={u.name} className="w-full h-full" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button onClick={() => openEditUMKM(u)} className="p-2 bg-white/90 rounded-xl shadow-sm text-slate-700 hover:text-blue-600 transition-all"><Edit2 size={16}/></button>
                            <button onClick={() => handleDeleteUMKM(u.id)} className="p-2 bg-white/90 rounded-xl shadow-sm text-slate-700 hover:text-rose-600 transition-all"><Trash2 size={16}/></button>
                          </div>
                          <div className="absolute top-3 left-3 z-10"><span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm">{u.category}</span></div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{u.name}</h3>
                          <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5"><User size={12}/> {u.owner}</p>
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50"><div className="bg-green-50 text-green-600 p-1.5 rounded-lg"><MessageCircle size={14}/></div><span className="text-xs font-bold text-slate-600">{u.contact}</span></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-dashed border-slate-200">
                      {searchUmkm ? 'Tidak ada UMKM yang cocok dengan pencarian.' : 'Belum ada data UMKM.'}
                    </div>
                  )}
                </div>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
               <div className="space-y-8">
                   <Card title="Profil Admin" icon={User} className="relative overflow-hidden">
                       <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100"><div className="w-14 h-14 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md">A</div><div><h3 className="font-bold text-slate-800">Admin Utama</h3><p className="text-xs text-slate-500 font-medium">{auth.currentUser?.email || 'admin@teras.id'}</p></div></div>
                       <form onSubmit={handlePasswordChange} className="space-y-4"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ganti Password</p>
                           <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type={showPassword ? "text" : "password"} className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-800 outline-none" placeholder="Password Baru" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6}/><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
                           <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type={showPassword ? "text" : "password"} className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-800 outline-none" placeholder="Konfirmasi Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6}/></div>
                           <Button type="submit" className="w-full" disabled={!newPassword || isChangingPassword}>{isChangingPassword ? 'Memproses...' : 'Simpan Password Baru'}</Button>
                       </form>
                   </Card>
                   <Card title="Manajemen Sistem" icon={Database} className="border-rose-100">
                       <div className="space-y-4">
                           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center"><div><h4 className="font-bold text-sm text-slate-700">Backup Data</h4><p className="text-xs text-slate-400">Unduh semua data dalam format JSON.</p></div><Button size="sm" variant="outline" onClick={handleExportData}><Download size={14}/> Export</Button></div>
                           <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100"><div className="flex items-start gap-3 mb-4"><div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><AlertTriangle size={20}/></div><div><h4 className="font-bold text-sm text-rose-700">Reset Database (Seed)</h4><p className="text-xs text-rose-600 leading-relaxed">Hapus semua data real dan mengembalikannya ke dummy.</p></div></div><Button onClick={handleResetSystem} className="w-full bg-white text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white shadow-sm transition-all"><Trash size={16}/> Reset ke Pengaturan Awal</Button></div>
                       </div>
                   </Card>
               </div>
               <div className="space-y-8">
                   <Card title="Konfigurasi Surat (PDF)" icon={FileText} action={<Button onClick={handleSaveConfig} size="sm" className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"><Save size={16}/> Simpan</Button>}>
                       <div className="space-y-6">
                           <div><label className="block text-xs font-bold mb-2 text-slate-700">Alamat RT di Kop Surat</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none" value={localConfig.rtAddress} onChange={e => setLocalConfig({...localConfig, rtAddress: e.target.value})} /></div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-2"><label className="block text-xs font-bold text-slate-700">Logo</label><div className="relative h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer">{localConfig.logo ? <img src={localConfig.logo} className="h-full w-full object-contain p-2" /> : <ImageIcon size={24} className="text-slate-300"/>}<input type="file" onChange={e => handleFileChange(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer"/></div></div>
                               <div className="space-y-2"><label className="block text-xs font-bold text-slate-700">Stempel</label><div className="relative h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer">{localConfig.stamp ? <img src={localConfig.stamp} className="h-full w-full object-contain p-2" /> : <ShieldCheck size={24} className="text-slate-300"/>}<input type="file" onChange={e => handleFileChange(e, 'stamp')} className="absolute inset-0 opacity-0 cursor-pointer"/></div></div>
                           </div>
                           <div className="space-y-2"><label className="block text-xs font-bold text-slate-700">Tanda Tangan Ketua RT</label><div className="relative h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer">{localConfig.signature ? <img src={localConfig.signature} className="h-full w-full object-contain p-2" /> : <Edit2 size={20} className="text-slate-300"/>}<input type="file" onChange={e => handleFileChange(e, 'signature')} className="absolute inset-0 opacity-0 cursor-pointer"/></div></div>
                       </div>
                   </Card>
               </div>
            </div>
          )}
          
          {isModalOpen && (
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalType === 'official' ? "Data Pengurus" : "Kelola Data"}>
                 {modalType === 'official' && (
                     <form onSubmit={handleSaveOfficial} className="space-y-4">
                         <div><label className="block text-xs font-bold mb-1.5">Nama</label><input className={`w-full p-3 border rounded-xl`} value={offName} onChange={e=>setOffName(e.target.value)} required/></div>
                         <div><label className="block text-xs font-bold mb-1.5">Jabatan</label><input className="w-full p-3 border rounded-xl" value={offRole} onChange={e=>setOffRole(e.target.value)} required/></div>
                         <div><label className="block text-xs font-bold mb-1.5">Telepon</label><input className="w-full p-3 border rounded-xl" value={offPhone} onChange={e=>setOffPhone(e.target.value)} required/></div>
                         <div><label className="block text-xs font-bold mb-1.5">Rumah (Blok)</label><input className="w-full p-3 border rounded-xl" value={offHouse} onChange={e=>setOffHouse(e.target.value)} required/></div>
                         <div><label className="block text-xs font-bold mb-1.5">Foto URL</label><input className="w-full p-3 border rounded-xl" value={offPhoto} onChange={e=>setOffPhoto(e.target.value)}/></div>
                         <Button type="submit" className="w-full py-3">Simpan Data Pengurus</Button>
                     </form>
                 )}
                 {modalType === 'editHouse' && (
                     <form onSubmit={handleSaveHouse} className="space-y-4">
                         <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3"><div className="bg-white p-2 rounded-full text-blue-600 font-bold text-xs shadow-sm">{selectedHouse?.block}-{selectedHouse?.number}</div><p className="text-xs text-blue-700 font-bold">Edit Data Rumah</p></div>
                         <div><label className="block text-xs font-bold mb-1.5">Status Hunian</label><select className="w-full p-3 border border-slate-200 rounded-xl" value={editHouseForm.unifiedStatus} onChange={e=>setEditHouseForm({...editHouseForm, unifiedStatus: e.target.value})}><option value="Tetap">Dihuni (Milik Sendiri)</option><option value="Kontrak">Dihuni (Kontrak/Sewa)</option><option value="Empty">Rumah Kosong</option><option value="Business">Tempat Usaha</option></select></div>
                         {editHouseForm.unifiedStatus !== 'Empty' && (
                             <>
                                 <div><label className="block text-xs font-bold mb-1.5">Kepala Keluarga</label><input className="w-full p-3 border border-slate-200 rounded-xl" value={editHouseForm.headOfFamily} onChange={e=>setEditHouseForm({...editHouseForm, headOfFamily: e.target.value})}/></div>
                                 <div className="grid grid-cols-2 gap-3">
                                     <div><label className="block text-xs font-bold mb-1.5">Jml Penghuni</label><input type="number" className="w-full p-3 border border-slate-200 rounded-xl" value={editHouseForm.occupants} onChange={e=>setEditHouseForm({...editHouseForm, occupants: parseInt(e.target.value)})}/></div>
                                     <div><label className="block text-xs font-bold mb-1.5">No. HP</label><input className="w-full p-3 border border-slate-200 rounded-xl" value={editHouseForm.phone} onChange={e=>setEditHouseForm({...editHouseForm, phone: e.target.value})}/></div>
                                 </div>
                                 <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Kode Akses Rumah (PIN)</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-wider" value={editHouseForm.accessCode} onChange={e=>setEditHouseForm({...editHouseForm, accessCode: e.target.value})} placeholder="PIN akses..."/></div></div>
                             </>
                         )}
                         <Button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white">Simpan Perubahan</Button>
                     </form>
                 )}
                 {modalType === 'cash' && (
                     <form onSubmit={handleSaveTransaction} className="space-y-4">
                         <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Keterangan</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={cashDesc} onChange={e=>setCashDesc(e.target.value)} required/></div>
                         <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Nominal (Rp)</label><input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={cashAmount} onChange={e=>setCashAmount(e.target.value)} required/></div>
                         <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold mb-1.5 text-slate-700">Tipe</label><select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={cashType} onChange={e=>setCashType(e.target.value as any)}><option value="Income">Pemasukan</option><option value="Expense">Pengeluaran</option></select></div><div><label className="block text-xs font-bold mb-1.5 text-slate-700">Kategori</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={cashCategory} onChange={e=>setCashCategory(e.target.value)}/></div></div>
                         <Button type="submit" className="w-full py-3">{editingCashId ? 'Simpan Perubahan' : 'Catat Transaksi'}</Button>
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
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);
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
    const unsubNotifs = subscribeToNotifications((data) => {
        setNotifications(data);
        const unread = data.filter(n => !n.isRead);
        if (unread.length > 0 && unread[0].date > new Date(Date.now() - 5000).toISOString()) {
            setActiveNotification(unread[0]);
        }
    });

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
        {activeNotification && <NotificationToast notification={activeNotification} onClose={() => setActiveNotification(null)} />}
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
