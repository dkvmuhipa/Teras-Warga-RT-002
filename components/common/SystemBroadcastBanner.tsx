import React, { useState, useEffect } from 'react';
import { 
  Megaphone, AlertTriangle, AlertCircle, Info, Wrench, X, 
  ExternalLink, ChevronDown, ChevronUp, BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SystemBroadcast } from '../../types';
import { subscribeToSystemBroadcasts } from '../../services/databaseService';
import { matchesTenant } from '../../services/tenantService';

interface SystemBroadcastBannerProps {
  currentTenantId?: string;
}

const DISMISSED_STORAGE_KEY = 'teras_dismissed_broadcasts';

export const SystemBroadcastBanner: React.FC<SystemBroadcastBannerProps> = ({
  currentTenantId
}) => {
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem(DISMISSED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsub = subscribeToSystemBroadcasts((items) => {
      setBroadcasts(items);
    });
    return () => unsub();
  }, []);

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Find active broadcasts matching tenant or 'all', excluding dismissed ones
  const activeMatchingBroadcasts = broadcasts.filter(b => {
    if (!b.isActive) return false;
    if (dismissedIds.includes(b.id)) return false;
    if (b.targetTenantId === 'all') return true;
    if (!currentTenantId) return true;
    return matchesTenant(b.targetTenantId, currentTenantId);
  });

  if (activeMatchingBroadcasts.length === 0) return null;

  // Primary active broadcast (highest priority or newest)
  const primary = activeMatchingBroadcasts[0];

  const priorityStyles = {
    urgent: {
      bg: 'bg-rose-600',
      text: 'text-white',
      border: 'border-rose-700',
      badge: 'bg-rose-950/40 text-white border-rose-400',
      icon: AlertTriangle,
      label: 'DARURAT PLATFORM'
    },
    warning: {
      bg: 'bg-amber-500',
      text: 'text-slate-950',
      border: 'border-amber-600',
      badge: 'bg-amber-950/20 text-slate-950 border-amber-600',
      icon: AlertCircle,
      label: 'PERINGATAN PENTING'
    },
    maintenance: {
      bg: 'bg-indigo-600',
      text: 'text-white',
      border: 'border-indigo-700',
      badge: 'bg-indigo-950/40 text-white border-indigo-400',
      icon: Wrench,
      label: 'PEMELIHARAAN SISTEM'
    },
    info: {
      bg: 'bg-slate-900',
      text: 'text-white',
      border: 'border-slate-800',
      badge: 'bg-slate-800 text-sky-300 border-slate-700',
      icon: Megaphone,
      label: 'PENGUMUMAN PUSAT'
    }
  };

  const currentStyle = priorityStyles[primary.priority] || priorityStyles.info;
  const IconComponent = currentStyle.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`${currentStyle.bg} ${currentStyle.text} border-b ${currentStyle.border} shadow-sm z-[98] sticky top-0 font-sans transition-colors`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left Column: Icon + Badge + Message */}
          <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <IconComponent size={14} className="animate-pulse" />
            </div>

            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider border ${currentStyle.badge}`}>
              {currentStyle.label}
            </span>

            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-bold underline decoration-white/40">
                {primary.title}
              </span>
              <span className="hidden sm:inline text-white/60">•</span>
              <span className={`text-[11px] leading-snug line-clamp-1 ${isExpanded ? 'line-clamp-none' : ''}`}>
                {primary.message}
              </span>
            </div>
          </div>

          {/* Right Column: Actions (Expand Details & Dismiss) */}
          <div className="flex items-center gap-2 shrink-0">
            {activeMatchingBroadcasts.length > 1 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/15 font-bold">
                +{activeMatchingBroadcasts.length - 1} Siaran Lainnya
              </span>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
              title={isExpanded ? 'Ringkas pesan' : 'Baca selengkapnya'}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <button
              onClick={() => handleDismiss(primary.id)}
              className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Tutup pemberitahuan ini"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Expanded View for long messages */}
        {isExpanded && (
          <div className="max-w-7xl mx-auto px-4 pb-3 pt-1 border-t border-white/10 text-xs">
            <p className="text-white/90 leading-relaxed font-normal whitespace-pre-line bg-black/10 p-3 rounded-xl">
              {primary.message}
            </p>
            <div className="mt-2 flex items-center justify-between text-[10px] text-white/70 font-mono">
              <span>Diterbitkan: {primary.createdAt}</span>
              <span>Target: {primary.targetTenantId === 'all' ? 'Seluruh Wilayah RT Kota Palu' : `Khusus RT ${primary.targetTenantId}`}</span>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
