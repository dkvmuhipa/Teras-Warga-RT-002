import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { 
  addPopulationReportToDb, 
  updatePopulationReportToDb, 
  deletePopulationReportFromDb, 
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
import { OfficialManagement } from './OfficialManagement';
import { DocumentManager } from './DocumentManager';
import { PopulationReportManager } from './PopulationReportManager';
import { EventManager } from './EventManager';
import { AssetManager } from './AssetManager';
import { GuestManager } from './GuestManager';
import { ActivityManagement } from './ActivityManagement';
import { WasteBankManager } from './WasteBankManager';
import { HealthManagement } from './HealthManagement';
import { UpdateRequestManager } from './UpdateRequestManager';
import { AuditLogManager } from './AuditLogManager';
import { NotificationCombined } from './NotificationCombined';
import { AdminAnalytics } from './AdminAnalytics';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Search, User, Menu, LogOut, Shield, Plus, Edit2, Trash2, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePanicAlerts, setActivePanicAlerts] = useState<PanicAlert[]>([]);
  const navigate = useNavigate();

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
        return <DashboardOverview houses={houses} cashFlow={cashFlow} reports={reports} announcements={announcements} guestReports={guestReports} iuranPayments={iuranPayments} onTabChange={setActiveTab} />;
      case 'residents':
        return <ResidentManager role={role} houses={houses} reports={reports} cashFlow={cashFlow} officials={officials} pdfConfig={pdfConfig} iuranPayments={iuranPayments} bills={bills} residentRegistrations={residentRegistrations} guestReports={guestReports} settings={settings} />;
      case 'update-requests':
        return <UpdateRequestManager requests={updateRequests} houses={houses} />;
      case 'finance':
        return <FinanceManager cashFlow={cashFlow} pdfConfig={pdfConfig} />;
      case 'services':
        return (
          <ServiceManager 
            letters={letters} 
            reports={reports} 
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
      case 'guests':
        return <GuestManager guestReports={guestReports} pdfConfig={pdfConfig} />;
      case 'audit':
        return <AuditLogManager logs={auditLogs} />;
      case 'content':
        return <ContentManager announcements={announcements} news={news} polls={polls} umkm={umkm} gallery={gallery} events={events} faqItems={faqItems} houses={houses} pdfConfig={pdfConfig} />;
      case 'officials':
        return <OfficialManagement officials={officials} houses={houses} />;
      case 'notifications':
        return (
          <NotificationCombined 
            notifications={notifications} 
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
      case 'waste-bank':
        return <WasteBankManager houses={houses} />;
      case 'health':
        return <HealthManagement houses={houses} />;
      case 'population-reports':
        return (
          <PopulationReportManager 
            reports={populationReports} 
            onAddReport={async (r) => {
              try {
                await addPopulationReportToDb({ ...r, createdAt: new Date().toISOString() });
              } catch (error) {
                handleFirestoreError(error, OperationType.CREATE, "populationReports");
              }
            }} 
            onUpdateReport={async (id, r) => {
              try {
                await updatePopulationReportToDb(id, r);
              } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, `populationReports/${id}`);
              }
            }}
            onDeleteReport={async (id) => {
              const isConfirmed = await confirm({
                title: 'Hapus Laporan',
                message: 'Apakah Anda yakin ingin menghapus laporan kependudukan ini?',
                confirmLabel: 'Hapus',
                isDanger: true
              });

              if (isConfirmed) {
                try {
                  await deletePopulationReportFromDb(id);
                } catch (error) {
                  handleFirestoreError(error, OperationType.DELETE, `populationReports/${id}`);
                }
              }
            }} 
            populationLogs={populationLogs} 
            setPopulationLogs={setPopulationLogs} 
            houses={houses} 
          />
        );
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
          />
        );
      default:
        return <DashboardOverview houses={houses} cashFlow={cashFlow} reports={reports} announcements={announcements} guestReports={guestReports} iuranPayments={iuranPayments} onTabChange={setActiveTab} />;
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
      </div>
    </div>
  );
};
