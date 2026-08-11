import { Home, Wrench, Bell, FileText, UserCheck } from 'lucide-react';
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
    { id: 'services', label: 'Layanan', icon: Wrench },
    { id: 'panic', label: 'Darurat', icon: Bell, isAction: true },
    { id: 'rules', label: 'Peraturan', icon: FileText },
    { id: 'admin', label: isAdmin ? 'Admin' : 'Login', icon: UserCheck },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[90] pointer-events-auto no-print bg-slate-900 border-t border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] safe-area-pb">
      <div className="flex items-center justify-around py-2 px-1 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={onOpenPanicModal}
                className="flex flex-col items-center justify-center focus:outline-none active:scale-95 transition-transform"
              >
                <div className="w-10 h-10 bg-gradient-to-tr from-rose-600 to-rose-500 rounded-full flex items-center justify-center text-white shadow-md shadow-rose-600/40 border border-rose-400/30 animate-pulse">
                  <Icon size={18} className="stroke-[2.5]" />
                </div>
                <span className="text-[9px] font-bold text-rose-400 tracking-wider uppercase mt-0.5">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3.5 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute inset-0 bg-white/10 rounded-xl border border-white/10"
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
