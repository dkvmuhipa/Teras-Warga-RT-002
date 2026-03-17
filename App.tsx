
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
import { Logo, generateHouses, MOCK_ANNOUNCEMENTS, MOCK_UMKM, MOCK_RONDA, MOCK_CASHFLOW, MOCK_GALLERY, MOCK_FAQ, MOCK_DOCUMENTS, INITIAL_OFFICIALS, DEFAULT_PDF_CONFIG, MOCK_INVENTORY, INITIAL_REPORTS, MOCK_POLLS, MOCK_RONDA_LOGS, MOCK_BILLS, MOCK_EVENTS, CHECKPOINTS, MOCK_MAP_POINTS } from '@/constants';
import { House, Announcement, News, Report, LetterRequest, PaymentStatus, UMKM, CashFlow, Official, RondaSchedule, PdfConfig, InventoryItem, AppNotification, Poll, PollOption, RondaCheckLog, MarketItem, GalleryItem, FAQItem, Document, Bill, PopulationReport, PopulationChangeLog, RondaSwapRequest, AppEvent, MapPoint, PatrolSession, ResidentRegistration } from './types';
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
import { PublicUMKM } from './components/public/PublicUMKM';
import { PublicInfo } from './components/public/PublicInfo';
import { PublicMap } from './components/public/PublicMap';
import { PublicDocuments } from './components/public/PublicDocuments';
import { PublicActivity } from './components/public/PublicActivity';
import { PublicWasteBank } from './components/public/PublicWasteBank';
import { PublicHealth } from './components/public/PublicHealth';
import { NotificationCenter } from './components/NotificationCenter';
import { NotificationToast } from './components/NotificationToast';
import { PanicButton } from './components/PanicButton';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Modal } from './components/ui/Modal';

// Firebase imports
import { auth } from './services/firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";
import { subscribeToMapPoints, subscribeToCollection, 
  subscribeToNotifications,
  subscribeToGallery,
  subscribeToDocuments,
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
  subscribeToRondaSwapRequests,
  validateResidentAccess,
  subscribeToMarketItems,
  addMarketItem,
  deleteMarketItem,
  updateMarketItemStatus,
  subscribeToBills,
  addBillToDb,
  updateBillInDb,
  deleteBillFromDb,
  subscribeToNews,
  subscribeToSettings,
  addNewsToDb,
  updateNewsInDb,
  deleteNewsFromDb,
  deepSanitize,
  subscribeToPopulationLogs,
  subscribeToActivePatrols,
  subscribeToResidentRegistrations,
  subscribeToGuestReports,
  updateGuestReportStatus,
  deleteGuestReportFromDb,
  subscribeToAuditLogs,
  subscribeToFAQ,
  subscribeToEvents,
  addFAQToDb,
  updateFAQInDb,
  deleteFAQFromDb,
  addEventToDb,
  updateEventInDb,
  deleteEventFromDb
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
  const [settings, setSettings] = useState<any>({ airFee: 10000, sampahFee: 10000 });
  const [pdfConfig, setPdfConfig] = useState<PdfConfig>(() => { try { const saved = localStorage.getItem('pdf_config'); return saved ? JSON.parse(saved) : DEFAULT_PDF_CONFIG; } catch { return DEFAULT_PDF_CONFIG; } });
  const [isAdmin, setIsAdmin] = useState(false);

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
    const unsubSettings = subscribeToSettings((data) => setSettings(data));

    return () => {
      unsubHouses(); unsubAnnouncements(); unsubNews(); unsubCash(); unsubOfficials(); 
      unsubReports(); unsubLetters(); unsubRonda(); unsubInventory(); 
      unsubUmkm(); unsubPolls(); unsubBills(); unsubPopulationReports(); unsubIuranPayments(); unsubResidentRegistrations(); unsubGuestReports(); unsubInventoryLogs(); unsubAuditLogs(); unsubPopulationLogs(); unsubMarket(); unsubMapPoints(); unsubDocuments(); unsubRondaLogs(); unsubSwapRequests(); unsubNotifs();
      unsubGallery(); unsubActivePatrol(); unsubFAQ(); unsubEvents(); unsubSettings();
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
                            houses={houses} 
                            announcements={announcements} 
                            news={news} 
                            cashFlow={cashFlow} 
                            officials={officials} 
                            reports={reports} 
                            letters={letters} 
                            ronda={ronda} 
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
                            mapPoints={mapPoints} 
                            activePatrol={activePatrol} 
                            iuranPayments={iuranPayments} 
                            residentRegistrations={residentRegistrations} 
                            guestReports={guestReports} 
                            inventoryLogs={inventoryLogs} 
                            auditLogs={auditLogs} 
                            faqItems={faqItems} 
                            settings={settings}
                        />
                    </AdminRouteWrapper>
                }/>
                <Route path="*" element={
                    <>
                        <PublicHeader notifications={notifications} onMarkRead={() => {}} />
                        <div className="pb-24 md:pb-0">
                            <Routes>
                                <Route path="/" element={<PublicHome houses={houses} announcements={announcements} ronda={ronda} reports={reports} letters={letters} officials={officials} gallery={gallery} activePatrol={activePatrol} />} />
                                <Route path="/voting" element={<PublicVoting polls={polls} />} />
                                <Route path="/register" element={<div className="py-12 px-4"><ResidentRegistrationForm onClose={() => window.history.back()} /></div>} />
                                <Route path="/market" element={<PublicMarket items={marketItems} />} />
                                <Route path="/dokumen" element={<PublicDocuments documents={documents} />} />
                                <Route path="/services" element={<PublicServices pdfConfig={pdfConfig} houses={houses} />} />
                                <Route path="/umkm" element={<PublicUMKM umkmData={umkm} />} />
                                <Route path="/peta" element={<PublicMap houses={houses} reports={reports} officials={officials} mapPoints={mapPoints} iuranPayments={iuranPayments} />} />
                                <Route path="/info" element={<PublicInfo officials={officials} cashFlow={cashFlow} ronda={ronda} rondaLogs={rondaLogs} rondaSwapRequests={rondaSwapRequests} houses={houses} announcements={announcements} galleryItems={gallery} faqItems={faqItems} activePatrol={activePatrol} />} />
                                <Route path="/kegiatan" element={<PublicActivity />} />
                                <Route path="/sampah" element={<PublicWasteBank houseId={localStorage.getItem('resident_house_id') || ''} houses={houses} />} />
                                <Route path="/kesehatan" element={<PublicHealth />} />
                            </Routes>
                        </div>
                        <ChatBot announcements={announcements} ronda={ronda} officials={officials} />
                        <PanicButton />
                    </>
                } />
            </Routes>
        </FinancialProvider>
    </HashRouter>
  );
};
