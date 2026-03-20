import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, DollarSign, FileText, 
  Megaphone, ShoppingBag, Settings, LogOut, 
  Menu, X, Shield, Vote, Briefcase, Calendar, BarChart3, Box,
  ChevronLeft, ChevronRight, Search, Bell, MapPin as MapIcon, ShieldAlert,
  PieChart, Activity, FileEdit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
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
  activeTab, setActiveTab, isOpen, setIsOpen, onLogout, residentRegistrations = [], guestReports = [], updateRequests = []
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Utama", "Administrasi"]);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const navGroups = [
    { 
      title: "Utama", 
      items: [
        { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'analytics', icon: BarChart3, label: 'Pusat Analitik' },
      ] 
    },
    { 
      title: "Kependudukan", 
      items: [
        { id: 'residents', icon: Users, label: 'Data Warga' },
        { id: 'update-requests', icon: FileEdit, label: 'Update Data' },
        { id: 'population-reports', icon: Users, label: 'Laporan Penduduk' },
        { id: 'health', icon: Activity, label: 'Posyandu Digital' },
        { id: 'guests', icon: ShieldAlert, label: 'Laporan Tamu' },
        { id: 'officials', icon: Briefcase, label: 'Pengurus RT' },
      ] 
    },
    { 
      title: "Layanan & Keuangan", 
      items: [
        { id: 'services', icon: FileText, label: 'Layanan & Surat' },
        { id: 'finance', icon: DollarSign, label: 'Keuangan' },
        { id: 'documents', icon: FileText, label: 'Arsip Dokumen' },
      ] 
    },
    { 
      title: "Operasional", 
      items: [
        { id: 'facilities', icon: Shield, label: 'Keamanan & Ronda' },
        { id: 'activities', icon: Calendar, label: 'Presensi Kegiatan' },
        { id: 'waste-bank', icon: Box, label: 'Bank Sampah' },
        { id: 'assets', icon: Box, label: 'Aset & Inventaris' },
        { id: 'content', icon: Megaphone, label: 'Konten & Informasi' },
      ] 
    },
    { 
      title: "Sistem & Log", 
      items: [
        { id: 'audit', icon: Activity, label: 'Audit Log' },
        { id: 'notifications', icon: Bell, label: 'Notifikasi' },
        { id: 'settings', icon: Settings, label: 'Pengaturan' }
      ] 
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isCollapsed ? '80px' : '280px',
          x: isOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 768 ? -280 : 0)
        }}
        className={`
          fixed top-0 left-0 z-50 h-full bg-slate-950 text-white border-r border-slate-800/50
          md:static flex flex-col shadow-2xl shadow-black/50
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`p-6 border-b border-slate-800/50 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20 shrink-0">
              <Shield size={24} className="text-white" />
            </div>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">TERAS Admin</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Panel Pengurus</p>
              </motion.div>
            )}
            {!isCollapsed && (
              <button 
                onClick={() => setIsOpen(false)} 
                className="ml-auto md:hidden text-slate-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Quick Search (Only when not collapsed) */}
          {!isCollapsed && (
            <div className="px-4 mt-6">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari fitur..." 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-4 custom-scrollbar scrollbar-hide">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                {!isCollapsed ? (
                  <button 
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 px-3 hover:text-slate-400 transition-colors"
                  >
                    <span>{group.title}</span>
                    <motion.div
                      animate={{ rotate: expandedGroups.includes(group.title) ? 0 : -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronLeft size={10} />
                    </motion.div>
                  </button>
                ) : (
                  <div className="h-px bg-slate-800/50 my-4 mx-2" />
                )}
                
                <AnimatePresence initial={false}>
                  {(isCollapsed || expandedGroups.includes(group.title)) && (
                    <motion.div 
                      initial={isCollapsed ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-1"
                    >
                      {group.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsOpen(false);
                          }}
                          title={isCollapsed ? item.label : ''}
                          className={`
                            w-full flex items-center gap-3 rounded-xl transition-all duration-300 font-bold text-sm group relative
                            ${isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                            ${activeTab === item.id 
                              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                              : 'text-slate-500 hover:bg-slate-900 hover:text-slate-200'
                            }
                          `}
                        >
                          <item.icon size={18} className={`shrink-0 transition-transform duration-300 ${activeTab === item.id ? 'text-white scale-110' : 'text-slate-500 group-hover:scale-110 group-hover:text-slate-300'}`} />
                          {!isCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                          
                          {/* Badges */}
                          {!isCollapsed && item.id === 'residents' && residentRegistrations.filter(r => r.approvalStatus === 'Pending').length > 0 && (
                            <span className="ml-auto bg-indigo-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                              {residentRegistrations.filter(r => r.approvalStatus === 'Pending').length}
                            </span>
                          )}
                          {!isCollapsed && item.id === 'guests' && guestReports.filter(g => g.status === 'Active').length > 0 && (
                            <span className="ml-auto bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                              {guestReports.filter(g => g.status === 'Active').length}
                            </span>
                          )}

                          {activeTab === item.id && !isCollapsed && (
                            <motion.div 
                              layoutId="activeTab"
                              className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                            />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Collapse Toggle (Desktop Only) */}
          <div className="hidden md:block px-4 py-2">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all border border-slate-800/50"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><ChevronLeft size={14} /> Sembunyikan</div>}
            </button>
          </div>

          {/* Footer / Logout */}
          <div className="p-4 mt-auto">
            <div className={`flex flex-col gap-2 ${isCollapsed ? 'items-center' : ''}`}>
              {!isCollapsed && (
                <div className="bg-slate-900/50 rounded-2xl p-3 border border-slate-800/50 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm">
                      AD
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">Administrator</p>
                      <p className="text-[10px] font-medium text-slate-500 truncate">RT 02 RW 020</p>
                    </div>
                  </div>
                </div>
              )}
              <button 
                onClick={onLogout}
                className={`
                  flex items-center gap-2 rounded-xl font-bold text-sm transition-all group
                  ${isCollapsed ? 'p-3 justify-center bg-rose-500/10 text-rose-500' : 'w-full p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white'}
                `}
                title={isCollapsed ? 'Keluar' : ''}
              >
                <LogOut size={18} className="shrink-0 group-hover:rotate-12 transition-transform" />
                {!isCollapsed && <span>Keluar Sistem</span>}
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};
