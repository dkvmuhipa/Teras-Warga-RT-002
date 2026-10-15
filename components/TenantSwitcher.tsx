import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, ChevronDown, Check, Sparkles, MapPin, 
  ExternalLink, ShieldCheck, ArrowRight, X 
} from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { motion, AnimatePresence } from 'motion/react';

interface TenantSwitcherProps {
  variant?: 'public' | 'sidebar' | 'compact';
  className?: string;
}

export const TenantSwitcher: React.FC<TenantSwitcherProps> = ({ 
  variant = 'public',
  className = '' 
}) => {
  const { currentTenant, availableTenants, switchTenant, isSuperAdmin } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTenant = (idOrSlug: string) => {
    switchTenant(idOrSlug);
    setIsOpen(false);
  };

  // Strict Tenant Isolation: Only Super Admin can view or switch between tenants.
  // Regular residents & admins see only their active RT badge without any dropdown.
  const canSwitch = isSuperAdmin && availableTenants.length > 1;

  if (!canSwitch) {
    if (variant === 'sidebar') {
      return (
        <div className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-left ${className}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div 
              className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs font-black text-xs text-white"
              style={{ backgroundColor: currentTenant.themeColor || '#4f46e5' }}
            >
              {currentTenant.rt || 'RT'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-800 truncate">
                {currentTenant.name}
              </p>
              <p className="text-[10px] text-slate-400 font-bold truncate">
                {currentTenant.kelurahan}, {currentTenant.city}
              </p>
            </div>
          </div>
          <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded shrink-0">
            RT Aktif
          </span>
        </div>
      );
    }

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200/90 bg-white text-slate-700 shadow-2xs text-xs font-black select-none ${className}`}>
        <span 
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: currentTenant.themeColor || '#2563EB' }}
        />
        <span className="tracking-tight">
          {currentTenant.rt ? `RT ${currentTenant.rt}` : currentTenant.name}
          <span className="font-semibold text-slate-400 ml-1">• {currentTenant.kelurahan}</span>
        </span>
      </div>
    );
  }

  return (
    <>
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        {/* Trigger Button (Super Admin Only) */}
        {variant === 'sidebar' ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200/90 transition-all text-left group cursor-pointer"
            title="Super Admin Multi-Tenant Switcher"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div 
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs font-black text-xs text-white"
                style={{ backgroundColor: currentTenant.themeColor || '#4f46e5' }}
              >
                {currentTenant.rt || 'RT'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-purple-950 group-hover:text-purple-700 truncate transition-colors">
                  {currentTenant.name}
                </p>
                <p className="text-[10px] text-purple-600/80 font-bold truncate">
                  {currentTenant.kelurahan} • Super Admin Switch
                </p>
              </div>
            </div>
            <ChevronDown 
              size={14} 
              className={`text-purple-600 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </button>
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 shadow-2xs text-xs font-black cursor-pointer transition-all"
            title="Super Admin: Beralih Tenant"
          >
            <span 
              className="w-2 h-2 rounded-full shrink-0 animate-pulse"
              style={{ backgroundColor: currentTenant.themeColor || '#2563EB' }}
            />
            <span className="tracking-tight">
              {currentTenant.rt ? `RT ${currentTenant.rt}` : currentTenant.name}
              <span className="font-semibold text-purple-600 ml-1">• {currentTenant.kelurahan}</span>
            </span>
            <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-purple-200/80 text-purple-950">
              Fleet
            </span>
            <ChevronDown 
              size={13} 
              className={`text-purple-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </button>
        )}

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`absolute top-full mt-2 w-72 sm:w-80 bg-white/98 backdrop-blur-2xl border border-slate-200/90 rounded-2xl shadow-2xl p-2.5 z-50 overflow-hidden ${
                variant === 'sidebar' ? 'left-0' : 'left-0 sm:left-auto sm:right-0'
              }`}
            >
              <div className="px-2.5 py-2 border-b border-slate-100 mb-1.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Pilih Komunitas RT / RW</span>
                  <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">Multi-Tenant</span>
                </p>
              </div>

              <div className="space-y-1">
                {availableTenants.map((t) => {
                  const isSelected = t.id === currentTenant.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTenant(t.slug || t.id)}
                      className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all group ${
                        isSelected 
                          ? 'bg-indigo-50/90 text-indigo-900 border border-indigo-200/80 shadow-2xs' 
                          : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs font-black text-xs text-white mt-0.5"
                        style={{ backgroundColor: t.themeColor || '#4f46e5' }}
                      >
                        {t.rt}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs font-black tracking-tight ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {t.name}
                          </p>
                          {isSelected && (
                            <span className="p-0.5 rounded-full bg-indigo-600 text-white shrink-0">
                              <Check size={11} className="stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5 truncate">
                          {t.address}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-bold">
                            {t.blocks.length} Blok ({t.blocks[0]} - {t.blocks[t.blocks.length - 1]})
                          </span>
                          {t.isPilotDemo ? (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                              Pilot Demo
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                              Utama
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 px-1">
                <a
                  href="#/superadmin"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-black transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    <span>Super Admin Control Tower</span>
                  </span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
