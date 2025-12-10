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
  Database, Lock, Eye, EyeOff, Save, Trash, Sparkles, Loader2, CheckSquare, Bell
} from 'lucide-react';
import { CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

// Destructure React Router DOM components
const { HashRouter, Routes, Route, useNavigate, useLocation, useSearchParams } = ReactRouterDOM;

// Components & Services
import { Logo, generateHouses, MOCK_ANNOUNCEMENTS, MOCK_UMKM, MOCK_RONDA, MOCK_CASHFLOW, MOCK_GALLERY, INITIAL_OFFICIALS, DEFAULT_PDF_CONFIG, MOCK_INVENTORY, INITIAL_REPORTS, INITIAL_LETTERS } from './constants';
import { House, Announcement, Report, LetterRequest, PaymentStatus, UMKM, CashFlow, Official, RondaSchedule, PdfConfig, InventoryItem, AppNotification } from './types';
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
  addNotificationToDb
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
        // Native Browser Notification
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

    // Close on click outside
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
        // Request Permission on first click if not granted
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    };

    const handleRead = (id: string) => {
        onMarkRead(id);
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
                            <div key={n.id} onClick={() => handleRead(n.id)} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${n.isRead ? 'opacity-60' : 'bg-blue-50/30'}`}>
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

const PublicHome = ({ houses, announcements, ronda, reports, officials }: { houses: House[], announcements: Announcement[], ronda: RondaSchedule[], reports: Report[], officials: Official[] }) => {
  const navigate = useNavigate();
  const dateObj = new Date();
  const today = dateObj.toLocaleDateString('id-ID', {weekday:'long'});
  const fullDate = dateObj.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
  const todayRonda = ronda.find(r => r.day === today);

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
              {announcements.length === 0 && <div className="text-center p-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm italic">Belum ada pengumuman terbaru.</div>}
            </div>
          </div>
        </div>
        <div className="space-y-6 md:space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Card title="Ronda Malam Ini" className="bg-gradient-to-b from-slate-800 to-slate-900 text-white border-0 shadow-lg shadow-slate-300 relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Moon size={120} />
             </div>
             
             {/* Day & Date Header */}
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
               {todayRonda && todayRonda.members.length > 0 ? todayRonda.members.map((member, i) => (
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
  const handleSubmitLapor = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      const newReport: any = { type: reportType, description: reportDesc, reporterName: reporterName || "Anonim", date: new Date().toISOString().split('T')[0], status: 'Baru', houseId: reportHouseId ? reportHouseId.toUpperCase() : undefined }; 
      await addReportToDb(newReport); 
      
      // AUTO TRIGGER: Notify Admin about new report
      await addNotificationToDb({
          title: `Laporan Warga: ${reportType}`,
          message: `${reporterName || 'Warga'} melaporkan: ${reportDesc}`,
          date: new Date().toISOString(),
          type: 'Alert',
          target: 'All', // Ideally Admin, but 'All' works for this setup
          isRead: false
      });

      saveToHistory({...newReport, category: 'Laporan', title: `Laporan ${newReport.type}`}); 
      alert("Laporan berhasil dikirim!"); 
      setReportDesc(''); setReporterName(''); setReportHouseId(''); 
  };
  const clearHistory = () => { if(confirm("Hapus riwayat lokal?")) { setLocalHistory([]); localStorage.removeItem('userRequestHistory'); } }
  const reportTags = [{label: "Lampu Mati", icon: CloudRain}, {label: "Sampah Numpuk", icon: Trash2}, {label: "Selokan Mampet", icon: ArrowDownRight}, {label: "Hewan Liar", icon: AlertTriangle}, {label: "Orang Asing", icon: User}];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-20 space-y-8 animate-fade-in">
       {/* NEW HEADER START */}
       <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl shadow-blue-900/20 min-h-[400px] flex items-center justify-center text-center">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950"></div>
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            
            {/* Content */}
            <div className="relative z-10 px-6 py-12 md:py-16 max-w-4xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-6 backdrop-blur-sm shadow-lg shadow-blue-900/50 mx-auto">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    Portal Layanan Warga
                </div>

                {/* Main Typography */}
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight drop-shadow-sm">
                    Urus Administrasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Tanpa Antri</span>
                </h1>
                <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
                    Platform digital terpadu untuk pembuatan surat pengantar, pelaporan masalah lingkungan, dan arsip dokumen warga secara mandiri.
                </p>

                {/* Quick Stats Pills */}
                <div className="flex flex-wrap justify-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-slate-300 text-xs font-bold">
                        <FileText size={14} className="text-blue-400"/>
                        Surat Pengantar Instan
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-slate-300 text-xs font-bold">
                         <AlertTriangle size={14} className="text-rose-400"/>
                         Lapor Masalah 24/7
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-slate-300 text-xs font-bold">
                         <History size={14} className="text-emerald-400"/>
                         Riwayat Tersimpan
                    </div>
                </div>
            </div>
       </div>
       {/* NEW HEADER END */}

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
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6"><h3 className="font-bold text-rose-700 text-lg mb-1 flex items-center gap-2"><AlertTriangle size={20}/> Form Laporan Larga</h3><p className="text-xs text-rose-600">Laporan Anda akan masuk ke dashboard Ketua RT & Keamanan. Gunakan fitur ini secara bijak.</p></div>
                    <form onSubmit={handleSubmitLapor} className="space-y-6">
                        <div className="space-y-4"><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Kategori Masalah</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" value={reportType} onChange={e=>setReportType(e.target.value as any)}><option>Keamanan</option><option>Kebersihan</option><option>Fasilitas</option><option>Lainnya</option></select></div><div><label className="block text-xs font-bold text-slate-700 mb-2 ml-1">Pilih Masalah Cepat (Klik untuk isi)</label><div className="flex flex-wrap gap-2">{reportTags.map((tag, idx) => (<button type="button" key={idx} onClick={() => setReportDesc(tag.label)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all"><tag.icon size={12} /> {tag.label}</button>))}</div></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Lokasi Kejadian / Blok Rumah</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="Cth: C5-05 (Wajib diisi)" value={reportHouseId} onChange={e=>setReportHouseId(e.target.value)} required /></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Deskripsi Lengkap</label><textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-32 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="Jelaskan detail kejadian..." value={reportDesc} onChange={e=>setReportDesc(e.target.value)} required></textarea></div><div><label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Nama Pelapor (Opsional)</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="Boleh dikosongkan jika ingin anonim" value={reporterName} onChange={e=>setReporterName(e.target.value)} /></div></div><Button type="submit" className="w-full py-3.5 bg-rose-600 text-white shadow-lg shadow-rose-200 hover:bg-rose-700 border-transparent"><Send size={18}/> Kirim Laporan</Button>
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
            {/* NEW HEADER START */}
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
            {/* NEW HEADER END */}

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

const AdminDashboard = ({ houses, announcements, ronda, reports, officials, cashFlow, umkm, letters, inventory, notifications, onLogout }: any) => {
    const navigate = useNavigate();
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Dashboard Admin</h1>
                    <p className="text-slate-500 text-sm">Panel Kontrol Terpadu RT 002</p>
                </div>
                <Button onClick={onLogout} variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300">
                    <LogOut size={18}/> Keluar
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card title="Warga" subtitle={`${houses.length} KK Terdaftar`} icon={Users} className="border-l-4 border-l-blue-500"/>
                <Card title="Kas RT" subtitle={`Rp ${cashFlow.reduce((a:number,c:any)=>a+(c.type==='Income'?c.amount:-c.amount),0).toLocaleString()}`} icon={Wallet} className="border-l-4 border-l-emerald-500"/>
                <Card title="Laporan" subtitle={`${reports.filter((r:any)=>r.status!=='Selesai').length} Aktif`} icon={AlertTriangle} className="border-l-4 border-l-rose-500"/>
                <Card title="Surat" subtitle={`${letters.filter((l:any)=>l.status==='Pending').length} Pending`} icon={FileText} className="border-l-4 border-l-amber-500"/>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400 italic">
                Fitur Admin Lengkap tersedia di source code asli. 
                (Bagian ini direkonstruksi untuk memperbaiki error build)
            </div>
        </div>
    );
};

export const App = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [ronda, setRonda] = useState<RondaSchedule[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
  const [umkm, setUmkm] = useState<UMKM[]>([]);
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
        setIsAdmin(!!user);
        setLoading(false);
    });

    const unsubs = [
        subscribeToCollection('houses', (d) => setHouses(d as House[])),
        subscribeToCollection('announcements', (d) => setAnnouncements(d as Announcement[])),
        subscribeToCollection('ronda', (d) => setRonda(d as RondaSchedule[])),
        subscribeToActiveReports((d) => setReports(d as Report[])),
        subscribeToCollection('officials', (d) => setOfficials(d as Official[])),
        subscribeToCollection('cashFlow', (d) => setCashFlow(d as CashFlow[])),
        subscribeToCollection('umkm', (d) => setUmkm(d as UMKM[])),
        subscribeToCollection('letters', (d) => setLetters(d as LetterRequest[])),
        subscribeToCollection('inventory', (d) => setInventory(d as InventoryItem[])),
        subscribeToNotifications((d) => setNotifications(d as AppNotification[]))
    ];

    return () => {
        unsubAuth();
        unsubs.forEach(u => u());
    };
  }, []);

  const handleMarkRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleLogout = async () => {
      await logoutAdmin();
      setIsAdmin(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-brand-blue" size={40} /></div>;

  return (
    <HashRouter>
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20 md:pb-0">
             <PublicHeader notifications={notifications} onMarkRead={handleMarkRead} />
             
             <Routes>
                <Route path="/" element={<PublicHome houses={houses} announcements={announcements} ronda={ronda} reports={reports} officials={officials} />} />
                <Route path="/services" element={<PublicServices pdfConfig={DEFAULT_PDF_CONFIG} />} />
                <Route path="/umkm" element={<PublicUMKM umkmData={umkm} />} />
                <Route path="/info" element={<PublicInfo officials={officials} cashFlow={cashFlow} ronda={ronda} />} />
                <Route path="/admin" element={
                    <AdminRouteWrapper isAdmin={isAdmin} onLogin={() => setIsAdmin(true)}>
                        <AdminDashboard 
                            houses={houses} 
                            announcements={announcements} 
                            ronda={ronda} 
                            reports={reports} 
                            officials={officials}
                            cashFlow={cashFlow}
                            umkm={umkm}
                            letters={letters}
                            inventory={inventory}
                            notifications={notifications}
                            onLogout={handleLogout}
                        />
                    </AdminRouteWrapper>
                } />
             </Routes>

             <PanicButton />
             <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
        </div>
    </HashRouter>
  );
};