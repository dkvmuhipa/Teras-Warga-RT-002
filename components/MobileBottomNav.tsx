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

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch (_) {}
    }
  };

  return (
    <nav 
      aria-label="Navigasi Menu Utama Mobile" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-[90] pointer-events-auto no-print bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] safe-area-pb"
    >
      <div className="flex items-center justify-around py-1.5 px-2 relative max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={() => {
                  triggerHaptic();
                  onOpenPanicModal?.();
                }}
                aria-label="Pusat Siaga Darurat Lingkungan (Panic SOS)"
                className="flex flex-col items-center justify-center min-w-[52px] min-h-[48px] focus:outline-none active:scale-90 transition-transform cursor-pointer"
              >
                <div className="w-11 h-11 bg-gradient-to-tr from-rose-600 via-rose-500 to-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-500/35 border-2 border-white animate-pulse">
                  <Icon size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[9px] font-black text-rose-600 tracking-wider uppercase mt-0.5">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                triggerHaptic();
                onTabChange(item.id);
              }}
              aria-label={`Buka halaman ${item.label}`}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-w-[52px] min-h-[48px] px-2 py-1 rounded-2xl transition-all active:scale-95 cursor-pointer ${
                isActive 
                  ? 'text-indigo-600 font-bold bg-indigo-50/70' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5] text-indigo-600' : 'stroke-[1.8] text-slate-400'} />
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-black text-indigo-700' : 'font-semibold text-slate-500'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-indigo-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
