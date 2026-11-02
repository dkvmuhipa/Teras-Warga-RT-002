import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
      border: 'border-indigo-100/90',
      link: '/resident' 
    },
    { 
      label: 'Buat Surat', 
      category: 'admin' as ServiceCategory,
      icon: FileText, 
      bg: 'bg-[#edf7ff]', 
      color: 'text-[#0284c7]', 
      border: 'border-sky-100/90',
      link: '/services' 
    },
    { 
      label: 'Lapor Tamu', 
      category: 'security' as ServiceCategory,
      icon: Shield, 
      bg: 'bg-[#fff4eb]', 
      color: 'text-[#ea580c]', 
      border: 'border-amber-100/90',
      link: '/services?tab=tamu',
      badge: 'Penting',
      badgeColor: 'bg-rose-500'
    },
    { 
      label: 'Lapor Sewa', 
      category: 'security' as ServiceCategory,
      icon: Building, 
      bg: 'bg-[#e8faf0]', 
      color: 'text-[#059669]', 
      border: 'border-emerald-100/90',
      link: '/services?tab=sewa',
      badge: '1x24 Jam',
      badgeColor: 'bg-emerald-600'
    },
    { 
      label: 'Daftar Warga', 
      category: 'admin' as ServiceCategory,
      icon: UserPlus, 
      bg: 'bg-[#f5f3ff]', 
      color: 'text-[#7c3aed]', 
      border: 'border-purple-100/90',
      link: '/register' 
    },
    { 
      label: 'Buku Saku', 
      category: 'admin' as ServiceCategory,
      icon: BookOpen, 
      bg: 'bg-[#f0f2fe]', 
      color: 'text-[#4f46e5]', 
      border: 'border-indigo-100/90',
      link: '/welcome',
      badge: 'Panduan',
      badgeColor: 'bg-indigo-600'
    },
    { 
      label: 'UMKM Warga', 
      category: 'community' as ServiceCategory,
      icon: ShoppingCart, 
      bg: 'bg-[#ecfdf5]', 
      color: 'text-[#059669]', 
      border: 'border-emerald-100/90',
      link: '/umkm',
      badge: 'Katalog',
      badgeColor: 'bg-emerald-600'
    },
    { 
      label: 'Warta RT', 
      category: 'community' as ServiceCategory,
      icon: Megaphone, 
      bg: 'bg-[#eff6ff]', 
      color: 'text-[#2563eb]', 
      border: 'border-blue-100/90',
      link: '/info' 
    },
    { 
      label: 'Peraturan RT', 
      category: 'admin' as ServiceCategory,
      icon: Scale, 
      bg: 'bg-[#f0fdf4]', 
      color: 'text-[#16a34a]', 
      border: 'border-emerald-100/90',
      link: '/rules',
      badge: '13 BAB',
      badgeColor: 'bg-emerald-600'
    },
    { 
      label: 'Jasa Warga', 
      category: 'community' as ServiceCategory,
      icon: Wrench, 
      bg: 'bg-[#fffbeb]', 
      color: 'text-[#d97706]', 
      border: 'border-amber-100/90',
      action: onOpenSkills
    },
    { 
      label: 'Siaga Utilitas', 
      category: 'security' as ServiceCategory,
      icon: Zap, 
      bg: 'bg-[#f0f9ff]', 
      color: 'text-[#0284c7]', 
      border: 'border-sky-100/90',
      action: onOpenOutage,
      badge: 'PLN/Air',
      badgeColor: 'bg-sky-600'
    },
    { 
      label: 'Lapor RT', 
      category: 'admin' as ServiceCategory,
      icon: AlertTriangle, 
      bg: 'bg-[#fff1f2]', 
      color: 'text-[#e11d48]', 
      border: 'border-rose-100/90',
      action: onOpenReport 
    },
    { 
      label: 'Kontak Darurat', 
      category: 'security' as ServiceCategory,
      icon: PhoneCall, 
      bg: 'bg-[#fef2f2]', 
      color: 'text-[#dc2626]', 
      border: 'border-rose-100/90',
      action: () => {
        toast.info(`Kontak Darurat ${currentTenant.name}`, {
          description: `Ketua RT: ${currentTenant.chairmanPhone || '+62 859-6119-4621'} | Bhabinkamtibmas: 110 | Pemadam: 113 | Ambulans: 118`
        });
      },
      badge: '24 Jam',
      badgeColor: 'bg-rose-600'
    },
    { 
      label: '5 Pilar STBM', 
      category: 'community' as ServiceCategory,
      icon: CheckSquare, 
      bg: 'bg-[#e8faf0]', 
      color: 'text-[#059669]', 
      border: 'border-emerald-100/90',
      link: '/kesehatan?tab=stbm',
      badge: 'Sanitasi',
      badgeColor: 'bg-emerald-600'
    }
  ], [currentTenant, onOpenReport, onOpenSkills, onOpenOutage]);

  const filteredQuickActions = useMemo(() => {
    if (activeCategory === 'all') return quickActions;
    return quickActions.filter(action => action.category === activeCategory);
  }, [quickActions, activeCategory]);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 md:p-8 shadow-xs relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              PORTAL LAYANAN {currentTenant.rt ? `RT ${currentTenant.rt}` : 'WARGA'}
            </span>
          </div>
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Layanan <span className="text-[#4f46e5]">Warga Terpadu</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl font-medium">
            Semua urusan administrasi, keamanan, gotong royong, dan usaha warga kini serba praktis dalam satu ketukan.
          </p>
        </div>

        {/* Category Filter Tabs */}
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === tab.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-full font-bold ${
                activeCategory === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout with Friendly Colors */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-y-5 gap-x-2.5 sm:gap-x-4 md:gap-x-5 w-full">
        {filteredQuickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => {
                if (action.action) action.action();
                else if (action.link) navigate(action.link);
              }}
              className="flex flex-col items-center justify-start text-center group cursor-pointer focus:outline-none relative self-start"
            >
              {action.badge && (
                <span className={`absolute -top-1.5 right-[5%] z-20 text-[8px] font-bold ${action.badgeColor || 'bg-indigo-600'} text-white px-1.5 py-0.5 rounded-full shadow-2xs select-none`}>
                  {action.badge}
                </span>
              )}

              <div className={`
                w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl
                ${action.bg} ${action.color} border ${action.border}
                flex items-center justify-center
                shadow-2xs group-hover:scale-105 group-hover:shadow-xs
                transition-all duration-200 relative overflow-hidden
              `}>
                <Icon size={22} className="stroke-[2.2]" />
              </div>

              <span className="font-bold text-slate-700 text-[10px] sm:text-[11px] md:text-xs tracking-tight leading-snug mt-1.5 sm:mt-2 group-hover:text-indigo-600 transition-colors line-clamp-2 max-w-[70px] sm:max-w-[80px] md:max-w-none">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
