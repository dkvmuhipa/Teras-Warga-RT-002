
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Toaster } from 'sonner';
import { 
  Home, FileText, Megaphone, AlertTriangle, User, Users, Menu, X, 
  LayoutDashboard, Send, Bot, Trash2, Clock, CheckCircle, XCircle, Search, Edit2, Plus,
  Shield, Phone, Wallet, Moon, Sun, CloudRain, 
  LogOut, Download, Package, ShoppingBag,
  ArrowUpRight, ArrowDownRight, ShieldCheck, FileDown, Target, HelpCircle, Map as MapIcon,
  Briefcase, Store, Archive, History, BarChart3, Grid, List, Upload, Printer,
  RefreshCw, Calendar, DollarSign, Settings, Filter, Heart, Baby, Smile, GraduationCap, Accessibility, Key, MessageCircle, ImageIcon, AlertCircle, Wrench, ChevronRight,
  Database, Lock, Eye, EyeOff, Save, Trash, Sparkles, Loader2, CheckSquare, Bell, Vote, PieChart, LocateFixed, ShoppingCart, Wand2
} from 'lucide-react';
import { CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

// Destructure React Router DOM components
const { HashRouter, Routes, Route, useNavigate, useLocation, useSearchParams } = ReactRouterDOM;

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [pathname, hash]);

  return null;
};

// Components & Services
import { Logo, generateHouses, MOCK_ANNOUNCEMENTS, MOCK_UMKM, MOCK_RONDA, MOCK_CASHFLOW, MOCK_GALLERY, MOCK_FAQ, MOCK_DOCUMENTS, INITIAL_OFFICIALS, DEFAULT_PDF_CONFIG, MOCK_INVENTORY, INITIAL_REPORTS, MOCK_POLLS, MOCK_RONDA_LOGS, MOCK_BILLS, MOCK_EVENTS, CHECKPOINTS, MOCK_MAP_POINTS } from '@/constants';
import { House, Announcement, News, Report, LetterRequest, PaymentStatus, UMKM, CashFlow, Official, RondaSchedule, PdfConfig, InventoryItem, AppNotification, Poll, PollOption, RondaCheckLog, MarketItem, GalleryItem, FAQItem, Document, Bill, PopulationReport, PopulationChangeLog, RondaSwapRequest, AppEvent, MapPoint, PatrolSession, ResidentRegistration, Idea, DonationCampaign, UpdateRequest, RondaAttendance, Role, PbbRecord } from './types';
import { HouseMap } from './components/HouseMap';
import { SmartImage } from './components/SmartImage';
import { generateAnnouncementDraft, generateDashboardSummary } from './services/geminiService';
import { generateSuratPengantar, generateResidentReportPDF } from './services/pdfService';
import { sendWhatsAppMessage, formatAnnouncementForWhatsApp } from './services/whatsappService';
import { AdminRouteWrapper } from './components/AdminComponents';
import { AdminDashboard } from './components/admin/AdminDashboard'; 
import { DocumentManager } from './components/admin/DocumentManager';
import { FinancialProvider } from './context/FinancialContext';
import { ResidentRegistrationForm } from './components/ResidentRegistrationForm';
import { GuestReportForm } from './components/GuestReportForm';
import { ChatBot } from './components/ChatBot';
import { PublicHeader } from './components/PublicHeader';
import { HeroSection } from './components/HeroSection';
import { PublicHome } from './components/public/PublicHome';
import { PublicVoting } from './components/public/PublicVoting';
import { PublicMarket } from './components/public/PublicMarket';
import { PublicServices } from './components/public/PublicServices';
import { PublicVerification } from './components/public/PublicVerification';
import { PublicUMKM } from './components/public/PublicUMKM';
import { PublicInfo } from './components/public/PublicInfo';
import { PublicMap } from './components/public/PublicMap';
import { PublicResidentDashboard } from './components/public/PublicResidentDashboard';
import { PublicDocuments } from './components/public/PublicDocuments';
import { PublicActivity } from './components/public/PublicActivity';
import { PublicWasteBank } from './components/public/PublicWasteBank';
import { PublicHealth } from './components/public/PublicHealth';
import PublicForum from './components/public/PublicForum';
import PublicDonations from './components/public/PublicDonations';
import { NotificationCenter } from './components/NotificationCenter';
import { NotificationToast } from './components/NotificationToast';
import { PanicButton } from './components/PanicButton';
import { PushNotificationManager } from './components/PushNotificationManager';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Modal } from './components/ui/Modal';

// Firebase imports
import { auth, messaging, db } from './services/firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { subscribeToMapPoints, subscribeToCollection, 
  subscribeToNotifications,
  subscribeToGallery,
  subscribeToDocuments,
  subscribeToIdeas,
  subscribeToDonationCampaigns,
  subscribeToUpdateRequests,
  subscribeToWasteDeposits,
  subscribeToNews,
  subscribeToEvents,
  subscribeToPolls,
  subscribeToUMKM,
  subscribeToMarketItems,
  subscribeToPdfConfig,
  updatePdfConfig,
  subscribeToSettings,
  updateSettings,
  deepSanitize,
  safeJsonStringify,
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
  addRondaAttendance,
  getRondaAttendance,
  addUMKMToDb,
  updateUMKMInDb,
  deleteUMKMFromDb,
  batchUpdateHouses,
  logoutAdmin,
  seedDatabase,
  ensureMosqueExists,
  updateAdminPassword,
  addNotificationToDb,
  addPollToDb,
  deletePollFromDb,
  updatePollStatus,
  submitVote,
  saveFCMToken,
  getFCMTokens,
  addRondaLog,
  subscribeToRondaLogs,
  subscribeToRondaSwapRequests,
  validateResidentAccess,
  addMarketItem,
  deleteMarketItem,
  updateMarketItemStatus,
  subscribeToBills,
  addBillToDb,
  updateBillInDb,
  deleteBillFromDb,
  addNewsToDb,
  updateNewsInDb,
  deleteNewsFromDb,
  subscribeToPopulationLogs,
  subscribeToActivePatrols,
  subscribeToResidentRegistrations,
  subscribeToGuestReports,
  updateGuestReportStatus,
  deleteGuestReportFromDb,
  subscribeToAuditLogs,
  subscribeToFAQ,
  addFAQToDb,
  updateFAQInDb,
  deleteFAQFromDb,
  addEventToDb,
  updateEventInDb,
  deleteEventFromDb,
  markNotificationAsRead,
  deleteNotificationFromDb,
  deleteAllNotificationsFromDb,
  handleFirestoreError,
  OperationType
} from './services/databaseService';

// --- Shared Components ---
// Removed inline components in favor of imported ones from components/ui


// --- NOTIFICATION COMPONENTS ---
// Removed inline components in favor of imported ones


// Removed inline PublicHeader component


// Removed inline HeroSection component


// Removed inline PublicHome component


// Removed inline PublicVoting component


// Removed inline PublicMarket component


// Removed inline PublicServices component


// Removed inline PublicUMKM and PublicInfo components



// --- Admin Dashboard (RECONSTRUCTED) ---


export const App = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [ronda, setRonda] = useState<RondaSchedule[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [umkm, setUmkm] = useState<UMKM[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [rondaLogs, setRondaLogs] = useState<RondaCheckLog[]>([]);
  const [rondaAttendance, setRondaAttendance] = useState<RondaAttendance[]>([]);
  const [rondaSwapRequests, setRondaSwapRequests] = useState<RondaSwapRequest[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [populationReports, setPopulationReports] = useState<PopulationReport[]>([]);
  const [populationLogs, setPopulationLogs] = useState<PopulationChangeLog[]>([]);
  const [iuranPayments, setIuranPayments] = useState<any[]>([]);
  const [residentRegistrations, setResidentRegistrations] = useState<ResidentRegistration[]>([]);
  const [guestReports, setGuestReports] = useState<any[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activePatrol, setActivePatrol] = useState<PatrolSession | null>(null);
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);
  const [wasteDeposits, setWasteDeposits] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [donationCampaigns, setDonationCampaigns] = useState<DonationCampaign[]>([]);
  const [updateRequests, setUpdateRequests] = useState<UpdateRequest[]>([]);
  const [pbbRecords, setPbbRecords] = useState<PbbRecord[]>([]);
  const [settings, setSettings] = useState({ airFee: 10000, sampahFee: 5000 });

  useEffect(() => {
    const unsub = subscribeToSettings((data) => {
      if (data) setSettings(data);
    });
    return () => unsub();
  }, []);

  const handleUpdateSettings = async (newSettings: any) => {
    try {
      await updateSettings(newSettings);
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  const [pdfConfig, setPdfConfigState] = useState<PdfConfig>(() => { try { const saved = localStorage.getItem('pdf_config'); return saved ? JSON.parse(saved) : DEFAULT_PDF_CONFIG; } catch { return DEFAULT_PDF_CONFIG; } });

  const setPdfConfig = (newConfig: PdfConfig | ((prev: PdfConfig) => PdfConfig)) => {
    setPdfConfigState(prev => {
      const next = typeof newConfig === 'function' ? newConfig(prev) : newConfig;
      try {
        localStorage.setItem('pdf_config', safeJsonStringify(next));
      } catch (e) {
        console.warn("Failed to save PDF config to localStorage:", e);
      }
      return next;
    });
  };

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<Role | null>(null);

  useEffect(() => {
    const unsubHouses = subscribeToCollection('houses', (data) => setHouses(data));
    const unsubAnnouncements = subscribeToCollection('announcements', (data) => setAnnouncements(data));
    const unsubNews = subscribeToNews((data) => setNews(data));
    const unsubCash = subscribeToCollection('cashFlow', (data) => setCashFlow(data));
    const unsubOfficials = subscribeToCollection('officials', (data) => setOfficials(data));
    const unsubReports = subscribeToCollection('reports', (data) => setReports(data));
    const unsubLetters = subscribeToCollection('letters', (data) => setLetters(data));
    const unsubRonda = subscribeToCollection('ronda', (data) => setRonda(data));
    const unsubInventory = subscribeToCollection('inventory', (data) => setInventory(data));
    const unsubUmkm = subscribeToCollection('umkm', (data) => setUmkm(data));
    const unsubPolls = subscribeToCollection('polls', (data) => setPolls(data));
    const unsubBills = subscribeToCollection('bills', (data) => setBills(data));
    const unsubPopulationReports = subscribeToCollection('populationReports', (data) => setPopulationReports(data));
    const unsubIuranPayments = subscribeToCollection('iuranPayments', (data) => setIuranPayments(data));
    const unsubResidentRegistrations = subscribeToResidentRegistrations((data) => setResidentRegistrations(data));
    const unsubGuestReports = subscribeToGuestReports((data) => setGuestReports(data));
    const unsubInventoryLogs = subscribeToCollection('inventoryLogs', (data) => setInventoryLogs(data));
    const unsubAuditLogs = subscribeToAuditLogs((data) => setAuditLogs(data));
    const unsubPopulationLogs = subscribeToPopulationLogs((data) => setPopulationLogs(data));
    const unsubMarket = subscribeToMarketItems((data) => setMarketItems(data));
    const unsubMapPoints = subscribeToMapPoints((data) => setMapPoints(data));
    const unsubDocuments = subscribeToDocuments((data) => setDocuments(data));
    const unsubRondaLogs = subscribeToRondaLogs((data) => setRondaLogs(data));
    const unsubRondaAttendance = getRondaAttendance((data) => setRondaAttendance(data));
    const unsubSwapRequests = subscribeToRondaSwapRequests((data) => setRondaSwapRequests(data));
    const unsubGallery = subscribeToGallery((data) => setGallery(data));
    const unsubActivePatrol = subscribeToActivePatrols((data) => {
        if (data.length > 0) setActivePatrol(data[0]);
        else setActivePatrol(null);
    });
    const unsubNotifs = subscribeToNotifications((data) => {
        setNotifications(data);
        const unread = data.filter(n => !n.isRead);
        if (unread.length > 0 && unread[0].date > new Date(Date.now() - 5000).toISOString()) {
            setActiveNotification(unread[0]);
        }
    });
    const unsubFAQ = subscribeToFAQ((data) => setFaqItems(data));
    const unsubEvents = subscribeToEvents((data) => setEvents(data));
    const unsubWasteDeposits = subscribeToWasteDeposits((data) => setWasteDeposits(data));
    const unsubIdeas = subscribeToIdeas((data) => setIdeas(data));
    const unsubDonations = subscribeToDonationCampaigns((data) => setDonationCampaigns(data));
    const unsubUpdateRequests = subscribeToUpdateRequests(setUpdateRequests);
    const unsubPbbRecords = subscribeToCollection('pbbRecords', (data) => setPbbRecords(data));
    const unsubPdfConfig = subscribeToPdfConfig((data) => {
        if (data) {
            setPdfConfigState(data);
            localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(data)));
        }
    });

    // Ensure Mosque exists in Firestore
    ensureMosqueExists();

    return () => {
      unsubHouses(); unsubAnnouncements(); unsubNews(); unsubCash(); unsubOfficials(); 
      unsubReports(); unsubLetters(); unsubRonda(); unsubInventory(); unsubRondaAttendance();
      unsubUmkm(); unsubPolls(); unsubBills(); unsubPopulationReports(); unsubIuranPayments(); unsubResidentRegistrations(); unsubGuestReports(); unsubInventoryLogs(); unsubAuditLogs(); unsubPopulationLogs(); unsubMarket(); unsubMapPoints(); unsubDocuments(); unsubRondaLogs(); unsubSwapRequests(); unsubNotifs();
      unsubGallery(); unsubActivePatrol(); unsubFAQ(); unsubEvents(); unsubIdeas(); unsubDonations(); unsubUpdateRequests(); unsubPdfConfig(); unsubWasteDeposits();
      unsubPbbRecords();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAdmin(!!user);
      if (user && user.email) {
        try {
          // Fetch role from officials
          const q = query(collection(db, "officials"), where("email", "==", user.email));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const officialData = snapshot.docs[0].data() as Official;
            setAdminRole(officialData.role as Role);
          } else {
            // Default to ADMIN if not found in officials (for the main admin account)
            setAdminRole(Role.ADMIN);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, "officials");
          setAdminRole(Role.ADMIN); // Fallback to ADMIN if error
        }
      } else {
        setAdminRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <HashRouter>
        <ScrollToTop />
        <Toaster position="top-right" richColors />
        {activeNotification && <NotificationToast notification={activeNotification} onClose={() => setActiveNotification(null)} />}
        <FinancialProvider 
            houses={houses}
            iuranPayments={iuranPayments}
            cashFlow={cashFlow}
            bills={bills}
            settings={settings}
        >
            <Routes>
                <Route path="/admin" element={
                    <AdminRouteWrapper isAdmin={isAdmin} onLogin={() => setIsAdmin(true)}>
                        <AdminDashboard 
                            role={adminRole || Role.ADMIN}
                            houses={houses} 
                            announcements={announcements} 
                            news={news} 
                            cashFlow={cashFlow} 
                            officials={officials} 
                            reports={reports} 
                            letters={letters} 
                            ronda={ronda} 
                            rondaAttendance={rondaAttendance}
                            inventory={inventory} 
                            umkm={umkm} 
                            polls={polls} 
                            bills={bills}
                            rondaLogs={rondaLogs} 
                            rondaSwapRequests={rondaSwapRequests} 
                            gallery={gallery} 
                            pdfConfig={pdfConfig} 
                            setPdfConfig={setPdfConfig} 
                            notifications={notifications} 
                            documents={documents} 
                            populationReports={populationReports} 
                            setPopulationReports={setPopulationReports} 
                            populationLogs={populationLogs} 
                            setPopulationLogs={setPopulationLogs} 
                            events={events} 
                            updateRequests={updateRequests}
                            pbbRecords={pbbRecords}
                            mapPoints={mapPoints} 
                            activePatrol={activePatrol} 
                            iuranPayments={iuranPayments} 
                            residentRegistrations={residentRegistrations} 
                            guestReports={guestReports} 
                            inventoryLogs={inventoryLogs} 
                            auditLogs={auditLogs} 
                            marketItems={marketItems}
                            faqItems={faqItems} 
                            ideas={ideas}
                            settings={settings}
                            onUpdateSettings={handleUpdateSettings}
                        />
                    </AdminRouteWrapper>
                }/>
                <Route path="*" element={
                    <>
                        <PublicHeader 
                            notifications={notifications} 
                            onMarkRead={markNotificationAsRead} 
                            onDeleteNotification={async (id) => {
                                if (window.confirm('Hapus notifikasi ini?')) {
                                    await deleteNotificationFromDb(id);
                                }
                            }}
                            onDeleteAllNotifications={async () => {
                                if (window.confirm('Hapus semua notifikasi?')) {
                                    await deleteAllNotificationsFromDb();
                                }
                            }}
                        />
                        <div className="pb-24 md:pb-0">
                            <Routes>
                                <Route path="/" element={<PublicHome houses={houses} announcements={announcements} ronda={ronda} reports={reports} letters={letters} officials={officials} gallery={gallery} activePatrol={activePatrol} mapPoints={mapPoints} />} />
                                <Route path="/voting" element={<PublicVoting polls={polls} />} />
                                <Route path="/register" element={<div className="py-12 px-4"><ResidentRegistrationForm onClose={() => window.history.back()} /></div>} />
                                <Route path="/market" element={<PublicMarket items={marketItems} />} />
                                <Route path="/dokumen" element={<PublicDocuments documents={documents} />} />
                                <Route path="/services" element={<PublicServices pdfConfig={pdfConfig} houses={houses} />} />
                                <Route path="/verify/:id" element={<PublicVerification />} />
                                <Route path="/umkm" element={<PublicUMKM umkmData={umkm} />} />
                                <Route path="/peta" element={<PublicMap houses={houses} reports={reports} officials={officials} mapPoints={mapPoints} iuranPayments={iuranPayments} />} />
                                <Route path="/info" element={<PublicInfo 
                                    officials={officials} 
                                    cashFlow={cashFlow} 
                                    ronda={ronda} 
                                    rondaLogs={rondaLogs} 
                                    rondaSwapRequests={rondaSwapRequests} 
                                    houses={houses} 
                                    announcements={announcements} 
                                    galleryItems={gallery} 
                                    faqItems={faqItems} 
                                    activePatrol={activePatrol} 
                                    events={events}
                                    news={news}
                                    umkmData={umkm}
                                    documents={documents}
                                    polls={polls}
                                    ideas={ideas}
                                    donationCampaigns={donationCampaigns}
                                    wasteDeposits={wasteDeposits}
                                />} />
                                <Route path="/kegiatan" element={<PublicActivity />} />
                                <Route path="/sampah" element={<PublicWasteBank houseId={localStorage.getItem('resident_house_id') || ''} houses={houses} />} />
                                <Route path="/kesehatan" element={<PublicHealth />} />
                                <Route path="/forum" element={<PublicForum ideas={ideas} houses={houses} />} />
                                <Route path="/donasi" element={<PublicDonations campaigns={donationCampaigns} houses={houses} />} />
                                <Route path="/resident" element={<PublicResidentDashboard houses={houses} />} />
                            </Routes>
                        </div>
                        <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
                        <PanicButton houses={houses} />
                        <PushNotificationManager userId={localStorage.getItem('resident_house_id') || 'guest_user'} />
                    </>
                } />
            </Routes>
        </FinancialProvider>
    </HashRouter>
  );
};
