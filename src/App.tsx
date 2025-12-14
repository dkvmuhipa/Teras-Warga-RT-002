import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Home, FileText, Megaphone, AlertTriangle, User, Users, Menu, X, 
  LayoutDashboard, Send, Bot, Trash2, Clock, CheckCircle, XCircle, Search, Edit2, Plus,
  Shield, Phone, Wallet, Moon, Sun, CloudRain, 
  LogOut, Download, Package, ShoppingBag,
  ArrowUpRight, ArrowDownRight, ShieldCheck, FileDown, Target, HelpCircle, MapPin as MapIcon,
  Briefcase, Store, Archive, History, BarChart3, Grid, List, Upload, Printer,
  RefreshCw, Calendar, DollarSign, Settings, Filter, MoreHorizontal, Heart, Baby, Smile, GraduationCap, Accessibility, Key, UserCheck, MessageCircle, ImageIcon, Link as LinkIcon, AlertCircle, Wrench, Battery, BatteryMedium, BatteryWarning, ChevronRight,
  Database, Lock, Eye, EyeOff, Save, Trash, Sparkles, Loader2, CheckSquare, Bell, Vote, BarChart2, PieChart, LocateFixed, Navigation, ShoppingCart, Repeat, Trophy, Medal, Flame, ThumbsUp, Activity, Crown
} from 'lucide-react';
import { CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, BarChart, Bar, Cell, Legend } from 'recharts';

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

// --- Notification Components ---
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
                
                {/* NOTIFICATION CENTER */}
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
  const todayRonda = Array.isArray(ronda) ? ronda.find((r:any) => r.day === today) : null;

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
                {announcements.map((ann:any, idx:any) => (
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

interface PollCardProps {
    poll: Poll;
    votedPolls: Set<string>;
    submittingId: string | null;
    onVote: (pollId: string, optionId: string, options: PollOption[]) => void;
}

const PollCard: React.FC<PollCardProps> = ({ poll, votedPolls, submittingId, onVote }) => {
    const hasVoted = votedPolls.has(poll.id);
    const isClosed = poll.status === 'Closed';
    const total = poll.totalVotes || 0;
    const isSubmitting = submittingId === poll.id;
    
    // Find winner if closed or voted
    const maxVotes = Math.max(...poll.options.map(o => o.votes), 0);
    
    // Days left calc
    const daysLeft = Math.ceil((new Date(poll.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    const isUrgent = daysLeft <= 2 && daysLeft >= 0;

    return (
        <div className={`bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 transition-all duration-300 relative overflow-hidden ${isClosed ? 'opacity-90 grayscale-[0.3] hover:grayscale-0' : 'hover:scale-[1.01]'}`}>
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none transform translate-x-1/3 -translate-y-1/3">
                <Vote size={300} className="text-indigo-900"/>
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 ${isClosed ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'}`}>
                                {isClosed ? <Lock size={12}/> : <Activity size={12} className={isUrgent ? "animate-pulse" : ""}/>}
                                {isClosed ? 'Voting Selesai' : 'Sedang Berlangsung'}
                            </span>
                            {!isClosed && isUrgent && (
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-600 animate-pulse">
                                    Segera Berakhir!
                                </span>
                            )}
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2">{poll.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">{poll.description}</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="text-3xl font-black text-slate-800">{total}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Suara</div>
                    </div>
                </div>

                {/* Progress / Options Area */}
                <div className="space-y-4">
                    {poll.options.map((opt) => {
                        const percent = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                        const isWinner = (hasVoted || isClosed) && opt.votes === maxVotes && total > 0;
                        
                        return (
                            <div key={opt.id} className="relative group">
                                {(!hasVoted && !isClosed) ? (
                                    <button 
                                        onClick={() => onVote(poll.id, opt.id, poll.options)}
                                        disabled={isSubmitting}
                                        className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-indigo-500 hover:bg-indigo-50/50 hover:shadow-lg hover:shadow-indigo-100 text-left transition-all active:scale-[0.98] flex justify-between items-center group/btn relative overflow-hidden"
                                    >
                                        {isSubmitting && <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center backdrop-blur-sm"><Loader2 className="animate-spin text-indigo-600"/></div>}
                                        <span className="font-bold text-slate-700 group-hover/btn:text-indigo-800 transition-colors text-base relative z-10">{opt.text}</span>
                                        <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover/btn:border-indigo-500 flex items-center justify-center relative z-10 transition-colors">
                                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                                        </div>
                                    </button>
                                ) : (
                                    // Result View
                                    <div className={`relative w-full p-4 rounded-2xl border overflow-hidden transition-all duration-700 ${isWinner ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                                        {/* Progress Bar Background */}
                                        <div 
                                            className={`absolute inset-0 h-full opacity-20 transition-all duration-1000 ease-out ${isWinner ? 'bg-gradient-to-r from-indigo-400 to-violet-500' : 'bg-slate-300'}`} 
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                        
                                        <div className="relative flex justify-between items-center z-10">
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold text-base ${isWinner ? 'text-indigo-900' : 'text-slate-600'}`}>{opt.text}</span>
                                                {isWinner && <Trophy size={16} className="text-amber-500 fill-amber-400 animate-bounce-slow"/>}
                                            </div>
                                            <div className="text-right">
                                                <span className={`block font-black text-sm ${isWinner ? 'text-indigo-700' : 'text-slate-700'}`}>{percent}%</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{opt.votes} Suara</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Info */}
                <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                        {hasVoted ? (
                            <span className="text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                <CheckCircle size={12}/> Suara Anda Telah Direkam
                            </span>
                        ) : !isClosed ? (
                            <span className="text-indigo-600 flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                <ThumbsUp size={12}/> Silakan Pilih Satu Opsi
                            </span>
                        ) : (
                            <span>Voting Ditutup</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock size={12}/> Deadline: {new Date(poll.deadline).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PublicVoting = ({ polls }: { polls: Poll[] }) => {
    const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'Active' | 'History'>('Active');
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    
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
        
        if (confirm("Konfirmasi pilihan Anda? Suara yang sudah masuk tidak dapat diubah.")) {
            setSubmittingId(pollId);
            await submitVote(pollId, optionId, options);
            localStorage.setItem(`voted_poll_${pollId}`, 'true');
            setVotedPolls(prev => new Set(prev).add(pollId));
            setTimeout(() => setSubmittingId(null), 800); // UI feel delay
        }
    };

    const activePolls = polls.filter(p => p.status === 'Open');
    const closedPolls = polls.filter(p => p.status === 'Closed');
    
    // Sort active polls by priority (e.g. deadline soonest first)
    const sortedActivePolls = [...activePolls].sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 mb-24 animate-fade-in font-sans">
             {/* New Hero Section */}
             <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900 shadow-2xl shadow-indigo-200 min-h-[300px] flex items-center justify-center text-center px-6 py-12 mb-10 group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 group-hover:scale-105 transition-transform duration-1000"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                
                {/* Floating Elements */}
                <div className="absolute top-10 left-10 p-4 bg-white/5 rounded-full backdrop-blur-sm animate-bounce-slow border border-white/10 hidden md:block">
                    <Vote size={32} className="text-indigo-300"/>
                </div>
                <div className="absolute bottom-10 right-10 p-4 bg-white/5 rounded-full backdrop-blur-sm animate-bounce-slow border border-white/10 hidden md:block" style={{animationDelay: '1s'}}>
                    <PieChart size={32} className="text-fuchsia-300"/>
                </div>
                
                {/* Center Content */}
                <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-100 text-[10px] font-bold uppercase tracking-widest shadow-lg">
                        <Vote size={14} /> E-Voting System v2.0
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-xl leading-tight">
                        Suara Warga <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-fuchsia-300">RT 002</span>
                    </h1>
                    <p className="text-indigo-100 text-sm md:text-lg font-medium leading-relaxed max-w-lg mx-auto">
                        Salurkan aspirasi Anda secara langsung, jujur, dan transparan. Masa depan lingkungan ada di tangan Anda.
                    </p>
                </div>
             </div>

             {/* Tab Navigation */}
             <div className="flex justify-center mb-10">
                 <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner ring-1 ring-slate-200">
                     <button 
                        onClick={() => setActiveTab('Active')} 
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'Active' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100 scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                     >
                         <Activity size={16}/> Sedang Berlangsung
                         {sortedActivePolls.length > 0 && <span className="bg-indigo-600 text-white text-[10px] px-1.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm">{sortedActivePolls.length}</span>}
                     </button>
                     <button 
                        onClick={() => setActiveTab('History')} 
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'History' ? 'bg-white text-slate-800 shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                     >
                         <History size={16}/> Riwayat Voting
                     </button>
                 </div>
             </div>

             {/* Content Area */}
             <div className="space-y-8 min-h-[400px]">
                 {activeTab === 'Active' ? (
                     <div className="animate-slide-up">
                         {sortedActivePolls.length > 0 ? (
                             <div className="grid grid-cols-1 gap-8">
                                 {sortedActivePolls.map(poll => (
                                     <PollCard 
                                        key={poll.id} 
                                        poll={poll} 
                                        votedPolls={votedPolls} 
                                        submittingId={submittingId} 
                                        onVote={handleVote} 
                                     />
                                 ))}
                             </div>
                         ) : (
                             <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
                                 <div className="bg-slate-50 p-6 rounded-full mb-4 ring-1 ring-slate-100">
                                     <Vote size={48} className="text-slate-300"/>
                                 </div>
                                 <h3 className="text-xl font-bold text-slate-800">Tidak ada voting aktif</h3>
                                 <p className="text-slate-500 max-w-sm mt-2 text-sm">Saat ini belum ada jajak pendapat yang sedang berlangsung. Cek kembali nanti atau lihat riwayat voting.</p>
                             </div>
                         )}
                     </div>
                 ) : (
                     <div className="animate-slide-up">
                         {closedPolls.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 {closedPolls.map(poll => (
                                     <PollCard 
                                        key={poll.id} 
                                        poll={poll} 
                                        votedPolls={votedPolls} 
                                        submittingId={submittingId} 
                                        onVote={handleVote} 
                                     />
                                 ))}
                             </div>
                         ) : (
                             <div className="text-center py-24 text-slate-400 italic bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                 Belum ada riwayat voting yang selesai.
                             </div>
                         )}
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
        
        // Validation
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
        // Reset form
        setPostTitle(''); setPostDesc(''); setPostPrice(''); setPostSeller(''); setPostContact(''); setPostImage(''); setAccessCode(''); setPostHouseId('');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 mb-24 animate-fade-in font-sans">
            {/* Header Banner */}
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

            {/* Filter & Action Bar */}
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

            {/* Grid Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <div key={item.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                        <div className="relative h-48 bg-slate-100 overflow-hidden">
                            <img 
                                src={item.image || 'https://placehold.co/400x300?text=No+Image'} 
                                alt={item.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-3 left-3">
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

            {/* Post Modal */}
            <Modal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} title="Pasang Iklan Bursa Warga">
                <form onSubmit={handlePostSubmit} className="space-y-4">
                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-xs text-yellow-800 mb-2">
                        Barang yang dijual/barter harus milik sendiri dan legal. Dilarang posting barang terlarang.
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-700">Kategori</label>
                        <div className="flex gap-2">
                            {['Jual', 'Barter', 'Gratis'].map(cat => (
                                <button 
                                    type="button" 
                                    key={cat} 
                                    onClick={() => setPostCategory(cat as any)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${postCategory === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
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
                    
                    <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Foto URL</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={postImage} onChange={e=>setPostImage(e.target.value)} placeholder="https://..."/></div>

                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Nama Penjual</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={postSeller} onChange={e=>setPostSeller(e.target.value)} required placeholder="Nama Panggilan"/></div>
                        <div><label className="block text-xs font-bold mb-1.5 text-slate-700">No. WhatsApp</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={postContact} onChange={e=>setPostContact(e.target.value)} required placeholder="08..."/></div>
                    </div>

                    {/* Security Verification */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-2">
                        <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><Lock size={14}/> Verifikasi Warga</h4>
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
    
    // Auth States
    const [accessCode, setAccessCode] = useState('');
    
    useEffect(() => { try { const stored = localStorage.getItem('userRequestHistory'); if (stored) setLocalHistory(JSON.parse(stored)); } catch (e) { console.error("Error reading history", e); } }, []);
    useEffect(() => { if(initialHouseId) { if (activeTab === 'lapor') setReportHouseId(initialHouseId); if (activeTab === 'surat') setHouseId(initialHouseId); } }, [initialHouseId, activeTab]);
  
    const saveToHistory = (item: any) => { try { const updated = [item, ...localHistory]; setLocalHistory(updated); localStorage.setItem('userRequestHistory', JSON.stringify(updated)); } catch (e) { console.error("Error saving history", e); } };
    const [reportType, setReportType] = useState<Report['type']>('Fasilitas');
    const [reportDesc, setReportDesc] = useState('');
    const [reporterName, setReporterName] = useState('');
    const [reportHouseId, setReportHouseId] = useState(initialHouseId); 
    const [reporterHouseId, setReporterHouseId] = useState(''); // New: for verification

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
        
        // Security Check
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
        
        // Security Check
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
                         
                         {/* SECURITY VERIFICATION */}
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
                          
                          {/* VERIFIKASI PELAPOR */}
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
  const dataToShow = umkmData.length > 0 ? umkmData : [];
  const categories = ['All', 'Kuliner', 'Jasa', 'Fashion', 'Retail', 'Kerajinan', 'Lainnya'];
  const filteredUMKM = dataToShow.filter(u => (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.description.toLowerCase().includes(searchTerm.toLowerCase())) && (filterCategory === 'All' || u.category === filterCategory));
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 mb-24 md:mb-24 space-y-8 animate-fade-in font-sans">
      <div className="relative rounded-3xl overflow-hidden bg-violet-950 shadow-2xl shadow-violet-200 min-h-[300px] flex items-center justify-center text-center px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/food.png')] opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-fuchsia-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
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
               <div className="h-64 relative overflow-hidden bg-slate-100 rounded-t-3xl"><img src={u.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={u.name} onError={(e)=>{(e.target as HTMLImageElement).src='https://placehold.co/600x400/f1f5f9/94a3b8?text=No+Image'}} /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div><div className="absolute top-4 left-4"><span className="bg-white/95 backdrop-blur-md text-violet-700 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 shadow-sm"><ShoppingBag size={12} className="text-violet-500" /> {u.category}</span></div></div>
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
      <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-violet-200">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
             <h3 className="text-3xl font-black mb-4">Punya Usaha di RT 002?</h3>
             <p className="text-violet-100 mb-8 text-base md:text-lg leading-relaxed">Ayo daftarkan usaha Anda secara gratis! Biar tetangga makin kenal dan rezeki makin lancar. Hubungi pengurus RT untuk pendataan.</p>
             <a href="https://wa.me/?text=Halo%20Pak%20RT,%20saya%20warga%20ingin%20mendaftarkan%20UMKM%20saya..." target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-600 rounded-2xl font-bold text-sm shadow-xl hover:bg-violet-50 transition-all active:scale-95"><Plus size={18}/> Daftar UMKM Sekarang</a>
          </div>
      </div>
    </div>
  );
};

const PublicInfo = ({ officials, cashFlow, ronda, rondaLogs, houses }: { officials: Official[], cashFlow: CashFlow[], ronda: RondaSchedule[], rondaLogs: RondaCheckLog[], houses: House[] }) => {
    const totalIncome = cashFlow.filter(c => c.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = cashFlow.filter(c => c.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    const currentBalance = totalIncome - totalExpense;
    
    // Explicitly define chartData for PublicInfo scope
    const chartData = (cashFlow || []).slice().reverse().map(c => ({ 
        date: new Date(c.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}), 
        amount: c.amount, 
        type: c.type 
    }));

    const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const sortedRonda = [...ronda].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
    const roleHierarchy = ['Ketua RT', 'Sekretaris', 'Bendahara', 'Bendahara RW', 'Koord. Keamanan', 'Seksi'];
    const sortedOfficials = [...officials].sort((a, b) => { const indexA = roleHierarchy.findIndex(r => a.role.includes(r)); const indexB = roleHierarchy.findIndex(r => b.role.includes(r)); return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB); });
    const [activeRondaDay, setActiveRondaDay] = useState(new Date().toLocaleDateString('id-ID', {weekday:'long'}));

    // Ronda Check Logic
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

    // Calculate Leaderboard
    const blocks = ['C5', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'];
    const leaderboard = blocks.map(block => {
        const blockHouses = houses ? houses.filter(h => h.block === block) : [];
        const occupiedHouses = blockHouses.filter(h => h.status === 'Occupied');
        const total = occupiedHouses.length;
        const paid = occupiedHouses.filter(h => h.paymentStatus === PaymentStatus.PAID).length;
        const percentage = total > 0 ? Math.round((paid / total) * 100) : 0;
        return { block, percentage, paid, total };
    }).sort((a, b) => b.percentage - a.percentage || b.paid - a.paid);
    
    return (
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-20 space-y-8 animate-fade-in">
            {/* ... same header ... */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl shadow-indigo-900/20 min-h-[400px] flex items-center justify-center">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                
                {/* Content */}
                <div className="relative z-10 text-center px-6 py-12 md:py-16 max-w-4xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-widest uppercase mb-6 backdrop-blur-sm shadow-lg shadow-indigo-900/50">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Transparansi Publik RT 002
                    </div>

                    {/* Main Typography */}
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight drop-shadow-sm">
                        Pusat Informasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Terpadu</span>
                    </h1>
                    <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
                        Akses data kepengurusan, laporan keuangan, dan jadwal kegiatan lingkungan secara terbuka, akuntabel, dan realtime.
                    </p>

                    {/* Quick Stats Pills */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-slate-300 text-xs font-bold">
                            <Users size={14} className="text-indigo-400"/>
                            {officials.length} Pengurus Aktif
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-slate-300 text-xs font-bold">
                             <Wallet size={14} className={currentBalance >= 0 ? "text-emerald-400" : "text-rose-400"}/>
                             Kondisi Kas: {currentBalance >= 0 ? 'Surplus' : 'Defisit'}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-slate-300 text-xs font-bold">
                             <Moon size={14} className="text-amber-400"/>
                             Siskamling: Aktif
                        </div>
                    </div>
                </div>
            </div>

            {/* LEADERBOARD SECTION (NEW) */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-100 shadow-xl shadow-amber-100/50 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Trophy size={140} className="text-amber-600"/>
                </div>
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wide mb-2">
                                <Flame size={12} fill="currentColor"/> Kompetisi Warga
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">Klasemen Kerukunan Blok</h2>
                            <p className="text-sm text-slate-600 mt-1 max-w-lg">
                                Peringkat blok berdasarkan persentase pelunasan iuran warga. Blok teratas adalah blok paling rukun dan peduli lingkungan!
                            </p>
                        </div>
                        <div className="text-right hidden md:block">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Update Realtime</p>
                            <p className="text-2xl font-black text-slate-800">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Podium Section */}
                        <div className="lg:col-span-2 flex items-end justify-center gap-2 md:gap-4 min-h-[250px] pb-6">
                            {/* 2nd Place */}
                            {leaderboard[1] && (
                                <div className="flex flex-col items-center w-1/3 max-w-[140px]">
                                    <div className="mb-2 text-center">
                                        <div className="text-2xl font-black text-slate-400">#2</div>
                                        <div className="text-sm font-bold text-slate-600">Blok {leaderboard[1].block}</div>
                                        <div className="text-xs font-medium text-slate-500">{leaderboard[1].percentage}% Lunas</div>
                                    </div>
                                    <div className="w-full h-32 bg-gradient-to-t from-slate-300 to-slate-200 rounded-t-2xl border-t-4 border-slate-400 shadow-lg flex items-end justify-center p-4 relative group">
                                        <Medal size={40} className="text-slate-500 mb-4 drop-shadow-sm group-hover:scale-110 transition-transform"/>
                                    </div>
                                </div>
                            )}
                            
                            {/* 1st Place */}
                            {leaderboard[0] && (
                                <div className="flex flex-col items-center w-1/3 max-w-[160px] -mt-8 relative z-10">
                                    <div className="absolute -top-12 animate-bounce-slow">
                                        <Trophy size={48} className="text-yellow-500 fill-yellow-400 drop-shadow-lg"/>
                                    </div>
                                    <div className="mb-2 text-center pt-6">
                                        <div className="text-3xl font-black text-yellow-600">#1</div>
                                        <div className="text-lg font-bold text-slate-800">Blok {leaderboard[0].block}</div>
                                        <div className="text-sm font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">{leaderboard[0].percentage}% Lunas</div>
                                    </div>
                                    <div className="w-full h-48 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-2xl border-t-4 border-yellow-500 shadow-xl flex items-end justify-center p-4 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                                        <div className="text-5xl font-black text-yellow-600 opacity-20 absolute bottom-2">1</div>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {leaderboard[2] && (
                                <div className="flex flex-col items-center w-1/3 max-w-[140px]">
                                    <div className="mb-2 text-center">
                                        <div className="text-2xl font-black text-amber-700">#3</div>
                                        <div className="text-sm font-bold text-slate-600">Blok {leaderboard[2].block}</div>
                                        <div className="text-xs font-medium text-slate-500">{leaderboard[2].percentage}% Lunas</div>
                                    </div>
                                    <div className="w-full h-24 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-2xl border-t-4 border-amber-800 shadow-lg flex items-end justify-center p-4 relative group">
                                        <Medal size={32} className="text-amber-200 mb-2 drop-shadow-sm group-hover:scale-110 transition-transform"/>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* List Section */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white p-4 overflow-y-auto max-h-[300px] custom-scrollbar">
                            <h4 className="font-bold text-slate-700 mb-4 text-sm flex items-center gap-2">
                                <List size={16}/> Peringkat Selanjutnya
                            </h4>
                            <div className="space-y-3">
                                {leaderboard.slice(3).map((item, idx) => (
                                    <div key={item.block} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm">
                                            {idx + 4}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-sm text-slate-800">Blok {item.block}</span>
                                                <span className="text-xs font-bold text-slate-600">{item.percentage}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-slate-400 rounded-full" 
                                                    style={{ width: `${item.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* ... (Existing Info Cards) ... */}
                 <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 relative overflow-hidden group hover:scale-[1.02] transition-transform"><div className="absolute -right-6 -top-6 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Wallet size={140}/></div><div className="relative z-10"><p className="text-emerald-100 font-medium text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><ShieldCheck size={14}/> Keuangan Warga</p><h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">Rp {currentBalance.toLocaleString()}</h2><div className="flex gap-3 text-xs font-bold"><div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl flex items-center gap-1.5 border border-white/10"><div className="bg-white/20 p-1 rounded-full"><ArrowUpRight size={10} className="text-emerald-200"/></div>+{totalIncome.toLocaleString()}</div><div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl flex items-center gap-1.5 border border-white/10"><div className="bg-white/20 p-1 rounded-full"><ArrowDownRight size={10} className="text-rose-200"/></div>-{totalExpense.toLocaleString()}</div></div></div></div>
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-100 flex flex-col justify-between group hover:border-brand-blue/30 transition-colors"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Struktur Organisasi</p><h2 className="text-4xl font-black text-slate-800 mt-2">{officials.length} <span className="text-lg font-medium text-slate-400">Personil</span></h2></div><div className="bg-brand-blue/5 p-4 rounded-2xl text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors"><Briefcase size={28}/></div></div><p className="text-xs text-slate-400 mt-4 leading-relaxed">Siap melayani kebutuhan administrasi, keamanan, dan sosial warga RT 002.</p></div>
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-100 flex flex-col justify-between group hover:border-indigo-200 transition-colors"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Jadwal Keamanan</p><h2 className="text-xl font-black text-slate-800 mt-2 capitalize">{new Date().toLocaleDateString('id-ID', {weekday:'long'})}</h2></div><div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Moon size={28}/></div></div><div className="mt-4"><div className="flex -space-x-2 overflow-hidden py-1">{ronda.find(r => r.day === new Date().toLocaleDateString('id-ID', {weekday:'long'}))?.members.slice(0,4).map((m,i) => (<div key={i} className="w-9 h-9 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-sm" title={m}>{m.charAt(0)}</div>)) || <span className="text-sm text-slate-400 italic">Tidak ada jadwal</span>}</div><p className="text-[10px] text-slate-400 mt-2">*Tim Siskamling Malam Ini</p></div></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm"><div className="flex items-center justify-between mb-6"><h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><Target className="text-brand-blue" size={20}/> Program & Agenda 2024</h3></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[{ title: "Perbaikan Saluran Air", status: "Sedang Berjalan", date: "Okt - Nov 2024", icon: RefreshCw, color: "text-amber-500", bg: "bg-amber-50" }, { title: "Penyemprotan Fogging", status: "Selesai", date: "September 2024", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" }, { title: "Pembuatan Taman Toga", status: "Direncanakan", date: "Desember 2024", icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" }, { title: "Musyawarah Warga", status: "Rutin Bulanan", date: "Tiap Tanggal 10", icon: Users, color: "text-purple-500", bg: "bg-purple-50" }].map((prog, idx) => (<div key={idx} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-default"><div className={`p-3 rounded-xl ${prog.bg} ${prog.color}`}><prog.icon size={20}/></div><div><h4 className="font-bold text-slate-800 text-sm">{prog.title}</h4><div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{prog.status}</span><span className="text-[10px] text-slate-400">{prog.date}</span></div></div></div>))}</div></div>
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm"><div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"><div><h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><BarChart3 className="text-emerald-500" size={20}/> Laporan Arus Kas</h3><p className="text-sm text-slate-500 mt-1">Grafik pemasukan dan pengeluaran kas operasional RT.</p></div><button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"><FileDown size={16}/> Unduh Laporan PDF</button></div><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} /><YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`}/><RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}} itemStyle={{fontSize: '12px', fontWeight: 'bold'}} formatter={(value: number) => [`Rp ${value.toLocaleString()}`, 'Jumlah']} labelStyle={{color: '#64748b', marginBottom: '4px', fontSize: '10px'}} /><Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" /></AreaChart></ResponsiveContainer></div><div className="mt-8 pt-8 border-t border-slate-50"><h4 className="font-bold text-sm text-slate-700 mb-4">Transaksi Terakhir</h4><div className="space-y-3">{cashFlow.slice(0, 4).map(cf => (<div key={cf.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${cf.type==='Income'?'bg-emerald-100 text-emerald-600':'bg-rose-100 text-rose-600'}`}>{cf.type==='Income' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}</div><div><p className="font-bold text-slate-800 text-xs md:text-sm">{cf.description}</p><p className="text-[10px] text-slate-400">{new Date(cf.date).toLocaleDateString('id-ID', {day:'numeric', month:'long'})}</p></div></div><span className={`font-bold text-xs md:text-sm ${cf.type==='Income'?'text-emerald-600':'text-rose-600'}`}>{cf.type==='Income' ? '+' : '-'} Rp {cf.amount.toLocaleString()}</span></div>))}</div></div></div>
                </div>
                <div className="lg:col-span-1"><div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-300 h-full flex flex-col relative overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Shield size={20} className="text-indigo-400"/> Jadwal Siskamling</h3>
                        <button onClick={() => setIsCheckModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md transition-all active:scale-95">
                            <LocateFixed size={12}/> Check Point
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col gap-3 relative z-10">{sortedRonda.map((r, i) => { const isToday = r.day === new Date().toLocaleDateString('id-ID', {weekday:'long'}); return (<div key={i} onClick={() => setActiveRondaDay(r.day)} className={`group p-4 rounded-2xl border transition-all cursor-pointer ${activeRondaDay === r.day ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/50 scale-[1.02]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}><div className="flex justify-between items-center mb-2"><span className={`font-bold text-sm ${activeRondaDay === r.day ? 'text-white' : 'text-slate-300'}`}>{r.day}</span>{isToday && <span className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full animate-pulse">HARI INI</span>}</div>{activeRondaDay === r.day && (<div className="space-y-2 animate-fade-in mt-2 pt-2 border-t border-white/20">{r.members.map((m, idx) => (<div key={idx} className="flex items-center gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-indigo-300"></div><span className="text-indigo-100">{m}</span></div>))}{r.members.length === 0 && <p className="text-xs text-white/40 italic">Belum ada petugas.</p>}</div>)}{activeRondaDay !== r.day && (<div className="flex -space-x-1 overflow-hidden">{r.members.slice(0,3).map((_, idx) => (<div key={idx} className="w-4 h-4 rounded-full bg-white/20 border border-slate-900"></div>))}{r.members.length > 3 && <div className="w-4 h-4 rounded-full bg-white/10 text-[8px] flex items-center justify-center text-white">+</div>}</div>)}</div>); })}</div>
                    <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
                        <p className="text-[10px] text-slate-400 text-center">Petugas ronda wajib melakukan check-point minimal 3x per shift.</p>
                    </div>
                </div>
                </div>
            </div>
            <section className="pt-8 border-t border-slate-200"><div className="flex items-center gap-3 mb-8"><div className="bg-purple-100 p-2.5 rounded-xl text-purple-600"><Users size={24}/></div><div><h2 className="text-xl md:text-2xl font-bold text-slate-800">Struktur Pengurus RT</h2><p className="text-sm text-slate-500">Periode Jabatan 2023 - 2026</p></div></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{sortedOfficials.map(o => (<div key={o.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"><div className={`h-24 relative ${o.role.includes('Ketua') ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : o.role.includes('Sekretaris') ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : o.role.includes('Bendahara') ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-slate-700 to-slate-600'}`}><div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div></div><div className="px-6 pb-6 text-center -mt-12 relative"><div className="inline-block p-1.5 bg-white rounded-full shadow-lg"><img src={o.photo||`https://ui-avatars.com/api/?name=${o.name}&background=random&size=128`} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 bg-slate-100" alt={o.name}/></div><h3 className="font-bold text-slate-800 text-lg mt-3">{o.name}</h3><div className="mt-1 mb-4"><span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${o.role.includes('Ketua') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : o.role.includes('Sekretaris') ? 'bg-blue-50 text-blue-700 border-blue-100' : o.role.includes('Bendahara') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{o.role}</span></div><div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-2 text-left"><div className="bg-slate-50 p-2 rounded-xl"><p className="text-[10px] text-slate-400 font-bold uppercase">Domisili</p><p className="text-xs font-bold text-slate-700 flex items-center gap-1"><Home size={10}/> {o.houseId}</p></div><a href={`https://wa.me/${o.phone}`} target="_blank" rel="noreferrer" className="bg-green-50 hover:bg-green-100 p-2 rounded-xl transition-colors cursor-pointer"><p className="text-[10px] text-green-600 font-bold uppercase">Kontak</p><p className="text-xs font-bold text-green-700 flex items-center gap-1"><Phone size={10}/> WhatsApp</p></a></div></div></div>))}</div></section>
        
            {/* CHECKPOINT MODAL */}
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
                            <option value="Portal Belakang">Portal Belakang</option>
                            <option value="Blok C5">Blok C5</option>
                            <option value="Blok C7">Blok C7</option>
                            <option value="Blok C8">Blok C8</option>
                            <option value="Blok C9">Blok C9</option>
                            <option value="Blok C10">Blok C10</option>
                            <option value="Blok C11">Blok C11</option>
                            <option value="Blok C12">Blok C12</option>
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

// --- Admin Dashboard ---
const AdminDashboard = ({ 
  houses, announcements, cashFlow, officials, reports, letters, ronda, inventory, umkm, polls, pdfConfig, setPdfConfig, rondaLogs, marketItems 
}: any) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'announcement' | 'cash' | 'official' | 'editHouse' | 'inventory' | 'ronda' | 'umkm' | 'dues' | 'import' | 'bulkDues' | 'poll'>('announcement');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Sort Ronda for Admin View
  const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const sortedRonda = Array.isArray(ronda) 
    ? [...ronda].sort((a: any, b: any) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))
    : [];

  // Chart Data Preparation (Explicitly Defined)
  const chartData = (cashFlow || []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((c: any) => ({
    date: new Date(c.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    amount: c.amount,
    type: c.type
  }));

  // State Management
  const [residentView, setResidentView] = useState<'grid' | 'table'>('table');
  const [searchResident, setSearchResident] = useState('');
  const [searchUmkm, setSearchUmkm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [filterBlock, setFilterBlock] = useState('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // New States for Inventory Filter
  const [searchInventory, setSearchInventory] = useState('');
  const [filterInventoryCondition, setFilterInventoryCondition] = useState('All');
  
  // Validation Errors State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [serviceTab, setServiceTab] = useState<'surat' | 'laporan'>('surat');
  
  // Forms
  const [annTitle, setAnnTitle] = useState(''); const [annContent, setAnnContent] = useState(''); const [annType, setAnnType] = useState<Announcement['type']>('General');
  const [annNotify, setAnnNotify] = useState(false); 
  
  // Cash Flow Form
  const [cashDesc, setCashDesc] = useState(''); 
  const [cashAmount, setCashAmount] = useState(''); 
  const [cashType, setCashType] = useState<'Income' | 'Expense'>('Income'); 
  const [cashCategory, setCashCategory] = useState('Iuran');
  const [editingCashId, setEditingCashId] = useState<string | null>(null);

  // Poll Form
  const [pollTitle, setPollTitle] = useState('');
  const [pollDesc, setPollDesc] = useState('');
  const [pollDeadline, setPollDeadline] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']); // Start with 2 options

  const [offName, setOffName] = useState(''); const [offRole, setOffRole] = useState(''); const [offPhone, setOffPhone] = useState(''); const [offHouse, setOffHouse] = useState(''); const [offPhoto, setOffPhoto] = useState(''); const [offId, setOffId] = useState<string|null>(null);
  const [invName, setInvName] = useState(''); const [invTotal, setInvTotal] = useState(''); const [invAvailable, setInvAvailable] = useState(''); const [invCondition, setInvCondition] = useState<'Baik'|'Perlu Perbaikan'|'Rusak'>('Baik'); const [invNotes, setInvNotes] = useState(''); const [invId, setInvId] = useState<string|null>(null);
  const [umkmName, setUmkmName] = useState(''); const [umkmOwner, setUmkmOwner] = useState(''); const [umkmCategory, setUmkmCategory] = useState('Kuliner'); const [umkmDesc, setUmkmDesc] = useState(''); const [umkmContact, setUmkmContact] = useState(''); const [umkmImage, setUmkmImage] = useState(''); const [umkmId, setUmkmId] = useState<string|null>(null);
  const [rondaDay, setRondaDay] = useState(''); const [rondaMembers, setRondaMembers] = useState(''); const [selectedRondaId, setSelectedRondaId] = useState<string|null>(null);
  const [duesHouseId, setDuesHouseId] = useState(''); const [duesAmount, setDuesAmount] = useState('25000'); const [duesStatus, setDuesStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  
  // Bulk Dues State
  const [bulkStatus, setBulkStatus] = useState<PaymentStatus>(PaymentStatus.PAID);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Settings / Profile State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Enhanced Edit House Form
  const [editHouseForm, setEditHouseForm] = useState({
      headOfFamily: '', occupants: 0, phone: '', paymentStatus: '', unifiedStatus: 'Tetap',
      hasPregnant: false, hasBaby: false, hasToddler: false, hasTeenager: false, hasElderly: false,
      accessCode: '' // New Field
  });

  // Helpers
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftTopic, setDraftTopic] = useState('');
  const [localConfig, setLocalConfig] = useState<PdfConfig>(pdfConfig);

  // --- AI ANALYSIS STATE ---
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ... (Keeping validation helpers)
  const validatePhone = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    return (clean.startsWith('08') || clean.startsWith('62')) && clean.length >= 10 && clean.length <= 14;
  };

  const validateAmount = (amount: string) => {
    const val = parseInt(amount);
    return !isNaN(val) && val > 0;
  };

  const validateText = (text: string, minLength = 3) => {
      return text && text.trim().length >= minLength;
  };


  // Computed Values for Residents Tab
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

  // Handlers
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

  // ... (Selection Handlers same as before)
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

  // ... (Other handlers same as before)
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

  // ... (Import Handlers)
  const handleDownloadTemplate = () => { /* ... */ };
  const handleProcessImport = async (e: React.FormEvent) => { /* ... */ };

  // ... (CRUD Handlers)
  const handleCreateAnnouncement = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if(!validateText(annTitle, 3)) { setFormErrors({title: "Judul minimal 3 karakter"}); return; }
    if(!validateText(annContent, 5)) { setFormErrors({content: "Isi pengumuman minimal 5 karakter"}); return; }
    await addAnnouncementToDb({ title: annTitle, content: annContent, type: annType, date: new Date().toISOString() }); 
    if (annNotify) await addNotificationToDb({ title: `Pengumuman: ${annTitle}`, message: annContent, date: new Date().toISOString(), type: annType === 'Urgent' ? 'Alert' : 'Info', target: 'All', isRead: false });
    setIsModalOpen(false); resetForms(); 
  };
  const handleDeleteAnnouncement = async (id: string) => { if (confirm("Hapus?")) await deleteAnnouncementFromDb(id); };
  const handleGenerateDraft = async () => { if(!draftTopic) return; setIsGenerating(true); const draft = await generateAnnouncementDraft(draftTopic); setAnnContent(draft); setAnnTitle(draftTopic); setIsGenerating(false); };
  
  // Finance
  const handleSaveTransaction = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    const errors: any = {};
    if(!validateText(cashDesc, 3)) errors.desc = "Deskripsi minimal 3 karakter";
    if(!validateAmount(cashAmount)) errors.amount = "Nominal angka positif";
    if(Object.keys(errors).length > 0) { setFormErrors(errors); return; }
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
  
  // Inventory
  const handleSaveInventory = async (e: React.FormEvent) => { e.preventDefault(); /* ... validation ... */ const itemData = { name: invName, total: parseInt(invTotal), available: parseInt(invAvailable), condition: invCondition, notes: invNotes }; if (invId) await updateInventoryInDb(invId, itemData); else await addInventoryToDb(itemData); setIsModalOpen(false); resetForms(); };
  const openEditInventory = (item: InventoryItem) => { setInvId(item.id); setInvName(item.name); setInvTotal(item.total.toString()); setInvAvailable(item.available.toString()); setInvCondition(item.condition); setInvNotes(item.notes || ''); setModalType('inventory'); setIsModalOpen(true); };
  const handleDeleteInventory = async (id: string) => { if(confirm("Hapus?")) await deleteInventoryFromDb(id); };
  
  // UMKM
  const handleSaveUMKM = async (e: React.FormEvent) => { e.preventDefault(); /* ... */ const umkmData = { name: umkmName, owner: umkmOwner, category: umkmCategory, description: umkmDesc, contact: umkmContact, image: umkmImage }; if (umkmId) await updateUMKMInDb(umkmId, umkmData); else await addUMKMToDb(umkmData); setIsModalOpen(false); resetForms(); };
  const openEditUMKM = (u: UMKM) => { setUmkmId(u.id); setUmkmName(u.name); setUmkmOwner(u.owner); setUmkmCategory(u.category); setUmkmDesc(u.description); setUmkmContact(u.contact); setUmkmImage(u.image); setModalType('umkm'); setIsModalOpen(true); };
  const handleDeleteUMKM = async (id: string) => { if (confirm("Hapus?")) await deleteUMKMFromDb(id); };
  
  // Ronda
  const openEditRonda = (schedule: RondaSchedule) => { if (!schedule.id) return; setSelectedRondaId(schedule.id); setRondaDay(schedule.day); setRondaMembers(schedule.members.join(', ')); setModalType('ronda'); setIsModalOpen(true); };
  const handleSaveRonda = async (e: React.FormEvent) => { e.preventDefault(); if (!selectedRondaId) return; const membersArray = rondaMembers.split(',').map(m => m.trim()).filter(m => m !== ''); await updateRondaSchedule(selectedRondaId, membersArray); setIsModalOpen(false); resetForms(); };
  
  // Officials
  const handleSaveOfficial = async (e: React.FormEvent) => { e.preventDefault(); /* ... */ const officialData = { name: offName, role: offRole, phone: offPhone, houseId: offHouse, photo: offPhoto || undefined }; if (offId) await updateOfficialInDb(offId, officialData); else await addOfficialToDb(officialData); setIsModalOpen(false); resetForms(); };
  const handleDeleteOfficial = async (id: string) => { if (confirm("Hapus?")) await deleteOfficialFromDb(id); };
  const handleEditOfficial = (o: Official) => { setOffId(o.id); setOffName(o.name); setOffRole(o.role); setOffPhone(o.phone); setOffHouse(o.houseId); setOffPhoto(o.photo||''); setModalType('official'); setIsModalOpen(true); };
  const openDuesModal = (h: House) => { setDuesHouseId(h.id); setDuesStatus(PaymentStatus.PAID); setModalType('dues'); setIsModalOpen(true); };
  
  // Reports & Letters
  const handleUpdateReport = async (id: string, s: string) => { await updateReportStatus(id, s); if (s === 'Selesai') await addNotificationToDb({ title: "Laporan Ditindaklanjuti", message: "Laporan Anda telah ditandai selesai oleh Admin.", date: new Date().toISOString(), type: 'Success', target: 'All' }); };
  const handleDeleteReport = async (id: string) => await deleteReportFromDb(id);
  const handleUpdateLetter = async (id: string, s: string) => await updateLetterStatus(id, s);
  const handleDeleteLetter = async (id: string) => await deleteLetterFromDb(id);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PdfConfig) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setLocalConfig(prev => ({ ...prev, [field]: reader.result as string })); reader.readAsDataURL(file); } };
  const handleSaveConfig = () => { try { setPdfConfig(localConfig); localStorage.setItem('pdf_config', JSON.stringify(localConfig)); alert("Konfigurasi tersimpan!"); } catch (e) { alert("Gagal menyimpan."); } };

  // Market Items (Admin)
  const handleDeleteMarketItem = async (id: string) => { if(confirm("Hapus iklan ini?")) await deleteMarketItem(id); };
  const handleMarkSold = async (id: string) => { if(confirm("Tandai terjual?")) await updateMarketItemStatus(id, 'Sold'); };

  // Edit House
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
          accessCode: editHouseForm.accessCode // Save Access Code
      }; 
      
      await updateHouseData(selectedHouse.id, payload); 
      setIsModalOpen(false); 
  };

  // POLL Handlers
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
  
  const handleClosePoll = async (id: string) => { if(confirm("Tutup voting ini? Warga tidak akan bisa memilih lagi.")) await updatePollStatus(id, 'Closed'); };
  const handleDeletePoll = async (id: string) => { if(confirm("Hapus voting ini selamanya?")) await deletePollFromDb(id); };

  // Nav Configuration
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
      {/* Sidebar Desktop */}
      <div className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 fixed h-full z-30">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3"><div className="bg-slate-900 text-white p-2 rounded-xl"><Shield size={24}/></div><div><h1 className="font-black text-xl text-slate-900 tracking-tight">TERAS Admin</h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dashboard v2.0</p></div></div>
          {renderNav()}
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (<div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>{/* ... */}</div>)}

      {/* Main Content */}
      <div className="flex-1 md:ml-72 p-4 md:p-8 pb-24 overflow-x-hidden">
          {/* Header Mobile */}
          <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100"><div className="flex items-center gap-2"><div className="bg-slate-900 text-white p-1.5 rounded-lg"><Shield size={18}/></div><span className="font-bold text-slate-900">TERAS Admin</span></div><button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-50 rounded-lg"><Menu size={20}/></button></div>
          
          {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                   <h2 className="text-2xl font-bold">Dashboard Overview</h2>
                   {/* ... Overview Cards ... */}
              </div>
          )}

          {activeTab === 'facilities' && (
              <div className="space-y-8 animate-fade-in">
                {/* 1. SECTION: Jadwal Ronda */}
                <div>
                   <h2 className="font-black text-2xl text-slate-800 mb-4 flex items-center gap-2"><Moon size={24} className="text-indigo-600"/> Jadwal Siskamling</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       {sortedRonda.length > 0 ? sortedRonda.map((r:any) => {
                           const isToday = r.day === new Date().toLocaleDateString('id-ID', {weekday:'long'});
                           return (<div key={r.id || r.day} className={`relative p-5 rounded-3xl border transition-all duration-300 group ${isToday ? 'bg-gradient-to-br from-indigo-900 to-indigo-700 border-indigo-500 shadow-xl shadow-indigo-200 ring-2 ring-indigo-300 transform scale-[1.02]' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg'}`}>{isToday && (<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm animate-bounce-slow">Hari Ini</div>)}<div className="flex justify-between items-start mb-4"><div><h4 className={`font-black text-lg ${isToday ? 'text-white' : 'text-slate-700'}`}>{r.day}</h4><p className={`text-xs font-medium ${isToday ? 'text-indigo-200' : 'text-slate-400'}`}>{r.members.length} Personil</p></div><button onClick={() => { setSelectedRondaId(r.id); setRondaDay(r.day); setRondaMembers(r.members.join(', ')); setModalType('ronda'); setIsModalOpen(true); }} className={`p-2 rounded-xl transition-colors ${isToday ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}><Edit2 size={16}/></button></div><div className="space-y-2">{r.members.length > 0 ? r.members.map((m:any, idx:any) => (<div key={idx} className={`flex items-center gap-2 text-sm p-2 rounded-xl ${isToday ? 'bg-white/10 text-indigo-50 border border-white/5' : 'bg-slate-50 text-slate-600'}`}><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isToday ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>{m.charAt(0)}</div><span className="truncate">{m}</span></div>)) : (<div className={`text-center py-4 italic text-xs ${isToday ? 'text-indigo-300' : 'text-slate-400'}`}>Belum ada jadwal</div>)}</div></div>);
                       }) : (<div className="col-span-full text-center py-8 text-slate-400 italic bg-slate-50 rounded-2xl border-dashed border-2 border-slate-200">Jadwal ronda belum dikonfigurasi.</div>)}
                   </div>
                </div>
                
                {/* 2. SECTION: Fasilitas & Keuangan (With Chart) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><BarChart3 className="text-emerald-500" size={20}/> Laporan Arus Kas</h3>
                                <p className="text-sm text-slate-500 mt-1">Grafik pemasukan dan pengeluaran kas operasional RT.</p>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"><FileDown size={16}/> Unduh Laporan PDF</button>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs><linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`}/>
                                    <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}} itemStyle={{fontSize: '12px', fontWeight: 'bold'}} formatter={(value: number) => [`Rp ${value.toLocaleString()}`, 'Jumlah']} labelStyle={{color: '#64748b', marginBottom: '4px', fontSize: '10px'}} />
                                    <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* ... other facility content ... */}
                </div>
              </div>
          )}
          
          {/* ... (Other tabs) ... */}
          
          {/* Modals */}
          {isModalOpen && (
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalType === 'announcement' ? "Buat Pengumuman" : "Modal"}>
                 {modalType === 'announcement' && (
                     <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                         <div><label className="block text-xs font-bold mb-1.5 text-slate-700">Judul</label><input className="w-full p-3 bg-white border rounded-xl" value={annTitle} onChange={e=>setAnnTitle(e.target.value)} required/></div>
                         <Button type="submit" className="w-full">Terbitkan</Button>
                     </form>
                 )}
                 {/* ... other modal contents ... */}
             </Modal>
          )}
      </div>
    </div>
  );
};

// --- APP ROOT ---
export const App = () => {
  const [loading, setLoading] = useState(true);
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
  
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pdfConfig, setPdfConfig] = useState<PdfConfig>(DEFAULT_PDF_CONFIG);

  useEffect(() => {
    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(!!currentUser);
      setLoading(false);
    });

    // Load PDF Config
    const storedConfig = localStorage.getItem('pdf_config');
    if (storedConfig) {
        try { setPdfConfig(JSON.parse(storedConfig)); } catch(e) {}
    }

    if (!isFirebaseConfigured) { 
        // If firebase not configured, we might want to load mock data or keep loading false
        setLoading(false); 
        // Optional: Initialize with mock data here if needed
        setHouses(generateHouses());
        setAnnouncements(MOCK_ANNOUNCEMENTS);
        setCashFlow(MOCK_CASHFLOW);
        setOfficials(INITIAL_OFFICIALS);
        setRonda(MOCK_RONDA);
        return unsubscribeAuth; 
    }

    // Data Subscriptions
    const unsubs = [
      subscribeToCollection('houses', setHouses),
      subscribeToCollection('announcements', setAnnouncements),
      subscribeToCollection('cashFlow', setCashFlow),
      subscribeToCollection('officials', setOfficials),
      subscribeToActiveReports(setReports),
      subscribeToCollection('letters', setLetters),
      subscribeToCollection('ronda', setRonda),
      subscribeToCollection('inventory', setInventory),
      subscribeToCollection('umkm', setUmkm),
      subscribeToCollection('polls', setPolls),
      subscribeToRondaLogs(setRondaLogs),
      subscribeToMarketItems(setMarketItems),
      subscribeToNotifications(setNotifications)
    ];

    return () => {
      unsubscribeAuth();
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  const markNotificationRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;

  return (
    <HashRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={
          <>
            <PublicHeader notifications={notifications} onMarkRead={markNotificationRead} />
            <PublicHome houses={houses} announcements={announcements} ronda={ronda} reports={reports} officials={officials} />
            <PanicButton />
            <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
          </>
        } />
        <Route path="/voting" element={
          <>
            <PublicHeader notifications={notifications} onMarkRead={markNotificationRead} />
            <PublicVoting polls={polls} />
            <PanicButton />
          </>
        } />
        <Route path="/market" element={
          <>
            <PublicHeader notifications={notifications} onMarkRead={markNotificationRead} />
            <PublicMarket items={marketItems} />
            <PanicButton />
          </>
        } />
        <Route path="/services" element={
          <>
            <PublicHeader notifications={notifications} onMarkRead={markNotificationRead} />
            <PublicServices pdfConfig={pdfConfig} />
            <PanicButton />
          </>
        } />
        <Route path="/umkm" element={
          <>
            <PublicHeader notifications={notifications} onMarkRead={markNotificationRead} />
            <PublicUMKM umkmData={umkm} />
            <PanicButton />
          </>
        } />
        <Route path="/info" element={
          <>
            <PublicHeader notifications={notifications} onMarkRead={markNotificationRead} />
            <PublicInfo officials={officials} cashFlow={cashFlow} ronda={ronda} rondaLogs={rondaLogs} houses={houses} />
            <PanicButton />
          </>
        } />

        {/* ADMIN ROUTES */}
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
              polls={polls}
              rondaLogs={rondaLogs}
              marketItems={marketItems}
              pdfConfig={pdfConfig}
              setPdfConfig={setPdfConfig}
            />
          </AdminRouteWrapper>
        } />
      </Routes>
    </HashRouter>
  );
};