import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Filter, Phone, MessageSquare, ShieldCheck, 
  ExternalLink, Edit3, CheckCircle2, UserCheck, Building2, 
  ArrowRight, Mail, ChevronRight, Copy
} from 'lucide-react';
import { Tenant } from '../../types';
import { toast } from 'sonner';

interface OfficialsDirectoryTabProps {
  tenants: Tenant[];
  onEditTenant: (tenant: Tenant) => void;
}

interface OfficialEntry {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantRt: string;
  tenantRw: string;
  kelurahan: string;
  roleTitle: 'Ketua RT' | 'Sekretaris' | 'Bendahara';
  name: string;
  phone: string;
  themeColor?: string;
  isVerified: boolean;
}

export const OfficialsDirectoryTab: React.FC<OfficialsDirectoryTabProps> = ({
  tenants,
  onEditTenant
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Ketua RT' | 'Sekretaris' | 'Bendahara'>('all');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Flatten officials list from all tenants
  const officialsList = useMemo(() => {
    const list: OfficialEntry[] = [];
    tenants.forEach(t => {
      // Chairman
      if (t.chairmanName) {
        list.push({
          id: `${t.id}-chairman`,
          tenantId: t.id,
          tenantName: t.name,
          tenantRt: t.rt,
          tenantRw: t.rw,
          kelurahan: t.kelurahan,
          roleTitle: 'Ketua RT',
          name: t.chairmanName,
          phone: t.chairmanPhone || '',
          themeColor: t.themeColor,
          isVerified: Boolean(t.chairmanPhone && t.chairmanPhone.length >= 10)
        });
      }
      // Secretary
      if (t.secretaryName) {
        list.push({
          id: `${t.id}-secretary`,
          tenantId: t.id,
          tenantName: t.name,
          tenantRt: t.rt,
          tenantRw: t.rw,
          kelurahan: t.kelurahan,
          roleTitle: 'Sekretaris',
          name: t.secretaryName,
          phone: t.chairmanPhone || '', // Fallback or RT desk
          themeColor: t.themeColor,
          isVerified: Boolean(t.secretaryName)
        });
      }
      // Treasurer
      if (t.treasurerName) {
        list.push({
          id: `${t.id}-treasurer`,
          tenantId: t.id,
          tenantName: t.name,
          tenantRt: t.rt,
          tenantRw: t.rw,
          kelurahan: t.kelurahan,
          roleTitle: 'Bendahara',
          name: t.treasurerName,
          phone: t.chairmanPhone || '',
          themeColor: t.themeColor,
          isVerified: Boolean(t.treasurerName)
        });
      }
    });
    return list;
  }, [tenants]);

  // Filtered officials
  const filteredOfficials = useMemo(() => {
    return officialsList.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.includes(searchQuery) ||
        item.kelurahan.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || item.roleTitle === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [officialsList, searchQuery, roleFilter]);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    toast.success(`Nomor ${phone} disalin`);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const getCleanPhoneForWhatsApp = (rawPhone: string) => {
    let clean = rawPhone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  };

  const openWhatsApp = (official: OfficialEntry) => {
    if (!official.phone) {
      toast.error('Nomor telepon belum diatur untuk pengurus ini');
      return;
    }
    const cleanPhone = getCleanPhoneForWhatsApp(official.phone);
    const text = encodeURIComponent(
      `Halo ${official.name} (${official.roleTitle} ${official.tenantName}), salam dari Tim Super Admin Platform Teras Warga. Mengenai koordinasi tata kelola platform di lingkungan Anda...`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // Metrics
  const totalOfficials = officialsList.length;
  const verifiedPhones = officialsList.filter(o => o.isVerified).length;
  const completeTenants = tenants.filter(t => t.chairmanName && t.secretaryName && t.treasurerName).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Total Pengurus Terdata
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
            {totalOfficials} <span className="text-xs font-bold text-slate-500 font-sans">Aparatur RT</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Tersebar di {tenants.length} wilayah armada Teras Warga
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Kontak WhatsApp Siap
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <MessageSquare size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight font-mono">
            {verifiedPhones} <span className="text-xs font-bold text-slate-500 font-sans">Nomor Aktif</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Dapat dihubungi langsung via API WhatsApp 1-Klik
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Struktur RT Lengkap
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-700 tracking-tight font-mono">
            {completeTenants} <span className="text-xs font-bold text-slate-500 font-sans">/ {tenants.length} RT</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Memiliki Ketua, Sekretaris, dan Bendahara lengkap
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Cari nama pengurus, telepon, atau RT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            {(['all', 'Ketua RT', 'Sekretaris', 'Bendahara'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === r
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'all' ? 'Semua Jabatan' : r}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Menampilkan <span className="font-bold text-slate-900">{filteredOfficials.length}</span> aparatur
        </div>
      </div>

      {/* Table of Officials */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Nama Pengurus</th>
                <th className="py-3.5 px-4">Jabatan</th>
                <th className="py-3.5 px-4">Wilayah RT / Lingkungan</th>
                <th className="py-3.5 px-4">Kontak WhatsApp</th>
                <th className="py-3.5 px-4 text-right">Aksi Koordinasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOfficials.map((item) => {
                const parentTenant = tenants.find(t => t.id === item.tenantId);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Official Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-2xs shrink-0"
                          style={{ backgroundColor: item.themeColor || '#4F46E5' }}
                        >
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-xs">
                            {item.name}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ID: {item.tenantId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role Title */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                        item.roleTitle === 'Ketua RT'
                          ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                          : item.roleTitle === 'Sekretaris'
                          ? 'bg-sky-50 border border-sky-200 text-sky-700'
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      }`}>
                        {item.roleTitle}
                      </span>
                    </td>

                    {/* Tenant Info */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">
                        {item.tenantName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Kel. {item.kelurahan} • RT {item.tenantRt}/RW {item.tenantRw}
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="py-3 px-4">
                      {item.phone ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700 font-bold">
                            {item.phone}
                          </span>
                          <button
                            onClick={() => handleCopyPhone(item.phone)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            title="Salin nomor"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Belum terdaftar
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.phone && (
                          <button
                            onClick={() => openWhatsApp(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-emerald-600/20 cursor-pointer"
                            title="Buka Chat WhatsApp"
                          >
                            <MessageSquare size={13} />
                            <span>WhatsApp</span>
                          </button>
                        )}
                        {parentTenant && (
                          <button
                            onClick={() => onEditTenant(parentTenant)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl transition-colors cursor-pointer border border-slate-200"
                            title="Edit Data Pengurus RT"
                          >
                            <Edit3 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOfficials.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <UserCheck className="mx-auto mb-2 text-slate-300" size={32} />
                    <p className="text-xs font-bold text-slate-600">Tidak ada pengurus yang cocok dengan pencarian</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Ubah kata kunci atau pilih jabatan lain.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
