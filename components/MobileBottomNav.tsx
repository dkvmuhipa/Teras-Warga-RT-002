import React from 'react';
import { Home, MapPin, Bell, FileText, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface MobileBottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenPanicModal?: () => void;
  isAdmin: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenPanicModal,
  isAdmin
}) => {
  const navItems = [
    { id: 'info', label: 'Beranda', icon: Home },
    { id: 'map', label: 'Peta', icon: MapPin },
    { id: 'panic', label: 'Darurat', icon: Bell, isAction: true },
    { id: 'rules', label: 'Peraturan', icon: FileText },
    { id: 'admin', label: isAdmin ? 'Admin' : 'Login', icon: UserCheck },
  ];

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-[90] pointer-events-auto no-print">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-1.5 shadow-[0_15px_35px_rgba(15,23,42,0.4)] flex items-center justify-around relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={onOpenPanicModal}
                className="relative -top-5 flex flex-col items-center justify-center focus:outline-none group"
              >
                <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 rounded-full flex items-center justify-center text-white shadow-[0_8px_20px_rgba(244,63,94,0.5)] border-4 border-slate-900 active:scale-95 transition-all animate-pulse">
                  <Icon size={22} className="stroke-[2.5]" />
                </div>
                <span className="text-[9px] font-black text-rose-400 tracking-wider uppercase -mt-0.5">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 active:scale-95 ${
                isActive ? 'text-white font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute inset-0 bg-white/10 rounded-2xl border border-white/10"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon size={18} className={`relative z-10 ${isActive ? 'text-indigo-400 stroke-[2.5]' : 'stroke-[2]'}`} />
              <span className="relative z-10 text-[9px] font-bold tracking-tight mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
