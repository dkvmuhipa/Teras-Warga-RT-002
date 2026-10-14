import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Home, 
  CheckCircle, 
  Shield, 
  LogOut, 
  QrCode, 
  Vote, 
  Sparkles, 
  Droplets, 
  FileText, 
  AlertTriangle, 
  Users, 
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
  setIsVotingModalOpen: (open: boolean) => void;
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
  setIsVotingModalOpen,
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
      {/* Modern Civic Hero Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800/80 p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20 mb-6">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start md:items-center gap-4">
            {/* Avatar Initials / Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/25 border border-white/20 shrink-0">
              {currentHouse?.headOfFamily ? (
                currentHouse.headOfFamily.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
              ) : (
                <User size={28} />
              )}
            </div>

            <div className="space-y-1">
              {/* Contextual Greeting & Date */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${greeting.color}`}>
                  <GreetingIcon size={12} />
                  <span>{greeting.text}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Title & House Block */}
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {currentHouse?.headOfFamily ? currentHouse.headOfFamily : (selectedHouseId ? 'Warga RT 02' : 'Portal Layanan Warga')}
                </h2>
                {selectedHouseId && (
                  <span className="px-3 py-1 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl text-xs font-black uppercase tracking-widest text-indigo-200 border border-white/15">
                    Blok {currentHouse?.block}-{currentHouse?.number}
                  </span>
                )}
              </div>

              {/* Status Pills */}
              {selectedHouseId && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-semibold">
                    <Home size={12} className="text-indigo-400" />
                    <span>Status: <strong>{currentHouse?.residenceType || 'Tetap'}</strong></span>
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold ${
                    currentHouse?.isVerified 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  }`}>
                    <CheckCircle size={12} />
                    <span>{currentHouse?.isVerified ? 'Data KK Terverifikasi' : 'Perlu Verifikasi KK'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-semibold">
                    <Shield size={12} className="text-sky-400" />
                    <span>{currentHouse?.rondaExempt ? 'Bebas Ronda Siskamling' : 'Wajib Ronda Aktif'}</span>
                  </span>
                </div>
              )}

              {currentHouse && (
                <div className="pt-1">
                  <CivicScoreBadge house={currentHouse} size="sm" />
                </div>
              )}
            </div>
          </div>

          {/* Sesi Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end pt-2 md:pt-0 border-t border-white/10 md:border-t-0">
            {selectedHouseId ? (
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 border border-white/15 transition-all cursor-pointer text-slate-300"
                title="Keluar dari sesi warga"
              >
                <LogOut size={14} /> <span>Keluar Sesi</span>
              </button>
            ) : (
              <button 
                onClick={() => setActiveTab('eid')}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <QrCode size={14} /> Masuk Portal Warga (PIN)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Command Hub */}
      {selectedHouseId && (
        <div className="mb-4 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-4 rounded-3xl border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-400/30">
              <Vote size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-500 text-white">E-Voting RT 02</span>
                <span className="text-xs font-bold text-white">1 KK = 1 Hak Suara Sah</span>
              </div>
              <p className="text-[11px] text-indigo-200 mt-0.5">Musyawarah digital penentuan keputusan lingkungan Huntap Tondo 2.</p>
            </div>
          </div>
          <button
            onClick={() => setIsVotingModalOpen(true)}
            className="px-4 py-2 bg-white text-indigo-950 font-black rounded-xl text-xs uppercase tracking-wider hover:bg-indigo-50 transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Buka Bilik Suara →
          </button>
        </div>
      )}

      {selectedHouseId && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3.5 px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-600" /> Pintasan Aksi Cepat Warga
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Layanan mandiri instan</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {/* Water Meter */}
            <button
              onClick={() => setActiveTab('water')}
              className="p-4 rounded-3xl bg-[#edf7ff] hover:bg-[#e0f2fe] border border-sky-100/80 hover:border-sky-300 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#0284c7] flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-110 transition-transform">
                <Droplets size={19} className="stroke-[2.5]" />
              </div>
              <p className="text-xs font-extrabold text-slate-900 tracking-tight">Catat Meter</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Air Mandiri m³</p>
            </button>

            {/* Surat Pengantar */}
            <button
              onClick={() => setActiveTab('letters')}
              className="p-4 rounded-3xl bg-[#f0f2fe] hover:bg-[#e0e7ff] border border-indigo-100/80 hover:border-indigo-300 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#4f46e5] flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-110 transition-transform">
                <FileText size={19} className="stroke-[2.5]" />
              </div>
              <p className="text-xs font-extrabold text-slate-900 tracking-tight">Surat Pengantar</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Permohonan RT</p>
            </button>

            {/* Lapor Aduan */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="p-4 rounded-3xl bg-[#fff1f2] hover:bg-[#ffe4e6] border border-rose-100/80 hover:border-rose-300 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#e11d48] flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-110 transition-transform">
                <AlertTriangle size={19} className="stroke-[2.5]" />
              </div>
              <p className="text-xs font-extrabold text-slate-900 tracking-tight">Lapor Aduan</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Fasilitas/Warga</p>
            </button>

            {/* Lapor Tamu */}
            <button
              onClick={() => setActiveTab('guests')}
              className="p-4 rounded-3xl bg-[#fff4eb] hover:bg-[#ffedd5] border border-amber-100/80 hover:border-amber-300 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#ea580c] flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-110 transition-transform">
                <Users size={19} className="stroke-[2.5]" />
              </div>
              <p className="text-xs font-extrabold text-slate-900 tracking-tight">Lapor Tamu</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Wajib 1x24 Jam</p>
            </button>

            {/* Rincian Iuran */}
            <button
              onClick={() => setIsIuranModalOpen(true)}
              className="p-4 rounded-3xl bg-[#e8faf0] hover:bg-[#dcfce7] border border-emerald-100/80 hover:border-emerald-300 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#059669] flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-110 transition-transform">
                <CreditCard size={19} className="stroke-[2.5]" />
              </div>
              <p className="text-xs font-extrabold text-slate-900 tracking-tight">Rincian Iuran</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Sampah & Air RT</p>
            </button>

            {/* Kartu E-ID */}
            <button
              onClick={() => setActiveTab('eid')}
              className="p-4 rounded-3xl bg-[#f5f3ff] hover:bg-[#ede9fe] border border-purple-100/80 hover:border-purple-300 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#7c3aed] flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-110 transition-transform">
                <QrCode size={19} className="stroke-[2.5]" />
              </div>
              <p className="text-xs font-extrabold text-slate-900 tracking-tight">Kartu E-ID</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Cetak & Unduh</p>
            </button>

            {/* 5 Pilar STBM */}
            <button
              onClick={() => setActiveTab('stbm')}
              className="p-4 rounded-3xl bg-[#e8faf0] hover:bg-[#dcfce7] border border-emerald-100/80 hover:border-emerald-300 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#059669] flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-110 transition-transform">
                <CheckSquare size={19} className="stroke-[2.5]" />
              </div>
              <p className="text-xs font-extrabold text-slate-900 tracking-tight">5 Pilar STBM</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Sanitasi & ODF</p>
            </button>
          </div>
        </div>
      )}

      {/* Tabs with Dynamic Badges */}
      <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 border border-slate-200/60 rounded-3xl mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'eid', label: 'E-ID & Profil', shortLabel: 'E-ID', icon: QrCode, badge: null, badgeColor: '' },
          { 
            id: 'water', 
            label: 'Meter Air Mandiri', 
            shortLabel: 'Air Bersih', 
            icon: Droplets, 
            badge: currentWaterReading ? '✓ Tercatat' : 'Catat',
            badgeColor: currentWaterReading ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
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
            badgeColor: stbmRecord?.needsFollowUp ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
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
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isSelected 
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40 font-black' 
                : 'text-slate-500 hover:text-slate-800 font-semibold'
              }`}
            >
              <tab.icon size={15} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
              <span className="hidden md:inline">{tab.label}</span>
              <span className="inline md:hidden">{tab.shortLabel}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${tab.badgeColor || 'bg-slate-200 text-slate-600'}`}>
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
