import React, { useState, useMemo } from 'react';
import { 
  Building2, Users, Home, TrendingUp, ShieldCheck, 
  Phone, ArrowRight, ExternalLink, Sparkles, Filter, 
  Share2, Printer, MapPin, CheckCircle2, AlertCircle, 
  Plus, MessageSquare, Award, Droplets, Wallet, Layers, Shield
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Tenant, House } from '../../types';
import { Button } from '../ui/Button';
import { TenantRegistrationModal } from '../TenantRegistrationModal';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface RWAggregationDashboardProps {
  houses?: House[];
  onSwitchToTenant?: (tenantId: string) => void;
}

export const RWAggregationDashboard: React.FC<RWAggregationDashboardProps> = ({
  houses = [],
  onSwitchToTenant
}) => {
  const { currentTenant, availableTenants, switchTenant } = useTenant();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedRwFilter, setSelectedRwFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract distinct RWs
  const availableRws = useMemo(() => {
    const set = new Set<string>();
    availableTenants.forEach(t => {
      if (t.rw) set.add(t.rw);
    });
    return Array.from(set).sort();
  }, [availableTenants]);

  // Filtered tenants by selected RW and search
  const filteredTenants = useMemo(() => {
    return availableTenants.filter(t => {
      const matchRw = selectedRwFilter === 'all' || t.rw === selectedRwFilter;
      const matchSearch = !searchQuery || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.kelurahan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.chairmanName && t.chairmanName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchRw && matchSearch;
    });
  }, [availableTenants, selectedRwFilter, searchQuery]);

  // Aggregated Stats
  const stats = useMemo(() => {
    const totalTenants = filteredTenants.length;
    let totalBlocks = 0;
    let estimatedUnits = 0;

    filteredTenants.forEach(t => {
      totalBlocks += (t.blocks ? t.blocks.length : 0);
      if (t.blockConfig && t.blockConfig.length > 0) {
        t.blockConfig.forEach(bc => {
          estimatedUnits += Math.max(1, (bc.end - bc.start + 1));
        });
      } else {
        estimatedUnits += (t.blocks ? t.blocks.length * 20 : 0);
      }
    });

    return {
      totalTenants,
      totalBlocks,
      estimatedUnits,
      activeRw: currentTenant.rw || '020',
      activeKelurahan: currentTenant.kelurahan || 'Tondo',
      activeKota: currentTenant.city || 'Kota Palu'
    };
  }, [filteredTenants, currentTenant]);

  const handleQuickSwitch = (tenant: Tenant) => {
    if (onSwitchToTenant) {
      onSwitchToTenant(tenant.id);
    } else {
      switchTenant(tenant.id);
    }
  };

  const handleBroadcastCoordination = () => {
    const contacts = filteredTenants
      .filter(t => t.chairmanPhone)
      .map(t => `• ${t.name}: ${t.chairmanName} (${t.chairmanPhone})`)
      .join('\n');

    const message = `📢 *PEMBERITAHUAN KOORDINASI TINGKAT RW ${stats.activeRw}*\nKelurahan ${stats.activeKelurahan}, ${stats.activeKota}\n\nKepada Yth. Seluruh Ketua RT se-RW ${stats.activeRw}:\n\nDaftar Kontak Pengurus Terdaftar:\n${contacts}\n\nMari senantiasa menjaga ketertiban, kebersihan lingkungan, dan pemutakhiran data kependudukan warga melalui portal Teras Warga. Terima kasih.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(message);
      toast.success("Teks Koordinasi Disalin!", {
        description: "Format pesan koordinasi RW telah disalin ke clipboard dan siap dikirim via WhatsApp."
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ================= HEADER KELURAHAN / RW ================= */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-900/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider text-indigo-200 border border-white/15">
              <Building2 size={13} className="text-indigo-300" />
              <span>Dashboard Agregasi Wilayah &amp; Koordinator RW</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Rukun Warga {stats.activeRw} • Kel. {stats.activeKelurahan}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Pusat kendali dan rekapitulasi data gabungan antar-Rukun Tetangga (Multi-Tenant Hub) untuk memantau sensus kependudukan, ketertiban kavling, dan koordinasi pengurus wilayah {stats.activeKota}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={handleBroadcastCoordination}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <Share2 size={14} />
              <span>Salin Edaran RW</span>
            </button>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Plus size={15} />
              <span>+ Daftarkan RT Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= SUMMARY STATS CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total RT */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Wilayah</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Building2 size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalTenants} RT</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Terdaftar dalam platform</p>
          </div>
        </div>

        {/* Card 2: Total Blok */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Blok Kavling</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Layers size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalBlocks} Blok</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Seluruh lorong/gang terdata</p>
          </div>
        </div>

        {/* Card 3: Estimasi Hunian */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimasi Kapasitas</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Home size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">~{stats.estimatedUnits} Unit</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Potensi kavling perumahan</p>
          </div>
        </div>

        {/* Card 4: Status Keamanan & Isolasi */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Isolasi Data</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600">100% Aman</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Scoped logical partition</p>
          </div>
        </div>
      </div>

      {/* ================= CONTROLS & SEARCH BAR ================= */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-slate-400 shrink-0 ml-1" />
          <span className="text-xs font-bold text-slate-500 shrink-0">Filter RW:</span>
          <select
            value={selectedRwFilter}
            onChange={e => setSelectedRwFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Semua RW ({availableTenants.length} RT)</option>
            {availableRws.map(rw => (
              <option key={rw} value={rw}>RW {rw}</option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-72">
          <input 
            type="text"
            placeholder="Cari RT, Kelurahan, nama Ketua RT..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>
      </div>

      {/* ================= LIST OF RTS (TENANTS GRID) ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Daftar Rukun Tetangga di Bawah Naungan Wilayah ({filteredTenants.length})</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-bold">
            Klik kartu untuk beralih atau memantau RT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map(tenant => {
            const isCurrent = tenant.id === currentTenant.id;
            return (
              <div 
                key={tenant.id}
                className={`bg-white rounded-3xl p-5 border transition-all hover:shadow-lg relative overflow-hidden flex flex-col justify-between ${
                  isCurrent 
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md shadow-indigo-500/10' 
                    : 'border-slate-200/80 hover:border-indigo-300'
                }`}
              >
                {/* Accent strip */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: tenant.themeColor || '#4F46E5' }}
                />

                <div className="space-y-3.5 pt-1">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span 
                      className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white shadow-2xs"
                      style={{ backgroundColor: tenant.themeColor || '#4F46E5' }}
                    >
                      RT {tenant.rt}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          <span>Aktif Terbuka</span>
                        </span>
                      )}
                      {tenant.isPilotDemo ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase tracking-wider">
                          Pilot Demo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-black uppercase tracking-wider">
                          Utama
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Location */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                      {tenant.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{tenant.kelurahan}, {tenant.kecamatan}, {tenant.city}</span>
                    </p>
                  </div>

                  {/* Details Card */}
                  <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Ketua RT:</span>
                      <span className="font-black text-slate-800 truncate max-w-[170px]">{tenant.chairmanName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Kavling:</span>
                      <span className="font-black text-indigo-700">{tenant.blocks.join(', ')} ({tenant.blocks.length} Blok)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Tarif Sampah:</span>
                      <span className="font-bold text-slate-800">Rp {(tenant.fees?.sampahUmum || 20000).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Iuran Kas:</span>
                      <span className="font-bold text-slate-800">Rp {(tenant.fees?.kasFee || 20000).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleQuickSwitch(tenant)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 active:scale-95'
                    }`}
                  >
                    <span>{isCurrent ? 'Sedang Dibuka' : 'Beralih ke RT Ini'}</span>
                    <ArrowRight size={13} />
                  </button>

                  {tenant.chairmanPhone && (
                    <a
                      href={`https://wa.me/${tenant.chairmanPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Hubungi Ketua RT via WhatsApp"
                      className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                    >
                      <Phone size={15} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODAL ONBOARDING ================= */}
      <TenantRegistrationModal 
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />
    </div>
  );
};
