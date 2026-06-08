import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, DollarSign, FileText, 
  Megaphone, ShoppingBag, Settings, LogOut, 
  Menu, X, Shield, Vote, Briefcase, Calendar, BarChart3, Box,
  ChevronLeft, ChevronRight, Search, Bell, MapPin as MapIcon, ShieldAlert,
  PieChart, Activity, FileEdit, MessageSquare, FileClock
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
}

export const AdminSidebar: React.FC<SidebarProps> = ({ 
  role,
  activeTab, setActiveTab, isOpen, setIsOpen, onLogout, residentRegistrations = [], guestReports = [], updateRequests = []
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Pusat Kendali", "Kependudukan", "Layanan & Keuangan", "Operasional & Media", "Sistem"]);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

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
        { id: 'health', icon: Activity, label: 'Posyandu Digital' },
        { id: 'guests', icon: ShieldAlert, label: 'Laporan Tamu' },
      ] 
    },
    { 
      title: "Layanan & Keuangan", 
      items: [
        { id: 'finance', icon: DollarSign, label: 'Kas & Keuangan' },
        { id: 'services', icon: FileText, label: 'Surat & Laporan' },
        { id: 'documents', icon: FileText, label: 'Arsip Dokumen' },
      ] 
    },
    { 
      title: "Operasional & Media", 
      items: [
        { id: 'facilities', icon: Shield, label: 'Keamanan & Ronda' },
        { id: 'content', icon: Megaphone, label: 'Pusat Informasi' },
        { id: 'activities', icon: Calendar, label: 'Agenda & Presensi' },
        { id: 'assets', icon: Box, label: 'Aset & Inventaris' },
        { id: 'officials', icon: Briefcase, label: 'Pengurus RT' },
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
        isAllowed = ['overview', 'analytics', 'finance', 'settings', 'notifications'].includes(item.id);
      } else if (role === Role.SECRETARY) {
        isAllowed = [
          'overview', 'analytics', 'residents', 
          'health', 'guests', 'officials', 'services', 'documents', 'activities', 
          'assets', 'content', 'audit', 'notifications', 'settings'
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
      return { short: 'AD', full: 'Administrator', bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' };
    } else if (roleLower.includes('treasurer') || roleLower.includes('bendahara')) {
      return { short: 'BK', full: 'Bendahara Kas', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' };
    } else if (roleLower.includes('secretary') || roleLower.includes('sekretaris')) {
      return { short: 'SK', full: 'Sekretaris RT', bg: 'bg-sky-500/10 border-sky-500/20 text-sky-400' };
    }
    return { short: 'RT', full: 'Pengurus RT', bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400' };
  };

  const roleInfo = getRoleBadge();

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
          fixed top-0 left-0 z-50 h-full bg-slate-900 text-white border-r border-slate-800/70
          md:static flex flex-col shadow-2xl shadow-slate-950/80
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
            <div className={`p-6 border-b border-slate-800/80 flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
              <Logo dark showText={!isCollapsed} imageSize={isCollapsed ? "h-10" : "h-10"} />
              {!isCollapsed && (
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="ml-auto md:hidden text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

          {/* Quick Search (Only when not collapsed) */}
          {!isCollapsed && (
            <div className="px-5 mt-6">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={15} />
                <input 
                  type="text" 
                  placeholder="Cari menu admin..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800/80 rounded-xl py-2 pl-9 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/80 transition-all placeholder:text-slate-550 text-slate-200"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/80 p-0.5 rounded-full transition-colors"
                  >
                    <X size={12} className="stroke-[3px]" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-5 custom-scrollbar scrollbar-hide">
            {filteredNavGroups.map((group) => (
              <div key={group.title} className="space-y-1.5">
                {!isCollapsed ? (
                  <button 
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-2 hover:text-slate-300 transition-colors"
                  >
                    <span>{group.title}</span>
                    <motion.div
                      animate={{ rotate: expandedGroups.includes(group.title) ? 0 : -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronLeft size={10} className="stroke-[3px]" />
                    </motion.div>
                  </button>
                ) : (
                  <div className="h-px bg-slate-800/80 my-5 mx-1" />
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
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setIsOpen(false);
                            }}
                            title={isCollapsed ? item.label : ''}
                            className={`
                              w-full flex items-center gap-3 rounded-xl transition-all duration-300 font-extrabold text-[13px] group relative
                              ${isCollapsed ? 'justify-center p-3' : 'px-3.5 py-3'}
                              ${isActive 
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/50' 
                                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                              }
                            `}
                          >
                            <item.icon size={18} className={`shrink-0 transition-transform duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:scale-110 group-hover:text-slate-200'}`} />
                            {!isCollapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                            
                            {/* Badges */}
                            {!isCollapsed && item.id === 'residents' && residentRegistrations.filter(r => r.approvalStatus === 'Pending').length > 0 && (
                              <span className="ml-auto bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                {residentRegistrations.filter(r => r.approvalStatus === 'Pending').length}
                              </span>
                            )}
                            {!isCollapsed && item.id === 'guests' && guestReports.filter(g => g.status === 'Active').length > 0 && (
                              <span className="ml-auto bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                {guestReports.filter(g => g.status === 'Active').length}
                              </span>
                            )}

                            {isActive && !isCollapsed && (
                              <motion.div 
                                layoutId="activeTabIndicator"
                                className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)]"
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
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
          <div className="hidden md:block px-4 py-2 mb-2">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center py-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all border border-slate-800/50 hover:border-slate-700/60"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em]"><ChevronLeft size={14} /> Sembunyikan Panel</div>}
            </button>
          </div>

          {/* Footer / Logout */}
          <div className="p-4 mt-auto border-t border-slate-800/30 bg-slate-950/40">
            <div className={`flex flex-col gap-2 ${isCollapsed ? 'items-center' : ''}`}>
              {!isCollapsed && (
                <div className="bg-slate-900/60 rounded-2xl p-3 border border-slate-800/60 mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border shadow-inner ${roleInfo.bg}`}>
                      {roleInfo.short}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-slate-100 truncate">{roleInfo.full}</p>
                      <p className="text-[10px] font-bold text-indigo-400 mt-0.5 tracking-wider uppercase">Wilayah RT 02 / RW 020</p>
                    </div>
                  </div>
                </div>
              )}
              <button 
                onClick={onLogout}
                className={`
                  flex items-center gap-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 group
                  ${isCollapsed ? 'p-3 justify-center bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 'w-full p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-600/20'}
                `}
                title={isCollapsed ? 'Keluar' : ''}
              >
                <LogOut size={16} className="shrink-0 group-hover:rotate-12 transition-transform" />
                {!isCollapsed && <span>Keluar Sistem</span>}
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};
