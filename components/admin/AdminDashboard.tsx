import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { 
  addPopulationReportToDb, 
  updatePopulationReportToDb, 
  deletePopulationReportFromDb, 
  markPopulationLogsAsGenerated,
  unmarkPopulationLogsAsGenerated,
  subscribeToActivePanicAlerts, 
  deleteNotificationFromDb, 
  deleteReportFromDb,
  handleFirestoreError,
  OperationType
} from '../../services/databaseService';
import { 
  House, Announcement, News, CashFlow, Official, Report, LetterRequest, 
  RondaSchedule, InventoryItem, UMKM, Bill, RondaCheckLog, PdfConfig, GalleryItem, AppNotification, Document, PopulationReport, PopulationChangeLog, AppEvent, RondaSwapRequest, MapPoint, PatrolSession, ResidentRegistration, FAQItem, PanicAlert, UpdateRequest, RondaAttendance, Role
} from '../../types';
import { AdminSidebar } from './Sidebar';
import { useConfirm } from '../../context/ConfirmContext';

const DashboardOverview = React.lazy(() => import('./DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const ResidentManager = React.lazy(() => import('./ResidentManager').then(m => ({ default: m.ResidentManager })));
const FinanceManager = React.lazy(() => import('./FinanceManager').then(m => ({ default: m.FinanceManager })));
const ContentManager = React.lazy(() => import('./ContentManager').then(m => ({ default: m.ContentManager })));
const FacilityManager = React.lazy(() => import('./FacilityManager').then(m => ({ default: m.FacilityManager })));
const ServiceManager = React.lazy(() => import('./ServiceManager').then(m => ({ default: m.ServiceManager })));
const AdminSettings = React.lazy(() => import('./AdminSettings').then(m => ({ default: m.AdminSettings })));
const DocumentManager = React.lazy(() => import('./DocumentManager').then(m => ({ default: m.DocumentManager })));
const AssetManager = React.lazy(() => import('./AssetManager').then(m => ({ default: m.AssetManager })));
const ActivityManagement = React.lazy(() => import('./ActivityManagement').then(m => ({ default: m.ActivityManagement })));
const AuditLogManager = React.lazy(() => import('./AuditLogManager').then(m => ({ default: m.AuditLogManager })));
const NotificationCombined = React.lazy(() => import('./NotificationCombined').then(m => ({ default: m.NotificationCombined })));
const AdminAnalytics = React.lazy(() => import('./AdminAnalytics').then(m => ({ default: m.AdminAnalytics })));
const IncomingMailManager = React.lazy(() => import('./IncomingMailManager').then(m => ({ default: m.IncomingMailManager })));
const PanicAlertLogs = React.lazy(() => import('./PanicAlertLogs').then(m => ({ default: m.PanicAlertLogs })));
const CommunityWorkManager = React.lazy(() => import('./CommunityWorkManager').then(m => ({ default: m.CommunityWorkManager })));
const ReportManager = React.lazy(() => import('./ReportManager').then(m => ({ default: m.ReportManager })));
const WaterMeterManager = React.lazy(() => import('./WaterMeterManager').then(m => ({ default: m.WaterMeterManager })));
const MeetingMinutesManager = React.lazy(() => import('./MeetingMinutesManager').then(m => ({ default: m.MeetingMinutesManager })));
const RentalManager = React.lazy(() => import('./RentalManager').then(m => ({ default: m.RentalManager })));
const STBMManager = React.lazy(() => import('./STBMManager').then(m => ({ default: m.STBMManager })));

import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Search, User, Menu, LogOut, Shield, Plus, Edit2, Trash2, Calendar, ShieldCheck, AlertTriangle,
  LayoutDashboard, BarChart3, Users, Activity, ShieldAlert, DollarSign, FileText, Megaphone, Box, Briefcase, Settings, LayoutGrid, BookOpen, Building, CheckSquare, Clock, Sparkles, Command, Sun, CloudRain, Wind, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { CHECKPOINTS, RT_NAME, Logo } from '../../constants';
import { toast } from 'sonner';
import { useWeather } from '../../hooks/useWeather';

interface AdminDashboardProps {
  role: Role;
  houses: House[];
  announcements: Announcement[];
  news: News[];
  cashFlow: CashFlow[];
  officials: Official[];
  reports: Report[];
  letters: LetterRequest[];
  ronda: RondaSchedule[];
  inventory: InventoryItem[];
  umkm: UMKM[];
  bills: Bill[];
  rondaLogs: RondaCheckLog[];
  rondaSwapRequests: RondaSwapRequest[];
  gallery: GalleryItem[];
  pdfConfig: PdfConfig;
  setPdfConfig: (config: PdfConfig) => void;
  notifications: AppNotification[];
  documents: Document[];
  populationReports: PopulationReport[];
  setPopulationReports: (reports: PopulationReport[]) => void;
  populationLogs: PopulationChangeLog[];
  setPopulationLogs: (logs: PopulationChangeLog[]) => void;
  events: AppEvent[];
  mapPoints: MapPoint[];
  activePatrol: PatrolSession | null;
  iuranPayments: any[];
  residentRegistrations: ResidentRegistration[];
  rondaAttendance: RondaAttendance[];
  guestReports: any[];
  inventoryLogs: any[];
  auditLogs: any[];
  faqItems: FAQItem[];
  updateRequests: UpdateRequest[];
  incomingMails?: any[];
  settings: any;
  onUpdateSettings: (settings: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  role,
  houses, announcements, news, cashFlow, officials, reports, letters, 
  ronda, rondaAttendance, inventory, umkm, bills, rondaLogs, rondaSwapRequests, gallery, pdfConfig, setPdfConfig, notifications, documents, populationReports, setPopulationReports, populationLogs, setPopulationLogs, events, mapPoints, activePatrol, iuranPayments, residentRegistrations, guestReports, inventoryLogs, auditLogs, faqItems, updateRequests, incomingMails = [], settings, onUpdateSettings
}) => {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('overview');
  const [contentSubTab, setContentSubTab] = useState<'announcements' | 'news' | 'umkm' | 'gallery' | 'events' | 'faq' | 'outages'>('announcements');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePanicAlerts, setActivePanicAlerts] = useState<PanicAlert[]>([]);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const { weather } = useWeather();
  const navigate = useNavigate();

  // Real-time clock for WITA (GMT+8)
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut for Spotlight (Ctrl+K / ⌘K and Esc to close)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItemsList = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard', desc: 'Ringkasan & status RT terbaru', color: 'bg-indigo-50 text-indigo-600 border-indigo-100/60 hover:bg-indigo-100/50' },
    { id: 'analytics', icon: BarChart3, label: 'Pusat Analitik', desc: 'Statistik & demografi kependudukan', color: 'bg-blue-50 text-blue-600 border-blue-100/60 hover:bg-blue-100/50' },
    { id: 'residents', icon: Users, label: 'Data Warga', desc: 'Database KK & data penduduk', color: 'bg-emerald-50 text-emerald-600 border-emerald-100/60 hover:bg-emerald-100/50' },
    { id: 'rentals', icon: Building, label: 'Rumah Sewa & Kontrakan', desc: 'Buku registrasi & monitoring hunian sewa RT', color: 'bg-teal-50 text-teal-700 border-teal-100/60 hover:bg-teal-100/50' },
    { id: 'health', icon: Activity, label: 'Posyandu Digital', desc: 'Pemantauan kesehatan & lansia', color: 'bg-teal-50 text-teal-600 border-teal-100/60 hover:bg-teal-100/50' },
    { id: 'stbm', icon: CheckSquare, label: '5 Pilar STBM', desc: 'Pendataan sanitasi total berbasis masyarakat RT', color: 'bg-emerald-50 text-emerald-700 border-emerald-100/60 hover:bg-emerald-100/50' },
    { id: 'finance', icon: DollarSign, label: 'Kas & Keuangan', desc: 'Pengelolaan keuangan & iuran warga', color: 'bg-indigo-50 text-indigo-600 border-indigo-100/60 hover:bg-indigo-100/50' },
    { id: 'services', icon: FileText, label: 'Pusat Persuratan', desc: 'Surat pengantar warga, surat resmi RT, & surat masuk', color: 'bg-violet-50 text-violet-600 border-violet-100/60 hover:bg-violet-100/50' },
    { id: 'meeting-minutes', icon: BookOpen, label: 'Notula Musyawarah', desc: 'Buku notula & kesepakatan rapat warga', color: 'bg-amber-50 text-amber-700 border-amber-100/60 hover:bg-amber-100/50' },
    { id: 'reports-warga', icon: AlertTriangle, label: 'Pusat Pelaporan & Tamu', desc: 'Aspirasi, pengaduan warga, & log wajib lapor tamu', color: 'bg-rose-50 text-rose-600 border-rose-100/60 hover:bg-rose-100/50' },
    { id: 'documents', icon: FileText, label: 'Arsip Dokumen', desc: 'Penyimpanan regulasi & AD/ART', color: 'bg-purple-50 text-purple-600 border-purple-100/60 hover:bg-purple-100/50' },
    { id: 'facilities', icon: Shield, label: 'Keamanan & Ronda', desc: 'Jadwal ronda & alarm darurat', color: 'bg-rose-50 text-rose-600 border-rose-100/60 hover:bg-rose-100/50' },
    { id: 'content', icon: Megaphone, label: 'Pusat Informasi', desc: 'Pengumuman, berita, & info UMKM', color: 'bg-sky-50 text-sky-600 border-sky-100/60 hover:bg-sky-100/50' },
    { id: 'activities', icon: Calendar, label: 'Agenda & Presensi', desc: 'Kegiatan gotong royong & rapat', color: 'bg-orange-50 text-orange-600 border-orange-100/60 hover:bg-orange-100/50' },
    { id: 'assets', icon: Box, label: 'Aset & Inventaris', desc: 'Peminjaman alat & status inventaris', color: 'bg-cyan-50 text-cyan-600 border-cyan-100/60 hover:bg-cyan-100/50' },
    { id: 'officials', icon: Briefcase, label: 'Pengurus RT', desc: 'Struktur kepengurusan aktif', color: 'bg-pink-50 text-pink-600 border-pink-100/60 hover:bg-pink-100/50' },
    { id: 'notifications', icon: Bell, label: 'Notifikasi', desc: 'Kirim notifikasi broadcast', color: 'bg-indigo-50 text-indigo-600 border-indigo-100/60 hover:bg-indigo-100/50' },
    { id: 'audit', icon: Activity, label: 'Log Aktivitas', desc: 'Audit aksi & transaksi sistem', color: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' },
    { id: 'settings', icon: Settings, label: 'Pengaturan', desc: 'Konfigurasi sistem & besaran iuran', color: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' },
  ];

  const allowedItems = navItemsList.filter(item => {
    if (role === Role.ADMIN) return true;
    
    if (role === Role.TREASURER) {
      const allowed = ['overview', 'analytics', 'finance', 'settings', 'notifications'];
      return allowed.includes(item.id);
    }
    
    if (role === Role.SECRETARY) {
      const allowed = [
        'overview', 'analytics', 'residents', 'rentals',
        'health', 'stbm', 'officials', 'services', 'meeting-minutes', 'reports-warga', 'documents', 'activities', 
        'assets', 'content', 'audit', 'notifications', 'settings'
      ];
      return allowed.includes(item.id);
    }
    
    return false;
  });

  const bottomNavItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Beranda' },
    { id: 'residents', icon: Users, label: 'Warga' },
    { id: 'finance', icon: DollarSign, label: 'Keuangan' },
    { id: 'services', icon: FileText, label: 'Surat' },
  ].filter(item => {
    if (item.id === 'overview') return true;
    
    if (role === Role.ADMIN) return true;
    
    if (role === Role.TREASURER) {
      return ['finance'].includes(item.id);
    }
    
    if (role === Role.SECRETARY) {
      return ['residents', 'services'].includes(item.id);
    }
    
    return false;
  });

  React.useEffect(() => {
    const unsubscribe = subscribeToActivePanicAlerts((data) => {
      setActivePanicAlerts(data as PanicAlert[]);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <DashboardOverview 
            houses={houses} 
            cashFlow={cashFlow} 
            reports={reports} 
            announcements={announcements} 
            guestReports={guestReports} 
            iuranPayments={iuranPayments} 
            residentRegistrations={residentRegistrations}
            letters={letters}
            updateRequests={updateRequests}
            onTabChange={(tab, subTab) => {
              setActiveTab(tab);
              if (subTab) {
                setContentSubTab(subTab as any);
              }
            }} 
          />
        );
      case 'residents':
      case 'health':
      case 'guests':
      case 'officials':
        return (
          <ResidentManager 
            role={role} 
            houses={houses} 
            reports={reports} 
            cashFlow={cashFlow} 
            officials={officials} 
            pdfConfig={pdfConfig} 
            iuranPayments={iuranPayments} 
            bills={bills} 
            residentRegistrations={residentRegistrations} 
            guestReports={guestReports} 
            settings={settings}
            populationReports={populationReports}
            setPopulationReports={setPopulationReports}
            populationLogs={populationLogs}
            setPopulationLogs={setPopulationLogs}
            updateRequests={updateRequests}
            initialViewMode={activeTab as any}
          />
        );
      case 'finance':
      case 'waste-bank':
        return (
          <FinanceManager 
            cashFlow={cashFlow} 
            pdfConfig={pdfConfig} 
            houses={houses} 
            iuranPayments={iuranPayments} 
            initialSubTab={activeTab === 'waste-bank' ? 'wastebank' : 'cashflow'}
          />
        );
      case 'water-meter':
        return <WaterMeterManager houses={houses} />;
      case 'services':
      case 'official-letters':
      case 'incoming_mails':
        return (
          <ServiceManager 
            letters={letters} 
            reports={reports} 
            houses={houses}
            pdfConfig={pdfConfig} 
            setPdfConfig={setPdfConfig} 
            incomingMails={incomingMails}
            initialTab={activeTab === 'official-letters' ? 'official-letters' : activeTab === 'incoming_mails' ? 'incoming_mails' : 'letters'}
            onDeleteReport={async (id) => {
              const isConfirmed = await confirm({
                title: 'Hapus Laporan',
                message: 'Apakah Anda yakin ingin menghapus laporan warga ini?',
                confirmLabel: 'Hapus',
                isDanger: true
              });

              if (isConfirmed) {
                try {
                  await deleteReportFromDb(id);
                  toast.success('Laporan berhasil dihapus.');
                } catch (error) {
                  handleFirestoreError(error, OperationType.DELETE, `reports/${id}`);
                }
              }
            }}
          />
        );
      case 'reports-warga':
        return (
          <ServiceManager 
            letters={letters} 
            reports={reports} 
            houses={houses}
            pdfConfig={pdfConfig} 
            setPdfConfig={setPdfConfig} 
            initialTab="reports"
            onDeleteReport={async (id) => {
              const isConfirmed = await confirm({
                title: 'Hapus Laporan',
                message: 'Apakah Anda yakin ingin menghapus laporan warga ini?',
                confirmLabel: 'Hapus',
                isDanger: true
              });

              if (isConfirmed) {
                try {
                  await deleteReportFromDb(id);
                  toast.success('Laporan berhasil dihapus.');
                } catch (error) {
                  handleFirestoreError(error, OperationType.DELETE, `reports/${id}`);
                }
              }
            }}
          />
        );
      case 'facilities':
        return <FacilityManager ronda={ronda} rondaLogs={rondaLogs} rondaAttendance={rondaAttendance} rondaSwapRequests={rondaSwapRequests} houses={houses} activePatrol={activePatrol} reports={reports} officials={officials} mapPoints={mapPoints} activePanicAlerts={activePanicAlerts} />;
      case 'reports-lpj':
      case 'laporan-kegiatan':
      case 'lpj-tahunan':
        return (
          <ReportManager 
            houses={houses} 
            pdfConfig={pdfConfig} 
            cashFlow={cashFlow} 
            populationReports={populationReports} 
            populationLogs={populationLogs}
            events={events}
            inventory={inventory} 
            iuranPayments={iuranPayments}
            initialSubTab={activeTab === 'lpj-tahunan' ? 'annual' : 'monthly'}
          />
        );
      case 'kerja-bakti':
        return <CommunityWorkManager houses={houses} />;
      case 'panic-logs':
        return <PanicAlertLogs houses={houses} />;
      case 'assets':
        return <AssetManager inventory={inventory} inventoryLogs={inventoryLogs} />;
      case 'audit':
        return <AuditLogManager logs={auditLogs} />;
      case 'content':
        return (
          <ContentManager 
            announcements={announcements} 
            news={news} 
            umkm={umkm} 
            gallery={gallery} 
            events={events} 
            faqItems={faqItems} 
            houses={houses} 
            pdfConfig={pdfConfig} 
            initialTab={contentSubTab} 
          />
        );
      case 'notifications':
        return (
          <NotificationCombined 
            notifications={notifications} 
            houses={houses}
            bills={bills}
            pdfConfig={pdfConfig}
            onDeleteNotification={async (id) => {
              const isConfirmed = await confirm({
                title: 'Hapus Notifikasi',
                message: 'Apakah Anda yakin ingin menghapus notifikasi ini?',
                confirmLabel: 'Hapus',
                isDanger: true
              });

              if (isConfirmed) {
                try {
                  await deleteNotificationFromDb(id);
                } catch (error) {
                  handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
                }
              }
            }}
          />
        );
      case 'documents':
        return <DocumentManager documents={documents} />;
      case 'rentals':
        return <RentalManager houses={houses} />;
      case 'stbm':
        return <STBMManager houses={houses} />;
      case 'meeting-minutes':
        return <MeetingMinutesManager />;
      case 'activities':
        return <ActivityManagement houses={houses} />;
      case 'settings':
        return (
          <AdminSettings 
            houses={houses}
            announcements={announcements}
            cashFlow={cashFlow}
            officials={officials}
            reports={reports}
            letters={letters}
            ronda={ronda}
            inventory={inventory}
            umkm={umkm}
            rondaLogs={rondaLogs}
            notifications={notifications}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
          />
        );
      case 'analytics':
        return (
          <AdminAnalytics 
            rondaLogs={rondaLogs}
            reports={reports}
            houses={houses}
            officials={officials}
            letters={letters}
            pdfConfig={pdfConfig}
          />
        );
      default:
        return (
          <DashboardOverview 
            houses={houses} 
            cashFlow={cashFlow} 
            reports={reports} 
            announcements={announcements} 
            guestReports={guestReports} 
            iuranPayments={iuranPayments} 
            residentRegistrations={residentRegistrations}
            letters={letters}
            updateRequests={updateRequests}
            onTabChange={(tab, subTab) => {
              setActiveTab(tab);
              if (subTab) {
                setContentSubTab(subTab as any);
              }
            }} 
          />
        );
    }
  };

  return (
    <div className="h-screen h-[100dvh] bg-[#F8FAFC] font-sans text-slate-600 flex overflow-hidden">
      <AdminSidebar 
        role={role}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        onLogout={handleLogout}
        residentRegistrations={residentRegistrations}
        guestReports={guestReports}
        updateRequests={updateRequests}
        rondaSwapRequests={rondaSwapRequests}
        letters={letters}
        reports={reports}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Executive Command Center Top Bar */}
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3 md:gap-5">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden p-2 hover:bg-slate-100 rounded-2xl transition-colors text-slate-600"
              aria-label="Buka Menu Navigasi"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-3">
              <Logo showText={true} imageSize="h-8 md:h-10" className="hidden sm:flex" />
              <div className="h-6 w-px bg-slate-200/80 hidden sm:block"></div>
              {(() => {
                const currentNavItem = navItemsList.find(item => item.id === activeTab);
                const CurrentIcon = currentNavItem?.icon || LayoutGrid;
                
                return (
                  <>
                    <div className="hidden sm:flex items-center gap-2.5 text-xs md:text-sm font-black text-slate-400">
                      <span className="text-slate-500 font-extrabold">Executive Command</span>
                      <span className="text-slate-300 font-normal">/</span>
                      <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/70 px-3 py-1.5 rounded-2xl text-xs font-black text-slate-800 shadow-xs">
                        <CurrentIcon size={13} className="text-indigo-600 stroke-[2.5px] shrink-0" />
                        <span>{currentNavItem?.label || activeTab.replace('-', ' ')}</span>
                      </div>
                    </div>
                    
                    <div className="sm:hidden flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/70 px-2.5 py-1 rounded-xl text-[11px] font-black text-slate-800 shadow-xs truncate max-w-[130px]">
                      <CurrentIcon size={12} className="text-indigo-600 stroke-[2.5px] shrink-0" />
                      <span className="truncate">{currentNavItem?.label || activeTab.replace('-', ' ')}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Center / Right Operational Capsule & Controls */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Live Operational Capsule: WITA Real-Time Clock */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100/70 hover:bg-slate-100/90 border border-slate-200/70 rounded-2xl text-xs font-bold text-slate-700 shadow-2xs transition-all select-none">
              <Clock size={13} className="text-indigo-600 stroke-[2.5px]" />
              <span className="font-mono tracking-tight text-slate-800 font-extrabold text-[11px]">
                {currentTime.toLocaleTimeString('id-ID', { timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[9px] uppercase font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">WITA</span>
            </div>

            {/* Live Operational Capsule: Palu City Weather & ISPU KLHK */}
            {weather && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-sky-50/70 hover:bg-sky-50 border border-sky-100/80 rounded-2xl text-xs font-bold text-sky-900 shadow-2xs transition-all select-none">
                <Sun size={13} className="text-amber-500 stroke-[2.5px]" />
                <span className="font-extrabold text-[11px]">{weather.temp}°C</span>
                <span className="text-sky-200">•</span>
                <span className="text-[10px] text-sky-800 flex items-center gap-1 font-bold">
                  ISPU <span className="font-black text-emerald-600">{weather.aqi}</span>
                </span>
              </div>
            )}

            {/* Active Panic Alert Badge */}
            {activePanicAlerts.length > 0 && (
              <button 
                onClick={() => setActiveTab('facilities')}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 border border-rose-500 rounded-2xl px-3.5 py-1.5 cursor-pointer animate-pulse shadow-lg shadow-rose-200 text-white transition-colors"
                title="Ada panggilan darurat aktif!"
              >
                <AlertTriangle size={17} />
                <div className="hidden sm:block text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-0.5 text-rose-100">SOS AKTIF</p>
                  <p className="text-[11px] font-extrabold leading-none">{activePanicAlerts.length} Laporan</p>
                </div>
              </button>
            )}

            {/* Active Patrol Badge */}
            {activePatrol && (
              <div className="hidden xl:flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl px-3.5 py-1.5 shadow-2xs">
                <div className="relative">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-0.5">Siskamling</p>
                  <p className="text-[11px] font-black text-slate-700 leading-none">{activePatrol.officerName} • {Math.round((activePatrol.visitedCheckpoints.length / CHECKPOINTS.length) * 100)}%</p>
                </div>
              </div>
            )}

            {/* Spotlight Command Palette Launcher Button */}
            <button
              onClick={() => setIsSpotlightOpen(true)}
              className="hidden sm:flex items-center gap-2.5 bg-slate-100/70 hover:bg-slate-100 border border-slate-200/70 rounded-2xl px-3.5 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold shadow-2xs transition-all group"
              title="Buka Command Palette (Ctrl+K atau ⌘K)"
            >
              <Search size={14} className="group-hover:text-indigo-600 transition-colors stroke-[2.2px]" />
              <span className="text-slate-500 font-medium">Cari modul atau aksi...</span>
              <kbd className="ml-1.5 flex items-center gap-0.5 bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-lg text-[10px] font-black shadow-2xs group-hover:border-indigo-200 group-hover:text-indigo-600">
                <Command size={10} /> K
              </kbd>
            </button>

            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSpotlightOpen(true)}
              className="sm:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-2xl transition-colors"
              title="Cari Cepat (Ctrl+K)"
              aria-label="Cari Cepat"
            >
              <Search size={18} />
            </button>
            
            {/* Notification & User Profile */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`p-2 md:p-2.5 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all relative ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-600' : ''}`}
                title="Lihat Notifikasi"
                aria-label="Notifikasi"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
                )}
              </button>
              
              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
              
              <div className="flex items-center gap-2.5 pl-1">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-black text-slate-900 leading-tight">Admin {RT_NAME}</p>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mt-0.5">{role}</p>
                </div>
                <div className="relative group">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/20 ring-offset-2 ring-offset-white">
                    <User size={17} />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-32 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <React.Suspense fallback={
                  <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 font-sans">
                    <div className="relative flex items-center justify-center mb-4">
                      <div className="w-14 h-14 border-3 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                      <div className="absolute text-indigo-600 animate-pulse text-[10px] font-black">RT02</div>
                    </div>
                    <h3 className="text-slate-800 font-black text-xs tracking-widest uppercase">Memuat Modul</h3>
                    <p className="text-slate-400 text-[10px] mt-1 font-bold">Mengoptimalkan data operasional...</p>
                  </div>
                }>
                  {renderContent()}
                </React.Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile bottom navigation bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/60 z-40 pb-[env(safe-area-inset-bottom,16px)] shadow-[0_-8px_30px_rgb(0,0,0,0.06)]">
          <div className="flex justify-around items-center h-16 px-2">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button 
                  key={item.id} 
                  onClick={() => setActiveTab(item.id)} 
                  className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all ${isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-50/70' : ''}`}>
                    <Icon size={18} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                  </div>
                  <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Spotlight Command Palette Modal (Ctrl+K / ⌘K) */}
        <AnimatePresence>
          {isSpotlightOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4">
              {/* Dimmed backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsSpotlightOpen(false);
                  setSpotlightQuery('');
                }}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
              />

              {/* Spotlight Dialog */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -16 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] overflow-hidden z-10 flex flex-col font-sans"
              >
                {/* Search Input Bar */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <Search size={20} className="text-indigo-600 stroke-[2.5px] shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={spotlightQuery}
                    onChange={(e) => setSpotlightQuery(e.target.value)}
                    placeholder="Ketik nama modul, perintah, atau aksi..."
                    className="w-full bg-transparent text-sm md:text-base font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                  {spotlightQuery ? (
                    <button
                      onClick={() => setSpotlightQuery('')}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : (
                    <kbd className="text-[10px] font-black uppercase text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-2xs">
                      ESC
                    </kbd>
                  )}
                </div>

                {/* Results Section */}
                <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 custom-scrollbar">
                  {/* Modul Navigasi */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                      Modul Sistem ({allowedItems.filter(item => 
                        item.label.toLowerCase().includes(spotlightQuery.toLowerCase()) || 
                        item.desc.toLowerCase().includes(spotlightQuery.toLowerCase())
                      ).length})
                    </p>
                    <div className="space-y-1">
                      {allowedItems
                        .filter(item => 
                          item.label.toLowerCase().includes(spotlightQuery.toLowerCase()) || 
                          item.desc.toLowerCase().includes(spotlightQuery.toLowerCase())
                        )
                        .slice(0, 8)
                        .map(item => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setActiveTab(item.id);
                                setIsSpotlightOpen(false);
                                setSpotlightQuery('');
                              }}
                              className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                                isActive 
                                  ? 'bg-indigo-50/90 text-indigo-900 font-bold border border-indigo-100' 
                                  : 'hover:bg-slate-100/70 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl border ${item.color || 'bg-slate-100 text-slate-600'}`}>
                                  <Icon size={16} className="stroke-[2.2px]" />
                                </div>
                                <div>
                                  <p className="text-xs md:text-sm font-black text-slate-800">{item.label}</p>
                                  <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{item.desc}</p>
                                </div>
                              </div>
                              <CornerDownLeft size={14} className="text-slate-300 shrink-0" />
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Quick Shortcuts / Fast Actions */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                      Pintasan Eksekutif
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {[
                        { label: 'Data Warga & Mutasi KK', tab: 'residents', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
                        { label: 'Pencatatan Kas & Iuran RT', tab: 'finance', icon: DollarSign, color: 'text-indigo-600 bg-indigo-50' },
                        { label: 'Pusat Persuratan & Pengantar', tab: 'services', icon: FileText, color: 'text-violet-600 bg-violet-50' },
                        { label: 'Evaluasi Sanitasi 5 Pilar STBM', tab: 'stbm', icon: CheckSquare, color: 'text-teal-600 bg-teal-50' },
                        { label: 'Log Aduan Warga & Tamu Wajib', tab: 'reports-warga', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
                        { label: 'Jadwal Ronda & Keamanan', tab: 'facilities', icon: Shield, color: 'text-amber-600 bg-amber-50' },
                      ].map((action, idx) => {
                        const ActionIcon = action.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setActiveTab(action.tab);
                              setIsSpotlightOpen(false);
                              setSpotlightQuery('');
                            }}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100/70 border border-transparent hover:border-slate-200/60 text-left transition-all group"
                          >
                            <div className={`p-1.5 rounded-lg ${action.color}`}>
                              <ActionIcon size={14} className="stroke-[2.2px]" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-1">
                              {action.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Tips */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-black text-slate-500">↑↓</kbd>
                      Navigasi
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-black text-slate-500">↵</kbd>
                      Pilih
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Pusat Komando RT 02 / RW 020 Huntap Tondo 2</span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
