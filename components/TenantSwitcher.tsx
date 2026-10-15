import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, ChevronDown, Check, Sparkles, MapPin, 
  ExternalLink, PlusCircle, ShieldCheck, ArrowRight, X 
} from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { motion, AnimatePresence } from 'motion/react';
import { TenantRegistrationModal } from './TenantRegistrationModal';

interface TenantSwitcherProps {
  variant?: 'public' | 'sidebar' | 'compact';
  className?: string;
}

export const TenantSwitcher: React.FC<TenantSwitcherProps> = ({ 
  variant = 'public',
  className = '' 
}) => {
  const { currentTenant, availableTenants, switchTenant } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
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

  return (
    <>
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        {/* Trigger Button */}
        {variant === 'sidebar' ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/90 hover:border-indigo-200 transition-all text-left group"
            title="Ganti Wilayah RT"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div 
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs font-black text-xs text-white"
                style={{ backgroundColor: currentTenant.themeColor || '#4f46e5' }}
              >
                {currentTenant.rt || 'RT'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-800 group-hover:text-indigo-600 truncate transition-colors">
                  {currentTenant.name}
                </p>
                <p className="text-[10px] text-slate-400 font-bold truncate">
                  {currentTenant.kelurahan}, {currentTenant.city}
                </p>
              </div>
            </div>
            <ChevronDown 
              size={14} 
              className={`text-slate-400 group-hover:text-indigo-600 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </button>
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-black ${
              currentTenant.isPilotDemo 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-2xs' 
                : 'bg-white hover:bg-indigo-50/80 text-slate-700 hover:text-indigo-700 border-slate-200/90 hover:border-indigo-200 shadow-2xs'
            }`}
            title="Klik untuk memilih wilayah RT/RW lain"
          >
            <span 
              className="w-2 h-2 rounded-full shrink-0 animate-pulse"
              style={{ backgroundColor: currentTenant.themeColor || '#2563EB' }}
            />
            <span className="tracking-tight">
              {currentTenant.rt ? `RT ${currentTenant.rt}` : currentTenant.name}
              <span className="font-semibold text-slate-400 ml-1">• {currentTenant.kelurahan}</span>
            </span>
            {currentTenant.isPilotDemo && (
              <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-200/60 text-emerald-900">
                Pilot
              </span>
            )}
            <ChevronDown 
              size={13} 
              className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
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

              {/* Master RW Link */}
              <div className="mt-2 pt-2 border-t border-slate-100">
                <a
                  href="#/master"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-left bg-indigo-50/60 hover:bg-indigo-50 text-indigo-700 transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-xs font-black">
                    <Building2 size={14} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span>Portal Master RW (Super Admin)</span>
                  </span>
                  <span className="text-[9px] font-black bg-indigo-200/80 text-indigo-900 px-1.5 py-0.5 rounded">
                    PIN
                  </span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Onboarding Dialog Modal */}
      <TenantRegistrationModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)} 
      />
    </>
  );
};
