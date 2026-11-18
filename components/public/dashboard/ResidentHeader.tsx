import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Home, 
  CheckCircle, 
  Shield, 
  LogOut, 
  QrCode, 
  Droplets, 
  FileText, 
  AlertTriangle, 
  CreditCard, 
  CheckSquare, 
  Trophy, 
  History, 
  FileEdit 
} from 'lucide-react';
import { House, GuestReport, WaterMeterReading, STBMRecord } from '../../../types';
import { CivicScoreBadge } from '../../community/CivicScoreBadge';
import { DashboardActiveTab } from './types';

interface ResidentHeaderProps {
  currentHouse: House | undefined;
  selectedHouseId: string;
  greeting: { text: string; icon: any; color: string };
  handleLogout: () => void;
  setActiveTab: (tab: DashboardActiveTab) => void;
  setIsReportModalOpen: (open: boolean) => void;
  setIsIuranModalOpen: (open: boolean) => void;
  activeTab: DashboardActiveTab;
  currentWaterReading: WaterMeterReading | undefined;
  currentPoints: number;
  stbmRecord: STBMRecord | null;
  pendingLettersCount: number;
  guestReports: GuestReport[];
  activeReportsCount: number;
}

export const ResidentHeader: React.FC<ResidentHeaderProps> = ({
  currentHouse,
  selectedHouseId,
  greeting,
  handleLogout,
  setActiveTab,
  setIsReportModalOpen,
  setIsIuranModalOpen,
  activeTab,
  currentWaterReading,
  currentPoints,
  stbmRecord,
  pendingLettersCount,
  guestReports,
  activeReportsCount,
}) => {
  const GreetingIcon = greeting.icon;

  return (
    <>
      {/* Compact Civic Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800/80 p-4 sm:p-5 text-white shadow-lg mb-4">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start md:items-center gap-3.5">
            {/* Avatar Initials / Icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-base font-bold shadow-md border border-white/20 shrink-0">
              {currentHouse?.headOfFamily ? (
                currentHouse.headOfFamily.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
              ) : (
                <User size={22} />
              )}
            </div>

            <div className="space-y-1">
              {/* Contextual Greeting & Date */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${greeting.color}`}>
                  <GreetingIcon size={11} />
                  <span>{greeting.text}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Title & House Block */}
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {currentHouse?.headOfFamily ? currentHouse.headOfFamily : (selectedHouseId ? 'Warga RT 02' : 'Portal Layanan Warga')}
                </h2>
                {selectedHouseId && (
                  <span className="px-2.5 py-0.5 bg-white/10 rounded-lg text-xs font-bold font-mono tabular-nums text-indigo-200 border border-white/15">
                    Blok {currentHouse?.block}-{currentHouse?.number}
                  </span>
                )}
              </div>

              {/* Status Pills */}
              {selectedHouseId && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[10.5px] font-semibold">
                    <Home size={11} className="text-indigo-400" />
                    <span>{currentHouse?.residenceType || 'Tetap'}</span>
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10.5px] font-semibold ${
                    currentHouse?.isVerified 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  }`}>
                    <CheckCircle size={11} />
                    <span>{currentHouse?.isVerified ? 'KK Terverifikasi' : 'Perlu Verifikasi KK'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[10.5px] font-semibold">
                    <Shield size={11} className="text-sky-400" />
                    <span>{currentHouse?.rondaExempt ? 'Bebas Ronda' : 'Wajib Ronda'}</span>
                  </span>
                  {currentHouse && <CivicScoreBadge house={currentHouse} size="sm" showDetails={false} />}
                </div>
              )}
            </div>
          </div>

          {/* Sesi & Quick Modal Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-2.5 md:pt-0 border-t border-white/10 md:border-t-0">
            {selectedHouseId ? (
              <>
                <button
                  onClick={() => setIsIuranModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 transition-colors cursor-pointer"
                >
                  <CreditCard size={13} />
                  <span>Rincian Iuran</span>
                </button>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 transition-colors cursor-pointer"
                >
                  <AlertTriangle size={13} />
                  <span>Buat Aduan</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 border border-white/15 transition-colors cursor-pointer text-slate-300"
                  title="Keluar dari sesi warga"
                >
                  <LogOut size={13} />
                  <span>Keluar</span>
                </button>
              </>
            ) : (
              <button 
                onClick={() => setActiveTab('eid')}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
              >
                <QrCode size={14} /> Masuk Portal Warga (PIN)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs with Dynamic Badges */}
      <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 border border-slate-200/60 rounded-2xl mb-5 overflow-x-auto no-scrollbar">
        {[
          { id: 'eid', label: 'E-ID & Profil', shortLabel: 'E-ID', icon: QrCode, badge: null, badgeColor: '' },
          { 
            id: 'water', 
            label: 'Meter Air Mandiri', 
            shortLabel: 'Air Bersih', 
            icon: Droplets, 
            badge: currentWaterReading ? '✓ Tercatat' : 'Catat',
            badgeColor: currentWaterReading ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 '
          },
          { 
            id: 'points', 
            label: 'Poin & Teladan', 
            shortLabel: 'Poin', 
            icon: Trophy, 
            badge: `${currentPoints} Pts`,
            badgeColor: 'bg-amber-100 text-amber-900'
          },
          { 
            id: 'stbm', 
            label: 'Sanitasi (5 Pilar STBM)', 
            shortLabel: 'Sanitasi STBM', 
            icon: CheckSquare, 
            badge: stbmRecord?.needsFollowUp ? 'Perlu TL' : '100% ODF',
            badgeColor: stbmRecord?.needsFollowUp ? 'bg-rose-100 text-rose-800 ' : 'bg-emerald-100 text-emerald-800'
          },
          { 
            id: 'letters', 
            label: 'Status Surat', 
            shortLabel: 'Surat', 
            icon: FileText, 
            badge: pendingLettersCount > 0 ? `${pendingLettersCount}` : null,
            badgeColor: 'bg-indigo-600 text-white'
          },
          { 
            id: 'update', 
            label: 'Pembaruan Data KK', 
            shortLabel: 'Update KK', 
            icon: FileEdit, 
            badge: currentHouse?.isVerified ? '✓ Sah' : 'Update',
            badgeColor: currentHouse?.isVerified ? 'bg-slate-200/70 text-slate-700' : 'bg-amber-100 text-amber-800'
          },
          { 
            id: 'guests', 
            label: 'Log Tamu Menginap', 
            shortLabel: 'Tamu', 
            icon: History, 
            badge: guestReports.length > 0 ? `${guestReports.length}` : null,
            badgeColor: 'bg-slate-200 text-slate-700'
          },
          { 
            id: 'reports', 
            label: 'Aduan & Masalah', 
            shortLabel: 'Aduan', 
            icon: AlertTriangle, 
            badge: activeReportsCount > 0 ? `${activeReportsCount}` : null,
            badgeColor: 'bg-rose-600 text-white'
          }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                isSelected 
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40 font-semibold' 
                : 'text-slate-500 hover:text-slate-800 font-semibold'
              }`}
            >
              <tab.icon size={15} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
              <span className="hidden md:inline">{tab.label}</span>
              <span className="inline md:hidden">{tab.shortLabel}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-tight ${tab.badgeColor || 'bg-slate-200 text-slate-600'}`}>
                  {tab.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </>
  );
};
