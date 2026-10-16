import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  User, FileText, Shield, Building, UserPlus, BookOpen, 
  ShoppingCart, Megaphone, Scale, Wrench, Zap, AlertTriangle, 
  PhoneCall, CheckSquare 
} from 'lucide-react';
import { toast } from 'sonner';
import { useTenant } from '../../../context/TenantContext';

export type ServiceCategory = 'all' | 'admin' | 'security' | 'community';

interface QuickActionsGridProps {
  onOpenReport: () => void;
  onOpenSkills: () => void;
  onOpenOutage: () => void;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
  onOpenReport,
  onOpenSkills,
  onOpenOutage
}) => {
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('all');

  const quickActions = useMemo(() => [
    { 
      label: 'Profil Warga', 
      category: 'admin' as ServiceCategory,
      icon: User, 
      bg: 'bg-[#f0f2fe]', 
      color: 'text-[#4f46e5]', 
      border: 'border-indigo-100/80',
      link: '/resident' 
    },
    { 
      label: 'Buat Surat', 
      category: 'admin' as ServiceCategory,
      icon: FileText, 
      bg: 'bg-[#edf7ff]', 
      color: 'text-[#0284c7]', 
      border: 'border-sky-100/80',
      link: '/services' 
    },
    { 
      label: 'Lapor Tamu', 
      category: 'security' as ServiceCategory,
      icon: Shield, 
      bg: 'bg-[#fff4eb]', 
      color: 'text-[#ea580c]', 
      border: 'border-amber-100/80',
      link: '/services?tab=tamu',
      badge: 'PENTING',
      badgeColor: 'bg-rose-500'
    },
    { 
      label: 'Lapor Sewa', 
      category: 'security' as ServiceCategory,
      icon: Building, 
      bg: 'bg-[#e8faf0]', 
      color: 'text-[#059669]', 
      border: 'border-emerald-100/80',
      link: '/services?tab=sewa',
      badge: '1x24 JAM',
      badgeColor: 'bg-emerald-600'
    },
    { 
      label: 'Daftar Warga', 
      category: 'admin' as ServiceCategory,
      icon: UserPlus, 
      bg: 'bg-[#f5f3ff]', 
      color: 'text-[#7c3aed]', 
      border: 'border-purple-100/80',
      link: '/register' 
    },
    { 
      label: 'Buku Saku', 
      category: 'admin' as ServiceCategory,
      icon: BookOpen, 
      bg: 'bg-[#f0f2fe]', 
      color: 'text-[#4f46e5]', 
      border: 'border-indigo-100/80',
      link: '/welcome',
      badge: 'BARU',
      badgeColor: 'bg-emerald-600'
    },
    { 
      label: 'UMKM Warga', 
      category: 'community' as ServiceCategory,
      icon: ShoppingCart, 
      bg: 'bg-[#ecfdf5]', 
      color: 'text-[#059669]', 
      border: 'border-emerald-100/80',
      link: '/umkm',
      badge: 'UMKM',
      badgeColor: 'bg-indigo-600'
    },
    { 
      label: 'Warta RT', 
      category: 'community' as ServiceCategory,
      icon: Megaphone, 
      bg: 'bg-[#eff6ff]', 
      color: 'text-[#2563eb]', 
      border: 'border-blue-100/80',
      link: '/info' 
    },
    { 
      label: 'Peraturan RT', 
      category: 'security' as ServiceCategory,
      icon: BookOpen, 
      bg: 'bg-[#f0fdf4]', 
      color: 'text-[#16a34a]', 
      border: 'border-emerald-100/80',
      link: '/rules',
      badge: '13 BAB',
      badgeColor: 'bg-emerald-600'
    },
    { 
      label: 'Notula', 
      category: 'admin' as ServiceCategory,
      icon: Scale, 
      bg: 'bg-[#f5f3ff]', 
      color: 'text-[#6366f1]', 
      border: 'border-indigo-100/80',
      link: '/rules?tab=minutes',
      badge: 'MUFAKAT',
      badgeColor: 'bg-indigo-600'
    },
    { 
      label: 'Jasa Warga', 
      category: 'community' as ServiceCategory,
      icon: Wrench, 
      bg: 'bg-[#fffbeb]', 
      color: 'text-[#d97706]', 
      border: 'border-amber-100/80',
      action: onOpenSkills,
      badge: 'PRO',
      badgeColor: 'bg-amber-600'
    },
    { 
      label: 'Info PLN/Air', 
      category: 'security' as ServiceCategory,
      icon: Zap, 
      bg: 'bg-[#f0f9ff]', 
      color: 'text-[#0284c7]', 
      border: 'border-sky-100/80',
      action: onOpenOutage,
      badge: 'FASUM',
      badgeColor: 'bg-sky-600'
    },
    { 
      label: 'Lapor RT', 
      category: 'admin' as ServiceCategory,
      icon: AlertTriangle, 
      bg: 'bg-[#fff1f2]', 
      color: 'text-[#e11d48]', 
      border: 'border-rose-100/80',
      action: onOpenReport 
    },
    { 
      label: 'Kontak Darurat', 
      category: 'security' as ServiceCategory,
      icon: PhoneCall, 
      bg: 'bg-[#fef2f2]', 
      color: 'text-[#dc2626]', 
      border: 'border-rose-100/80',
      action: () => {
        toast.info(`Kontak Darurat ${currentTenant.name}`, {
          description: `Ketua RT: ${currentTenant.chairmanPhone || '+62 859-6119-4621'} | Bhabinkamtibmas: 110 | Pemadam: 113 | Ambulans: 118`
        });
      },
      badge: '24 JAM',
      badgeColor: 'bg-rose-600'
    },
    { 
      label: '5 Pilar STBM', 
      category: 'community' as ServiceCategory,
      icon: CheckSquare, 
      bg: 'bg-[#e8faf0]', 
      color: 'text-[#059669]', 
      border: 'border-emerald-100/80',
      link: '/health?tab=stbm',
      badge: '100% ODF',
      badgeColor: 'bg-emerald-600'
    }
  ], [currentTenant, onOpenReport, onOpenSkills, onOpenOutage]);

  const filteredQuickActions = useMemo(() => {
    if (activeCategory === 'all') return quickActions;
    return quickActions.filter(action => action.category === activeCategory);
  }, [quickActions, activeCategory]);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl md:rounded-[2.5rem] p-5 sm:p-7 md:p-8 shadow-xs relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
              PORTAL LAYANAN {currentTenant.rt ? `RT ${currentTenant.rt}` : 'WARGA'}
            </span>
          </div>
          <h3 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Layanan <span className="text-[#4f46e5]">Warga Terpadu</span>
          </h3>
          <p className="text-slate-400 font-medium text-xs md:text-sm mt-1 max-w-xl">
            Semua urusan administrasi, keamanan, gotong royong, dan usaha warga kini serba praktis dalam satu ketukan.
          </p>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'all' as ServiceCategory, label: 'Semua', count: quickActions.length },
            { id: 'admin' as ServiceCategory, label: 'Surat & Admin', count: quickActions.filter(a => a.category === 'admin').length },
            { id: 'security' as ServiceCategory, label: 'Keamanan & Fasum', count: quickActions.filter(a => a.category === 'security').length },
            { id: 'community' as ServiceCategory, label: 'Komunitas & UMKM', count: quickActions.filter(a => a.category === 'community').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === tab.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-black ${
                activeCategory === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-6 gap-x-2.5 sm:gap-x-4 md:gap-x-6 w-full max-w-6xl">
        {filteredQuickActions.map((action) => (
          <motion.button
            key={action.label}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            whileHover={{ y: -3, scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={action.action || (() => navigate(action.link!))}
            className="flex flex-col items-center justify-start text-center group cursor-pointer focus:outline-none relative self-start"
          >
            {action.badge && (
              <span className={`absolute -top-1 md:-top-1.5 right-[2%] sm:right-[10%] z-20 text-[7px] md:text-[8px] font-extrabold uppercase tracking-wider ${action.badgeColor || 'bg-rose-600'} text-white px-1.5 py-0.5 rounded-full shadow-2xs select-none`}>
                {action.badge}
              </span>
            )}

            <div className={`
              w-13 h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl
              ${action.bg} ${action.color} border ${action.border}
              flex items-center justify-center
              shadow-2xs group-hover:scale-105 group-hover:shadow-xs
              transition-all duration-200 relative overflow-hidden
            `}>
              <action.icon size={22} className="group-hover:scale-110 transition-transform duration-200 stroke-[2.2]" />
            </div>

            <span className="font-extrabold text-slate-700 text-[10px] sm:text-[11px] md:text-xs tracking-tight leading-snug mt-2 group-hover:text-indigo-600 transition-colors line-clamp-2 max-w-[80px] md:max-w-none">
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
