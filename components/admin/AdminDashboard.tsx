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
  RondaSchedule, InventoryItem, UMKM, Poll, Bill, RondaCheckLog, PdfConfig, GalleryItem, AppNotification, Document, PopulationReport, PopulationChangeLog, AppEvent, RondaSwapRequest, MapPoint, PatrolSession, ResidentRegistration, FAQItem, MarketItem, PanicAlert, UpdateRequest, RondaAttendance, Role
} from '../../types';
import { AdminSidebar } from './Sidebar';
import { DashboardOverview } from './DashboardOverview';
import { useConfirm } from '../../context/ConfirmContext';
import { ResidentManager } from './ResidentManager';
import { FinanceManager } from './FinanceManager';
import { ContentManager } from './ContentManager';
import { FacilityManager } from './FacilityManager';
import { ServiceManager } from './ServiceManager';
import { AdminSettings } from './AdminSettings';
import { DocumentManager } from './DocumentManager';
import { EventManager } from './EventManager';
import { AssetManager } from './AssetManager';
import { ActivityManagement } from './ActivityManagement';
import { AuditLogManager } from './AuditLogManager';
import { NotificationCombined } from './NotificationCombined';
import { AdminAnalytics } from './AdminAnalytics';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Search, User, Menu, LogOut, Shield, Plus, Edit2, Trash2, Calendar, ShieldCheck, AlertTriangle,
  LayoutDashboard, BarChart3, Users, Activity, ShieldAlert, DollarSign, FileText, Megaphone, Box, Briefcase, Settings, LayoutGrid
} from 'lucide-react';
import { CHECKPOINTS, RT_NAME, Logo } from '../../constants';
import { toast } from 'sonner';

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
  polls: Poll[];
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
  marketItems: MarketItem[];
  faqItems: FAQItem[];
  updateRequests: UpdateRequest[];
  settings: any;
  onUpdateSettings: (settings: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  role,
  houses, announcements, news, cashFlow, officials, reports, letters, 
  ronda, rondaAttendance, inventory, umkm, polls, bills, rondaLogs, rondaSwapRequests, gallery, pdfConfig, setPdfConfig, notifications, documents, populationReports, setPopulationReports, populationLogs, setPopulationLogs, events, mapPoints, activePatrol, iuranPayments, residentRegistrations, guestReports, inventoryLogs, auditLogs, marketItems, faqItems, updateRequests, settings, onUpdateSettings
}) => {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('overview');
  const [contentSubTab, setContentSubTab] = useState<'announcements' | 'news' | 'polls' | 'umkm' | 'gallery' | 'events' | 'faq'>('announcements');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePanicAlerts, setActivePanicAlerts] = useState<PanicAlert[]>([]);
  const navigate = useNavigate();

  const navItemsList = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard', desc: 'Ringkasan & status RT terbaru', color: 'bg-indigo-50 text-indigo-600 border-indigo-100/60 hover:bg-indigo-100/50' },
    { id: 'analytics', icon: BarChart3, label: 'Pusat Analitik', desc: 'Statistik & demografi kependudukan', color: 'bg-blue-50 text-blue-600 border-blue-100/60 hover:bg-blue-100/50' },
    { id: 'residents', icon: Users, label: 'Data Warga', desc: 'Database KK & data penduduk', color: 'bg-emerald-50 text-emerald-600 border-emerald-100/60 hover:bg-emerald-100/50' },
    { id: 'health', icon: Activity, label: 'Posyandu Digital', desc: 'Pemantauan kesehatan & lansia', color: 'bg-teal-50 text-teal-600 border-teal-100/60 hover:bg-teal-100/50' },
    { id: 'guests', icon: ShieldAlert, label: 'Laporan Tamu', desc: 'Log tamu wajib lapor 24 jam', color: 'bg-amber-50 text-amber-600 border-amber-100/60 hover:bg-amber-100/50' },
    { id: 'finance', icon: DollarSign, label: 'Kas & Keuangan', desc: 'Pengelolaan keuangan & iuran warga', color: 'bg-indigo-50 text-indigo-600 border-indigo-100/60 hover:bg-indigo-100/50' },
    { id: 'services', icon: FileText, label: 'Surat & Pengaduan', desc: 'Pengajuan dokumen & keluhan warga', color: 'bg-violet-50 text-violet-600 border-violet-100/60 hover:bg-violet-100/50' },
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
        'overview', 'analytics', 'residents', 
        'health', 'guests', 'officials', 'services', 'documents', 'activities', 
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
      case 'services':
        return (
          <ServiceManager 
            letters={letters} 
            reports={reports} 
            houses={houses}
            pdfConfig={pdfConfig} 
            setPdfConfig={setPdfConfig} 
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
      case 'assets':
        return <AssetManager inventory={inventory} inventoryLogs={inventoryLogs} />;
      case 'audit':
        return <AuditLogManager logs={auditLogs} />;
      case 'content':
        return (
          <ContentManager 
            announcements={announcements} 
            news={news} 
            polls={polls} 
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
            polls={polls}
            rondaLogs={rondaLogs}
            marketItems={marketItems}
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
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Modern Top Bar */}
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 md:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-3">
              <Logo showText={true} imageSize="h-8 md:h-10" className="hidden sm:flex" />
              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
              <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-400">
                <span>Admin</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-800 capitalize truncate max-w-[100px] md:max-w-none">{activeTab.replace('-', ' ')}</span>
              </div>
            </div>
            
            <div className="sm:hidden font-black text-slate-800 text-sm truncate max-w-[120px]">
              {activeTab.replace('-', ' ')}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            {activePanicAlerts.length > 0 && (
              <div 
                onClick={() => setActiveTab('facilities')}
                className="flex items-center gap-3 bg-rose-600 border border-rose-500 rounded-2xl px-4 py-2 cursor-pointer animate-pulse shadow-lg shadow-rose-200"
              >
                <AlertTriangle size={20} className="text-white" />
                <div className="hidden sm:block">
                  <p className="text-[10px] font-black text-rose-100 uppercase tracking-widest leading-none mb-0.5">Darurat Aktif!</p>
                  <p className="text-xs font-bold text-white leading-none">{activePanicAlerts.length} Laporan</p>
                </div>
              </div>
            )}

            {activePatrol && (
              <div className="hidden xl:flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2">
                <div className="relative">
                  <ShieldCheck size={20} className="text-emerald-600" />
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-0.5">Patroli Aktif</p>
                  <p className="text-xs font-bold text-slate-700 leading-none">{activePatrol.officerName} • {Math.round((activePatrol.visitedCheckpoints.length / CHECKPOINTS.length) * 100)}%</p>
                </div>
              </div>
            )}

            <div className="hidden lg:flex items-center gap-2 bg-slate-100/50 border border-slate-200/60 rounded-2xl px-4 py-2 text-slate-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <Search size={18} />
              <input type="text" placeholder="Cari data..." className="bg-transparent border-none outline-none text-sm font-medium w-40 lg:w-64" />
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`p-2 md:p-2.5 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all relative ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-600' : ''}`}
                title="Lihat Notifikasi"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
                )}
              </button>
              
              <div className="h-8 w-[1px] bg-slate-200 mx-1 md:mx-2 hidden sm:block"></div>
              
              <div className="flex items-center gap-2 md:gap-3 pl-1 md:pl-2">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-bold text-slate-800 leading-none">Admin {RT_NAME}</p>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-1">{role}</p>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <User size={18} />
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile bottom navigation bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/60 z-40 pb-safe-area-pb">
          <div className="flex justify-around items-center h-16 px-2 shadow-inner">
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
      </div>
    </div>
  );
};
