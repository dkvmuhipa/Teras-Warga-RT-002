import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Users, DollarSign, FileText, 
  Megaphone, ShoppingBag, Settings, LogOut, 
  Menu, X, Shield, Vote, Briefcase, Calendar, BarChart3, Box,
  ChevronLeft, ChevronRight, Search, Bell, MapPin as MapIcon, ShieldAlert, AlertTriangle,
  PieChart, Activity, FileEdit, MessageSquare, FileClock, Inbox, Car, Award, Droplets, BookOpen, Building, CheckSquare
} from 'lucide-react';
import { Logo } from '../../constants';
import { Role } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  role: Role;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout: () => void;
  residentRegistrations?: any[];
  guestReports?: any[];
  updateRequests?: any[];
  rondaSwapRequests?: any[];
  letters?: any[];
  reports?: any[];
}

export const AdminSidebar: React.FC<SidebarProps> = ({ 
  role,
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen, 
  onLogout, 
  residentRegistrations = [], 
  guestReports = [], 
  updateRequests = [],
  rondaSwapRequests = [],
  letters = [],
  reports = []
}) => {
  // Persistent collapse state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rt02_admin_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Persistent expanded groups state
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rt02_admin_expanded_groups');
      return saved ? JSON.parse(saved) : ["Pusat Kendali", "Kependudukan", "Layanan & Keuangan", "Operasional & Media", "Sistem"];
    } catch {
      return ["Pusat Kendali", "Kependudukan", "Layanan & Keuangan", "Operasional & Media", "Sistem"];
    }
  });

  // Save expanded groups to localStorage on change
  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => {
      const next = prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title];
      try {
        localStorage.setItem('rt02_admin_expanded_groups', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('rt02_admin_sidebar_collapsed', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Keyboard shortcut for search (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        if (!(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navGroups = [
    { 
      title: "Pusat Kendali", 
      items: [
        { id: 'overview', icon: LayoutDashboard, label: 'Dashboard UTAMA' },
        { id: 'analytics', icon: BarChart3, label: 'Pusat Analitik' },
      ] 
    },
    { 
      title: "Kependudukan", 
      items: [
        { id: 'residents', icon: Users, label: 'Data Warga' },
        { id: 'rentals', icon: Building, label: 'Rumah Sewa & Kontrakan' },
        { id: 'health', icon: Activity, label: 'Posyandu Digital' },
        { id: 'stbm', icon: CheckSquare, label: '5 Pilar STBM' },
        { id: 'officials', icon: Briefcase, label: 'Pengurus RT' },
      ] 
    },
    { 
      title: "Layanan & Pelaporan", 
      items: [
        { id: 'services', icon: FileText, label: 'Pusat Persuratan' },
        { id: 'meeting-minutes', icon: BookOpen, label: 'Notula Musyawarah' },
        { id: 'reports-lpj', icon: Award, label: 'Laporan & LPJ RT' },
        { id: 'reports-warga', icon: AlertTriangle, label: 'Pusat Pelaporan & Tamu' },
        { id: 'documents', icon: FileText, label: 'Arsip Dokumen' },
      ] 
    },
    { 
      title: "Operasional & Keuangan", 
      items: [
        { id: 'finance', icon: DollarSign, label: 'Kas & Keuangan' },
        { id: 'water-meter', icon: Droplets, label: 'Meter Air & Utilitas' },
        { id: 'facilities', icon: Shield, label: 'Keamanan & Ronda' },
        { id: 'kerja-bakti', icon: Users, label: 'Kerja Bakti & Gotong Royong' },
        { id: 'panic-logs', icon: ShieldAlert, label: 'Log Panic Button SOS' },
        { id: 'content', icon: Megaphone, label: 'Pusat Informasi' },
        { id: 'activities', icon: Calendar, label: 'Agenda & Presensi' },
        { id: 'assets', icon: Box, label: 'Aset & Inventaris' },
      ] 
    },
    { 
      title: "Sistem", 
      items: [
        { id: 'notifications', icon: Bell, label: 'Notifikasi' },
        { id: 'audit', icon: Activity, label: 'Log Aktivitas' },
        { id: 'settings', icon: Settings, label: 'Pengaturan' }
      ] 
    }
  ];

  // Filter navGroups based on role and search term
  const filteredNavGroups = navGroups.map(group => {
    const matchedItems = group.items.filter(item => {
      // Role validation
      let isAllowed = false;
      if (role === Role.ADMIN) {
        isAllowed = true;
      } else if (role === Role.TREASURER) {
        isAllowed = ['overview', 'analytics', 'finance', 'water-meter', 'reports-lpj', 'lpj-tahunan', 'settings', 'notifications'].includes(item.id);
      } else if (role === Role.SECRETARY) {
        isAllowed = [
          'overview', 'analytics', 'residents', 'rentals',
          'health', 'stbm', 'officials', 'services', 'meeting-minutes', 'reports-lpj', 'laporan-kegiatan', 'lpj-tahunan', 'reports-warga', 'documents', 'activities', 
          'assets', 'content', 'water-meter', 'audit', 'notifications', 'settings'
        ].includes(item.id);
      }

      // Search validation
      if (!isAllowed) return false;
      if (!searchTerm) return true;
      return item.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
             item.id.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return {
      ...group,
      items: matchedItems
    };
  }).filter(group => group.items.length > 0);

  const getRoleBadge = () => {
    const roleLower = String(role).toLowerCase();
    if (roleLower.includes('admin')) {
      return { short: 'AD', full: 'Administrator', bg: 'bg-indigo-50 border-indigo-100 text-indigo-700' };
    } else if (roleLower.includes('treasurer') || roleLower.includes('bendahara')) {
      return { short: 'BK', full: 'Bendahara Kas', bg: 'bg-emerald-50 border-emerald-100 text-emerald-700' };
    } else if (roleLower.includes('secretary') || roleLower.includes('sekretaris')) {
      return { short: 'SK', full: 'Sekretaris RT', bg: 'bg-sky-50 border-sky-100 text-sky-700' };
    }
    return { short: 'RT', full: 'Pengurus RT', bg: 'bg-slate-50 border-slate-200 text-slate-700' };
  };

  const roleInfo = getRoleBadge();

  // Highlight matches in searched text
  const renderHighlightedLabel = (text: string) => {
    if (!searchTerm) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={i} className="bg-amber-100 text-amber-950 rounded px-0.5 font-black">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Helper to get pending count for an item
  const getItemPendingCount = (itemId: string): number => {
    switch (itemId) {
      case 'residents':
        const pendingReg = residentRegistrations.filter(r => r.approvalStatus === 'Pending').length;
        const pendingUpd = updateRequests.filter(r => r.status === 'Pending').length;
        return pendingReg + pendingUpd;
      case 'reports-warga':
        const pendingGuests = guestReports.filter(g => g.status === 'Active' || g.status === 'Pending').length;
        const pendingR = reports.filter(r => r.status === 'Baru' || r.status === 'Diproses').length;
        return pendingGuests + pendingR;
      case 'services':
        const pendingL = letters.filter(l => l.status === 'Pending' || l.status === 'Baru' || l.status === 'Menunggu').length;
        return pendingL;
      case 'facilities':
        return rondaSwapRequests.filter(s => s.status === 'Menunggu' || s.status === 'Pending').length;
      default:
        return 0;
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isCollapsed ? '84px' : '290px',
          x: isOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 768 ? -290 : 0)
        }}
        className={`
          fixed top-0 left-0 z-50 h-full bg-white/95 backdrop-blur-2xl text-slate-700 border-r border-slate-200/80
          md:static flex flex-col shadow-[4px_0_30px_rgba(0,0,0,0.03)] select-none
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className={`p-5 md:p-6 border-b border-slate-100/90 flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
            <Logo showText={!isCollapsed} imageSize={isCollapsed ? "h-8" : "h-9"} />
            {!isCollapsed && (
              <button 
                onClick={() => setIsOpen(false)} 
                className="ml-auto md:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Tutup Sidebar"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Quick Search (Only when not collapsed) */}
          {!isCollapsed && (
            <div className="px-4 mt-5 mb-2">
              <div className="relative group/search">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-indigo-600 transition-colors" size={15} />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Cari modul... (Tekan /)" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/80 rounded-2xl py-2 pl-9 pr-8 text-xs font-bold focus:outline-none focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-700"
                />
                {searchTerm ? (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 p-1 rounded-full transition-colors"
                  >
                    <X size={11} className="stroke-[3px]" />
                  </button>
                ) : (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 bg-white px-1.5 py-0.5 rounded-md border border-slate-200 select-none hidden group-focus-within/search:hidden sm:block shadow-2xs">
                    /
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto pt-2 pb-6 px-3.5 space-y-5 custom-scrollbar scrollbar-hide">
            {filteredNavGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                {!isCollapsed ? (
                  <button 
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest my-2 px-3 hover:text-indigo-600 transition-colors"
                  >
                    <span>{group.title}</span>
                    <motion.div
                      animate={{ rotate: expandedGroups.includes(group.title) ? 0 : -90 }}
                      transition={{ duration: 0.18 }}
                    >
                      <ChevronLeft size={12} className="stroke-[3px]" />
                    </motion.div>
                  </button>
                ) : (
                  <div className="h-px bg-slate-100 my-3 mx-2" />
                )}
                
                <AnimatePresence initial={false}>
                  {(isCollapsed || expandedGroups.includes(group.title)) && (
                    <motion.div 
                      initial={isCollapsed ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-1"
                    >
                      {group.items.map(item => {
                        const isMainDashboard = item.id === 'overview';
                        const isActive = isMainDashboard ? activeTab === 'overview' : activeTab === item.id;
                        const pendingCount = getItemPendingCount(item.id);
                        
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              if (window.innerWidth < 768) setIsOpen(false);
                            }}
                            title={isCollapsed ? `${item.label}${pendingCount > 0 ? ` (${pendingCount} tertunda)` : ''}` : ''}
                            className={`
                              w-full flex items-center gap-3 rounded-2xl transition-all duration-200 font-bold text-xs group relative overflow-hidden
                              ${isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5'}
                              ${isActive 
                                ? 'bg-gradient-to-r from-indigo-50/90 to-violet-50/70 text-indigo-700 shadow-2xs border border-indigo-200/70 font-black' 
                                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 border border-transparent hover:translate-x-0.5'
                              }
                            `}
                          >
                            <div className="relative shrink-0 flex items-center justify-center">
                              <item.icon 
                                size={17} 
                                className={`transition-all duration-300 ${
                                  isActive 
                                    ? 'text-indigo-600 scale-110 stroke-[2.4px]' 
                                    : 'text-slate-400 group-hover:scale-110 group-hover:text-indigo-600 stroke-[2px]'
                                }`} 
                              />
                              
                              {/* Pulsing notification dot for collapsed mode */}
                              {isCollapsed && pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white"></span>
                                </span>
                              )}
                            </div>

                            {!isCollapsed && (
                              <span className="truncate text-left flex-1 tracking-tight">{renderHighlightedLabel(item.label)}</span>
                            )}
                            
                            {/* Detailed dynamic badge for expanded mode */}
                            {!isCollapsed && pendingCount > 0 && (
                              <span className={`
                                ml-auto text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs border
                                ${item.id === 'guests' || item.id === 'facilities'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }
                              `}>
                                {pendingCount}
                              </span>
                            )}

                            {isActive && !isCollapsed && (
                              <motion.div 
                                layoutId="activeTabIndicator"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-indigo-600 to-violet-600 shadow-sm shadow-indigo-500/50"
                                transition={{ type: "spring", stiffness: 350, damping: 32 }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Collapse Toggle (Desktop Only) */}
          <div className="hidden md:block px-3.5 py-2 border-t border-slate-100 bg-slate-50/60">
            <button 
              onClick={toggleCollapse}
              className="w-full flex items-center justify-center py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all border border-slate-200 hover:border-slate-300 shadow-2xs active:scale-[0.98]"
            >
              {isCollapsed ? <ChevronRight size={17} /> : <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"><ChevronLeft size={15} /> Sembunyikan</div>}
            </button>
          </div>

          {/* Footer / Role Information & Logout */}
          <div className="p-3.5 bg-slate-50/70 border-t border-slate-200/70">
            <div className={`flex flex-col gap-2.5 ${isCollapsed ? 'items-center' : ''}`}>
              {!isCollapsed && (
                <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border shadow-2xs ${roleInfo.bg}`}>
                    {roleInfo.short}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-black text-slate-900 truncate leading-tight mb-0.5">{roleInfo.full}</p>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wide">Wilayah RT 02 / 020</p>
                  </div>
                </div>
              )}
              <button 
                onClick={onLogout}
                className={`
                  flex items-center gap-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all duration-200 group
                  ${isCollapsed ? 'p-2.5 justify-center bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100' : 'w-full px-3.5 py-2.5 bg-white text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 shadow-2xs'}
                `}
                title={isCollapsed ? 'Keluar' : ''}
              >
                <LogOut size={15} className="shrink-0 group-hover:scale-110 transition-transform" />
                {!isCollapsed && <span>Keluar Sistem</span>}
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};
