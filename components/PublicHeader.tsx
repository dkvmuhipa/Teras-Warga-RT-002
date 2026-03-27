import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ChevronDown, LayoutGrid, Wallet, Users, Info } from 'lucide-react';
import { RT_NAME, Logo } from '../constants';
import { Button } from './ui/Button';
import { NotificationCenter } from './NotificationCenter';
import { MobileBottomNav } from './MobileBottomNav';
import { AppNotification } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PublicHeaderProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ notifications, onMarkRead }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;
  
  const navGroups = [
    {
      id: 'layanan',
      label: 'Layanan',
      icon: LayoutGrid,
      items: [
        { path: '/services', label: 'Persuratan' },
        { path: '/dokumen', label: 'Arsip Dokumen' },
        { path: '/voting', label: 'E-Voting' },
      ]
    },
    {
      id: 'ekonomi',
      label: 'Ekonomi',
      icon: Wallet,
      items: [
        { path: '/market', label: 'Pasar Warga' },
        { path: '/sampah', label: 'Bank Sampah' },
        { path: '/umkm', label: 'Direktori UMKM' },
      ]
    },
    {
      id: 'info',
      label: 'Informasi',
      icon: Info,
      items: [
        { path: '/info', label: 'Info RT & Kas' },
        { path: '/kegiatan', label: 'Jadwal Kegiatan' },
      ]
    }
  ];

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <Logo showText={true} imageSize="h-8 md:h-10" />
            </div>
            
            <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center space-x-1 mr-4">
                  <button 
                    onClick={() => navigate('/')} 
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive('/') ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    Beranda
                  </button>

                  {navGroups.map((group) => (
                    <div 
                      key={group.id}
                      className="relative"
                      onMouseEnter={() => setActiveDropdown(group.id)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <button 
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          group.items.some(item => isActive(item.path)) 
                          ? "text-blue-600 bg-blue-50" 
                          : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {group.label}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === group.id ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {activeDropdown === group.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 z-50 overflow-hidden"
                          >
                            {group.items.map((item) => (
                              <button
                                key={item.path}
                                onClick={() => {
                                  navigate(item.path);
                                  setActiveDropdown(null);
                                }}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                  isActive(item.path)
                                  ? "bg-blue-50 text-blue-600"
                                  : "text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
                
                <NotificationCenter notifications={notifications} onMarkRead={onMarkRead} />

                <div className="hidden md:block h-6 w-px bg-slate-200 mx-2"></div>
                <Button onClick={() => navigate('/admin')} variant="secondary" className="hidden md:flex ml-2 text-xs h-9 font-bold rounded-xl">
                  Panel Admin
                </Button>
            </div>
            <div className="flex items-center lg:hidden gap-2">
               <button onClick={() => navigate('/admin')} className="p-2 text-slate-400 hover:text-blue-600"><User size={20}/></button>
            </div>
          </div>
        </div>
      </nav>
      <MobileBottomNav />
    </>
  );
};
