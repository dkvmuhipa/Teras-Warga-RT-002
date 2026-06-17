import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Vote, ShoppingCart, FileText, Shield, Package, Calendar, Menu, X, LayoutGrid, Wallet, Info, HelpCircle, Scale, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Beranda' },
    { path: '/services', icon: FileText, label: 'Layanan' },
    { path: '/market', icon: ShoppingCart, label: 'Pasar' },
    { path: '/sampah', icon: Package, label: 'Sampah' },
  ];

  const menuGroups = [
    {
      label: 'Layanan & Administrasi',
      items: [
        { path: '/services', icon: FileText, label: 'Persuratan' },
        { path: '/dokumen', icon: FileText, label: 'Arsip Dokumen' },
        { path: '/voting', icon: Vote, label: 'E-Voting' },
      ]
    },
    {
      label: 'Ekonomi Warga',
      items: [
        { path: '/market', icon: ShoppingCart, label: 'Pasar Warga' },
        { path: '/sampah', icon: Package, label: 'Bank Sampah' },
        { path: '/umkm', icon: LayoutGrid, label: 'Direktori UMKM' },
      ]
    },
    {
      label: 'Informasi RT',
      items: [
        { path: '/info', icon: Shield, label: 'Info RT & Kas' },
        { path: '/about', icon: Info, label: 'Tentang Kami' },
        { path: '/rules', icon: Scale, label: 'Peraturan RT' },
        { path: '/gempa', icon: Activity, label: 'Siaga Gempa' },
        { path: '/faq', icon: HelpCircle, label: 'FAQ' },
        { path: '/kegiatan', icon: Calendar, label: 'Jadwal Kegiatan' },
      ]
    }
  ];

  return (
    <>
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[70] p-6 pb-12 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-800">Menu Navigasi</h3>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 bg-slate-100 rounded-full text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                {menuGroups.map((group, idx) => (
                  <div key={idx}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{group.label}</p>
                    <div className="grid grid-cols-3 gap-4">
                      {group.items.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setIsMenuOpen(false);
                          }}
                          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors group"
                        >
                          <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                            <item.icon size={20} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/80 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.2)] z-50 pb-safe-area-pb">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button 
                key={item.path} 
                onClick={() => navigate(item.path)} 
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <item.icon size={20} className={isActive ? 'fill-current' : ''} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            );
          })}
          <button 
            onClick={() => setIsMenuOpen(true)} 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isMenuOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Menu size={20} />
            <span className="text-[10px] font-bold">Menu</span>
          </button>
        </div>
      </div>
    </>
  );
};
