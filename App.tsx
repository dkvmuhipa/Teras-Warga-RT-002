

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
  Heart, Baby, Accessibility, Smile, GraduationCap, Key
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { jsPDF } from "jspdf";

// Components & Services
import { Logo, generateHouses, MOCK_ANNOUNCEMENTS, MOCK_UMKM, INITIAL_REPORTS, INITIAL_LETTERS, MOCK_RONDA, MOCK_CASHFLOW, MOCK_GALLERY, RT_ADDRESS, APP_NAME, INITIAL_OFFICIALS, DEFAULT_PDF_CONFIG, MOCK_INVENTORY } from './constants';
import { House, Announcement, Report, LetterRequest, PaymentStatus, UMKM, CashFlow, Official, RondaSchedule, PdfConfig, InventoryItem } from './types';
import { HouseMap } from './components/HouseMap';
import { generateAnnouncementDraft } from './services/geminiService';
import { generateSuratPengantar, generateResidentReportPDF, generateFinancialReportPDF } from './services/pdfService';
import { AdminRouteWrapper, AdminLogin } from './components/AdminComponents'; 
import { ChatBot } from './components/ChatBot';

// Firebase Services
import { isFirebaseConfigured } from './services/firebaseConfig';
import { 
  subscribeToCollection, 
  addAnnouncementToDb, 
  updateAnnouncementInDb, // NEW
  deleteAnnouncementFromDb, 
  addTransactionToDb, 
  updateTransactionInDb, // NEW
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
// (Components PublicHome, PublicServices, PublicUMKM, PublicInfo remain same - condensed here for brevity)
const PublicHome = ({ houses, announcements, ronda, reports, officials }: any) => { /* ... existing code ... */ return <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 animate-fade-in mb-20 md:mb-20"><HeroSection /><div className="w-full"><HouseMap houses={houses} isAdmin={false} reports={reports} officials={officials} /></div></div> };
const PublicServices = ({ pdfConfig }: any) => { /* ... existing code ... */ return <div>Services</div> }; 
const PublicUMKM = ({ umkmData }: any) => { /* ... existing code ... */ return <div>UMKM</div> };
const PublicInfo = ({ officials, cashFlow, ronda }: any) => { /* ... existing code ... */ return <div>Info</div> };


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

  // -- Service Management State --
  const [serviceTab, setServiceTab] = useState<'surat' | 'laporan'>('surat');

  // Announcement State
  const [annId, setAnnId] = useState<string | null>(null); // New: For Edit
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<Announcement['type']>('General');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftTopic, setDraftTopic] = useState('');
  
  // Cashflow State
  const [cashId, setCashId] = useState<string | null>(null); // New: For Edit
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

  const navigate = useNavigate();

  // --- Handlers ---

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const annData: any = { title: annTitle, content: annContent, type: annType, date: new Date().toISOString() };
    if (annId) {
        await updateAnnouncementInDb(annId, annData);
    } else {
        await addAnnouncementToDb(annData);
    }
    setIsModalOpen(false); resetForms();
  };

  const openEditAnnouncement = (ann: Announcement) => {
      setAnnId(ann.id);
      setAnnTitle(ann.title);
      setAnnContent(ann.content);
      setAnnType(ann.type);
      setModalType('announcement');
      setIsModalOpen(true);
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
     const txData: any = { description: cashDesc, amount: parseInt(cashAmount), type: cashType, category: cashCategory, date: new Date().toISOString().split('T')[0] };
     if (cashId) {
         await updateTransactionInDb(cashId, txData);
     } else {
         await addTransactionToDb(txData);
     }
     setIsModalOpen(false); resetForms();
  };

  const openEditTransaction = (cf: CashFlow) => {
      setCashId(cf.id);
      setCashDesc(cf.description);
      setCashAmount(cf.amount.toString());
      setCashType(cf.type);
      setCashCategory(cf.category);
      setModalType('cash');
      setIsModalOpen(true);
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
      const headers = ["Blok", "Nomor", "Kepala Keluarga", "Status Hunian", "Jumlah Penghuni", "Status Iuran", "No. HP"];
      const rows = houses.map(h => [
          h.block, 
          h.number, 
          `"${h.headOfFamily}"`, 
          h.residenceType || 'Tetap', 
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

  const handlePrintFinance = () => { 
      generateFinancialReportPDF(cashFlow, pdfConfig);
  };
  
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
          residenceType: h.residenceType || 'Tetap', 
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
          residenceType: editHouseForm.residenceType, 
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
      setAnnId(null); setAnnTitle(''); setAnnContent(''); setDraftTopic('');
      setCashId(null); setCashDesc(''); setCashAmount(''); setCashType('Income');
      setOffName(''); setOffRole(''); setOffPhone(''); setOffHouse(''); setOffPhoto(''); setOffId(null);
      setInvName(''); setInvTotal(''); setInvAvailable(''); setInvNotes(''); setInvId(null);
      setRondaMembers(''); setSelectedRondaId(null);
      setUmkmName(''); setUmkmOwner(''); setUmkmCategory(''); setUmkmDesc(''); setUmkmContact(''); setUmkmImage(''); setUmkmId(null);
      setDuesHouseId(''); setDuesAmount('25000'); setDuesStatus(PaymentStatus.PAID);
  };

  const adminNavItems = [
      {id: 'overview', icon: LayoutDashboard, label: 'Overview'},
      {id: 'services', icon: Archive, label: 'Layanan'},
      {id: 'residents', icon: Users, label: 'Data Warga'},
      {id: 'umkm', icon: ShoppingBag, label: 'UMKM Warga'}, 
      {id: 'finance', icon: DollarSign, label: 'Keuangan'},
      {id: 'facilities', icon: Package, label: 'Fasilitas & Jadwal'},
      {id: 'announcements', icon: Megaphone, label: 'Pengumuman'},
      {id: 'officials', icon: Briefcase, label: 'Pengurus'},
      {id: 'settings', icon: Settings, label: 'Pengaturan'},
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex relative">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
           <div className="w-64 bg-slate-900 h-full p-6 shadow-xl animate-slide-in-right flex flex-col" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2"><Shield className="text-brand-blue"/> Admin</h2>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
               </div>
               <nav className="flex-1 space-y-2 overflow-y-auto">
                   {adminNavItems.map(item => (
                       <button 
                           key={item.id}
                           onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                           className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-brand-blue text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                       >
                           <item.icon size={18} /> <span className="font-medium text-sm">{item.label}</span>
                       </button>
                   ))}
               </nav>
               <div className="pt-4 border-t border-slate-800">
                  <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                      <LogOut size={18} /> <span className="font-medium text-sm">Keluar</span>
                  </button>
               </div>
           </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="w-64 bg-slate-900 text-white fixed h-full hidden md:flex flex-col overflow-y-auto z-20">
         <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="text-brand-blue"/> Admin Panel</h2>
            <p className="text-xs text-slate-400 mt-1">Manage RT 002/020</p>
         </div>
         <nav className="flex-1 p-4 space-y-1">
            {adminNavItems.map(item => (
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
      <div className="flex-1 md:ml-64 p-4 md:p-8 pb-safe-area-pb md:pb-8 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 md:mb-8 sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 py-2">
             <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-white rounded-lg border border-slate-200">
                   <Menu size={24} />
                </button>
                <div>
                    <h1 className="text-lg md:text-2xl font-bold text-slate-800 uppercase tracking-tight line-clamp-1">
                        {activeTab === 'overview' ? 'Dashboard' : 
                        activeTab === 'finance' ? 'Keuangan' : 
                        activeTab === 'residents' ? 'Data Warga' : 
                        activeTab === 'umkm' ? 'UMKM' :
                        activeTab === 'officials' ? 'Pengurus' : 
                        activeTab === 'services' ? 'Layanan' :
                        activeTab === 'facilities' ? 'Fasilitas' :
                        activeTab === 'settings' ? 'Pengaturan' : 'Pengumuman'}
                    </h1>
                </div>
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
                      <Button onClick={() => { resetForms(); setModalType('umkm'); setIsModalOpen(true); }}><Plus size={18}/> Tambah</Button>
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
                      <div className="flex flex-wrap gap-2 w-full md:w-auto">
                           <Button onClick={() => generateResidentReportPDF(houses, pdfConfig)} className="text-xs h-10 bg-slate-800 text-white flex-1 md:flex-none">
                               <Printer size={16}/> PDF
                           </Button>
                           <Button onClick={handleExportCSV} variant="outline" className="text-xs h-10 flex-1 md:flex-none">
                               <Download size={16}/> CSV
                           </Button>
                           <div className="flex bg-slate-100 p-1 rounded-lg">
                              <button onClick={() => setResidentView('grid')} className={`p-2 rounded-md transition-all ${residentView === 'grid' ? 'bg-white shadow text-brand-blue' : 'text-slate-500'}`}><Grid size={20} /></button>
                              <button onClick={() => setResidentView('table')} className={`p-2 rounded-md transition-all ${residentView === 'table' ? 'bg-white shadow text-brand-blue' : 'text-slate-500'}`}><List size={20} /></button>
                           </div>
                      </div>
                  </div>
                  {residentView === 'grid' ? (
                      // Pass reports to HouseMap in Admin view as well
                      <div className="overflow-x-auto">
                        <HouseMap 
                            houses={houses} 
                            isAdmin={true} 
                            onEditHouse={openEditHouse} 
                            onPayDues={openDuesModal}
                            reports={reports}
                            officials={officials} 
                        />
                      </div>
                  ) : (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                          <table className="w-full text-sm text-left whitespace-nowrap">
                              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs"><tr><th className="p-4">Rumah</th><th className="p-4">Kepala Keluarga</th><th className="p-4">Status</th><th className="p-4">Iuran</th><th className="p-4 text-center">Aksi</th></tr></thead>
                              <tbody className="divide-y divide-slate-100">{houses.filter(h => h.headOfFamily.toLowerCase().includes(searchResident.toLowerCase()) || h.id.toLowerCase().includes(searchResident.toLowerCase())).map(h => {
                                      const hasIssue = reports.some(r => r.houseId === h.id && r.status !== 'Selesai');
                                      return (
                                          <tr key={h.id} className={`transition-colors border-b ${hasIssue ? 'bg-rose-50 hover:bg-rose-100' : 'hover:bg-slate-50'}`}>
                                              <td className="p-4 font-bold flex items-center gap-2">
                                                 {h.id}
                                                 {hasIssue && <div className="text-rose-600 animate-pulse" title="Ada Laporan Aktif"><AlertTriangle size={16} fill="currentColor" className="text-rose-200"/></div>}
                                              </td>
                                              <td className="p-4">
                                                {h.headOfFamily}
                                                {h.residenceType === 'Kontrak' && <span className="ml-2 text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold">Kontrak</span>}
                                              </td>
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
                          <Button onClick={() => { resetForms(); setModalType('inventory'); setIsModalOpen(true); }} className="text-xs h-9"><Plus size={16}/> Tambah</Button>
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
                  <div className="flex justify-end"><Button onClick={() => { resetForms(); setModalType('announcement'); setIsModalOpen(true); }}><Plus size={18}/> Buat</Button></div>
                  <div className="grid gap-4">{announcements.map(ann => (
                    <div key={ann.id} className="bg-white p-6 rounded-2xl border flex justify-between group">
                        <div><h3 className="font-bold">{ann.title}</h3><p className="text-sm text-slate-600">{ann.content}</p></div>
                        <div className="flex gap-2">
                            <button onClick={() => openEditAnnouncement(ann)} className="text-slate-400 hover:text-blue-500 p-2"><Edit2 size={16}/></button>
                            <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-rose-400 hover:text-rose-600 p-2"><Trash2 size={16}/></button>
                        </div>
                    </div>
                  ))}</div>
              </div>
          )}
          {activeTab === 'finance' && (
               <div className="animate-fade-in space-y-6">
                  <div className="flex flex-col md:flex-row justify-end gap-2">
                    <Button onClick={handlePrintFinance} variant="outline" className="w-full md:w-auto"><Printer size={18}/> Laporan PDF</Button>
                    <Button onClick={() => { resetForms(); setModalType('dues'); setIsModalOpen(true); }} className="bg-slate-800 text-white w-full md:w-auto"><Coins size={18}/> Catat Iuran</Button>
                    <Button onClick={() => { resetForms(); setModalType('cash'); setIsModalOpen(true); }} variant="success" className="w-full md:w-auto"><Plus size={18}/> Catat Transaksi</Button>
                  </div>
                  <div className="bg-white rounded-2xl border overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap"><thead className="bg-slate-50"><tr><th className="p-4">Tanggal</th><th className="p-4">Ket</th><th className="p-4 text-right">Jml</th><th className="p-4 text-center">Aksi</th></tr></thead><tbody>{cashFlow.map(cf=><tr key={cf.id} className="hover:bg-slate-50"><td className="p-4">{cf.date}</td><td className="p-4">{cf.description}</td><td className={`p-4 text-right font-bold ${cf.type==='Income'?'text-emerald-600':'text-rose-600'}`}>{cf.amount.toLocaleString()}</td><td className="p-4 text-center flex justify-center gap-2"><button onClick={()=>openEditTransaction(cf)} className="text-slate-400 hover:text-blue-500"><Edit2 size={16}/></button><button onClick={()=>handleDeleteTransaction(cf.id)} className="text-rose-400 hover:text-rose-600"><Trash2 size={16}/></button></td></tr>)}</tbody></table>
                  </div>
               </div>
          )}
          {activeTab === 'services' && (
              <div className="animate-fade-in space-y-6">
                  <div className="flex border-b overflow-x-auto"><button onClick={()=>setServiceTab('surat')} className={`px-6 py-3 border-b-2 whitespace-nowrap ${serviceTab==='surat'?'border-brand-blue':'border-transparent'}`}>Surat Pengantar</button><button onClick={()=>setServiceTab('laporan')} className={`px-6 py-3 border-b-2 whitespace-nowrap ${serviceTab==='laporan'?'border-brand-blue':'border-transparent'}`}>Laporan Warga</button></div>
                  {serviceTab==='surat' && <div className="bg-white rounded-2xl border divide-y">{letters.map(l=><div key={l.id} className="p-6 flex flex-col md:flex-row justify-between gap-4"><div><p className="font-bold">{l.applicantName}</p><p className="text-xs">{l.type}</p></div><div className="flex gap-2 flex-wrap">
                  <Button onClick={() => generateSuratPengantar(l, pdfConfig, false)} className="text-xs h-8 bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent px-2"><Printer size={14}/> Unduh Resmi</Button>
                  {l.status==='Pending'&&(<> <button onClick={()=>handleUpdateLetter(l.id,'Approved')} className="text-emerald-600 font-bold text-xs">Setuju</button><button onClick={()=>handleUpdateLetter(l.id,'Rejected')} className="text-rose-600 font-bold text-xs">Tolak</button></>)}<button onClick={()=>handleDeleteLetter(l.id)}><Trash2 size={16}/></button></div></div>)}</div>}
                  {serviceTab==='laporan' && <div className="bg-white rounded-2xl border divide-y">{reports.map(r=><div key={r.id} className="p-6 flex flex-col md:flex-row justify-between gap-4"><div><p className="text-sm">{r.description}</p><p className="text-xs text-slate-500">{r.reporterName}</p><p className="text-[10px] text-slate-400">Lokasi: {r.houseId || '-'}</p></div><div className="flex gap-2">{r.status==='Baru'&&<button onClick={()=>handleUpdateReport(r.id,'Diproses')} className="text-blue-600 font-bold text-xs">Proses</button>}<button onClick={()=>handleDeleteReport(r.id)}><Trash2 size={16}/></button></div></div>)}</div>}
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
              modalType === 'announcement' ? (annId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru') : 
              modalType === 'cash' ? (cashId ? 'Edit Transaksi' : 'Catat Transaksi Kas') : 
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
                 <Button type="submit" className="w-full">{annId ? 'Simpan Perubahan' : 'Terbitkan'}</Button>
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
                  <Button type="submit" className="w-full">{cashId ? 'Simpan Perubahan' : 'Simpan'}</Button>
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
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs font-bold uppercase mb-1 block">Status Iuran</label>
                          <select className="w-full p-2 border rounded-lg" value={editHouseForm.paymentStatus} onChange={e=>setEditHouseForm({...editHouseForm, paymentStatus: e.target.value})}><option value="Lunas">Lunas</option><option value="Belum Lunas">Belum Lunas</option><option value="Menunggak">Menunggak</option></select>
                      </div>
                      <div>
                          <label className="text-xs font-bold uppercase mb-1 block">Status Kepemilikan</label>
                          <select className="w-full p-2 border rounded-lg" value={editHouseForm.residenceType} onChange={e=>setEditHouseForm({...editHouseForm, residenceType: e.target.value as any})}><option value="Tetap">Warga Tetap</option><option value="Kontrak">Kontrak / Sewa</option></select>
                      </div>
                  </div>
                  
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
