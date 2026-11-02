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
      link: '/resident' 
    },
    { 
      label: 'Buat Surat', 
      category: 'admin' as ServiceCategory,
      icon: FileText, 
      link: '/services' 
    },
    { 
      label: 'Lapor Tamu', 
      category: 'security' as ServiceCategory,
      icon: Shield, 
      link: '/services?tab=tamu',
      badge: 'Wajib'
    },
    { 
      label: 'Lapor Sewa', 
      category: 'security' as ServiceCategory,
      icon: Building, 
      link: '/services?tab=sewa'
    },
    { 
      label: 'Daftar Warga', 
      category: 'admin' as ServiceCategory,
      icon: UserPlus, 
      link: '/register' 
    },
    { 
      label: 'Buku Saku', 
      category: 'admin' as ServiceCategory,
      icon: BookOpen, 
      link: '/welcome'
    },
    { 
      label: 'UMKM Warga', 
      category: 'community' as ServiceCategory,
      icon: ShoppingCart, 
      link: '/umkm'
    },
    { 
      label: 'Warta RT', 
      category: 'community' as ServiceCategory,
      icon: Megaphone, 
      link: '/info' 
    },
    { 
      label: 'Aturan RT', 
      category: 'admin' as ServiceCategory,
      icon: Scale, 
      link: '/rules' 
    },
    { 
      label: 'Keahlian Warga', 
      category: 'community' as ServiceCategory,
      icon: Wrench, 
      action: onOpenSkills
    },
    { 
      label: 'Siaga Utilitas', 
      category: 'security' as ServiceCategory,
      icon: Zap, 
      action: onOpenOutage
    },
    { 
      label: 'Lapor RT', 
      category: 'admin' as ServiceCategory,
      icon: AlertTriangle, 
      action: onOpenReport 
    },
    { 
      label: 'Kontak Darurat', 
      category: 'security' as ServiceCategory,
      icon: PhoneCall, 
      action: () => {
        toast.info(`Kontak Darurat ${currentTenant.name}`, {
          description: `Ketua RT: ${currentTenant.chairmanPhone || '+62 859-6119-4621'} | Bhabinkamtibmas: 110 | Pemadam: 113 | Ambulans: 118`
        });
      },
      badge: '24 Jam'
    },
    { 
      label: '5 Pilar STBM', 
      category: 'community' as ServiceCategory,
      icon: CheckSquare, 
      link: '/kesehatan?tab=stbm'
    }
  ], [currentTenant, onOpenReport, onOpenSkills, onOpenOutage]);

  const filteredQuickActions = useMemo(() => {
    if (activeCategory === 'all') return quickActions;
    return quickActions.filter(action => action.category === activeCategory);
  }, [quickActions, activeCategory]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 md:p-8 shadow-xs relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs font-medium text-slate-500">
              Layanan Terpadu {currentTenant.rt ? `RT ${currentTenant.rt}` : 'Warga'}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">
            Menu Layanan Mandiri
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl font-normal">
            Akses cepat administrasi kependudukan, permohonan surat, pelaporan tamu, dan informasi lingkungan.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'all' as ServiceCategory, label: 'Semua', count: quickActions.length },
            { id: 'admin' as ServiceCategory, label: 'Surat & Admin', count: quickActions.filter(a => a.category === 'admin').length },
            { id: 'security' as ServiceCategory, label: 'Keamanan & Fasum', count: quickActions.filter(a => a.category === 'security').length },
            { id: 'community' as ServiceCategory, label: 'Komunitas & UMKM', count: quickActions.filter(a => a.category === 'community').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                activeCategory === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2.5 sm:gap-3.5 w-full">
        {filteredQuickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => {
                if (action.action) action.action();
                else if (action.link) navigate(action.link);
              }}
              className="bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 text-center transition-colors group cursor-pointer relative min-h-[96px]"
            >
              {action.badge && (
                <span className="absolute top-2 right-2 text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-300/60 leading-none">
                  {action.badge}
                </span>
              )}
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-slate-700 group-hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs">
                <Icon size={18} strokeWidth={1.75} />
              </div>
              <span className="text-[11px] font-medium text-slate-800 group-hover:text-slate-900 leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
