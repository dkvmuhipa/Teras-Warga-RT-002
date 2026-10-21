import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Filter, Phone, MessageSquare, ShieldCheck, 
  ExternalLink, Edit3, CheckCircle2, UserCheck, Building2, 
  ArrowRight, Mail, ChevronRight, Copy, Home, Shield, Award, Key
} from 'lucide-react';
import { Tenant, Official } from '../../types';
import { matchesTenant } from '../../services/tenantService';
import { CreateOfficialAccountModal, OfficialAccountTarget } from './CreateOfficialAccountModal';
import { toast } from 'sonner';

interface OfficialsDirectoryTabProps {
  tenants: Tenant[];
  officials?: Official[];
  onEditTenant: (tenant: Tenant) => void;
}

interface OfficialEntry {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantRt: string;
  tenantRw: string;
  kelurahan: string;
  roleTitle: string;
  name: string;
  phone: string;
  houseId?: string;
  email?: string;
  photo?: string;
  themeColor?: string;
  isVerified: boolean;
  termStart?: string;
  termEnd?: string;
  duties?: string[];
  isCoreLeadership?: boolean;
}

export const OfficialsDirectoryTab: React.FC<OfficialsDirectoryTabProps> = ({
  tenants,
  officials = [],
  onEditTenant
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Ketua RT' | 'Sekretaris' | 'Bendahara' | 'seksi'>('all');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [accountTarget, setAccountTarget] = useState<OfficialAccountTarget | null>(null);

  // Flatten officials list from all tenants + live Firestore officials collection
  const officialsList = useMemo(() => {
    const list: OfficialEntry[] = [];
    const seenNames = new Set<string>();

    const normalizeName = (name: string) => {
      return name
        .toLowerCase()
        .replace(/^(bpk\.|bapak|ibu|sdr\.|sdri\.)\s*/i, '')
        .trim();
    };

    const isPlaceholder = (name: string) => {
      const lower = name.toLowerCase().trim();
      return (
        lower === 'sekretaris rt 002' ||
        lower === 'bendahara rt 002' ||
        lower === 'sekretaris rt' ||
        lower === 'bendahara rt' ||
        lower === 'ketua rt' ||
        lower === 'pengurus rt' ||
        lower.startsWith('sekretaris rt') ||
        lower.startsWith('bendahara rt') ||
        lower === 'belum ada' ||
        lower === 'belum ditentukan' ||
        lower === '-'
      );
    };

    tenants.forEach(t => {
      const matchedOfficials = officials.filter(o => matchesTenant(o.tenantId, t.id));

      // 1. Process all LIVE officials from Firestore first (this is the single source of truth!)
      matchedOfficials.forEach(o => {
        if (!o.name || isPlaceholder(o.name)) return;
        const norm = normalizeName(o.name);
        const key = `${t.id}-${norm}`;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          const roleLower = (o.role || '').toLowerCase();
          const isCore = roleLower.includes('ketua') || roleLower.includes('sekretaris') || roleLower.includes('bendahara');
          list.push({
            id: o.id || `${t.id}-off-${norm}`,
            tenantId: t.id,
            tenantName: t.name,
            tenantRt: t.rt,
            tenantRw: t.rw,
            kelurahan: t.kelurahan,
            roleTitle: o.role || 'Seksi RT',
            name: o.name,
            phone: o.phone || '',
            email: o.email || '',
            houseId: o.houseId,
            photo: o.photo,
            themeColor: t.themeColor,
            isVerified: Boolean(o.phone && o.phone.replace(/[^0-9]/g, '').length >= 10),
            termStart: o.termStart,
            termEnd: o.termEnd,
            duties: o.duties,
            isCoreLeadership: isCore
          });
        }
      });

      // 2. Fallback for Chairman only if not already present in live officials
      const hasChairmanInLive = list.some(
        item => matchesTenant(item.tenantId, t.id) && item.roleTitle.toLowerCase().includes('ketua')
      );
      if (!hasChairmanInLive && t.chairmanName && !isPlaceholder(t.chairmanName)) {
        const norm = normalizeName(t.chairmanName);
        const key = `${t.id}-${norm}`;
        if (!seenNames.has(key)) {
          seenNames.add(key);
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
            isVerified: Boolean(t.chairmanPhone && t.chairmanPhone.replace(/[^0-9]/g, '').length >= 10),
            isCoreLeadership: true
          });
        }
      }

      // 3. Fallback for Secretary only if not already present in live officials AND is not a placeholder
      const hasSecretaryInLive = list.some(
        item => matchesTenant(item.tenantId, t.id) && item.roleTitle.toLowerCase().includes('sekretaris')
      );
      if (!hasSecretaryInLive && t.secretaryName && !isPlaceholder(t.secretaryName)) {
        const norm = normalizeName(t.secretaryName);
        const key = `${t.id}-${norm}`;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          list.push({
            id: `${t.id}-secretary`,
            tenantId: t.id,
            tenantName: t.name,
            tenantRt: t.rt,
            tenantRw: t.rw,
            kelurahan: t.kelurahan,
            roleTitle: 'Sekretaris',
            name: t.secretaryName,
            phone: '',
            themeColor: t.themeColor,
            isVerified: false,
            isCoreLeadership: true
          });
        }
      }

      // 4. Fallback for Treasurer only if not already present in live officials AND is not a placeholder
      const hasTreasurerInLive = list.some(
        item => matchesTenant(item.tenantId, t.id) && item.roleTitle.toLowerCase().includes('bendahara')
      );
      if (!hasTreasurerInLive && t.treasurerName && !isPlaceholder(t.treasurerName)) {
        const norm = normalizeName(t.treasurerName);
        const key = `${t.id}-${norm}`;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          list.push({
            id: `${t.id}-treasurer`,
            tenantId: t.id,
            tenantName: t.name,
            tenantRt: t.rt,
            tenantRw: t.rw,
            kelurahan: t.kelurahan,
            roleTitle: 'Bendahara',
            name: t.treasurerName,
            phone: '',
            themeColor: t.themeColor,
            isVerified: false,
            isCoreLeadership: true
          });
        }
      }
    });

    // Sort order: Ketua RT first, then Sekretaris, Bendahara, then other roles
    const rolePriority = (role: string) => {
      const r = role.toLowerCase();
      if (r.includes('ketua') && !r.includes('wakil')) return 1;
      if (r.includes('wakil')) return 2;
      if (r.includes('sekretaris')) return 3;
      if (r.includes('bendahara')) return 4;
      return 5;
    };

    return list.sort((a, b) => {
      const pA = rolePriority(a.roleTitle);
      const pB = rolePriority(b.roleTitle);
      if (pA !== pB) return pA - pB;
      return a.name.localeCompare(b.name);
    });
  }, [tenants, officials]);


  // Filtered officials
  const filteredOfficials = useMemo(() => {
    return officialsList.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.includes(searchQuery) ||
        item.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kelurahan.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesRole = true;
      if (roleFilter === 'Ketua RT') matchesRole = item.roleTitle.toLowerCase().includes('ketua');
      else if (roleFilter === 'Sekretaris') matchesRole = item.roleTitle.toLowerCase().includes('sekretaris');
      else if (roleFilter === 'Bendahara') matchesRole = item.roleTitle.toLowerCase().includes('bendahara');
      else if (roleFilter === 'seksi') {
        matchesRole = !item.isCoreLeadership;
      }

      return matchesSearch && matchesRole;
    });
  }, [officialsList, searchQuery, roleFilter]);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    toast.success('Nomor telepon berhasil disalin');
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const openWhatsApp = (official: OfficialEntry) => {
    if (!official.phone) {
      toast.error('Nomor telepon tidak tersedia');
      return;
    }
    let clean = official.phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    const text = encodeURIComponent(
      `Halo Bpk/Ibu ${official.name} (${official.roleTitle} ${official.tenantName}), salam koordinasi dari Super Admin Teras Warga...`
    );
    window.open(`https://wa.me/${clean}?text=${text}`, '_blank');
  };

  const totalKetua = officialsList.filter(o => o.roleTitle.toLowerCase().includes('ketua')).length;
  const totalSekr = officialsList.filter(o => o.roleTitle.toLowerCase().includes('sekretaris')).length;
  const totalBend = officialsList.filter(o => o.roleTitle.toLowerCase().includes('bendahara')).length;
  const totalSeksi = officialsList.filter(o => !o.isCoreLeadership).length;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Ketua RT Terdaftar
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 tracking-tight font-mono">
            {totalKetua} <span className="text-xs font-bold text-slate-500 font-sans">Pimpinan</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Penanggung jawab otoritas wilayah
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Sekretaris Wilayah
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-600 tracking-tight font-mono">
            {totalSekr} <span className="text-xs font-bold text-slate-500 font-sans">Aparatur</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Pusat administrasi dan persuratan
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Bendahara Kas
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight font-mono">
            {totalBend} <span className="text-xs font-bold text-slate-500 font-sans">Pengelola</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Pengelola rekening kas dan iuran
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Seksi Lapangan & Ronda
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Shield size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight font-mono">
            {totalSeksi} <span className="text-xs font-bold text-slate-500 font-sans">Petugas</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Keamanan, kebersihan, & sarpras live
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Cari nama pengurus, telepon, atau RT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs overflow-x-auto">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'Ketua RT', label: 'Ketua RT' },
              { id: 'Sekretaris', label: 'Sekretaris' },
              { id: 'Bendahara', label: 'Bendahara' },
              { id: 'seksi', label: 'Seksi / Lapangan' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  roleFilter === r.id
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
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
                <th className="py-3.5 px-4">Jabatan & Tugas</th>
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
                        {item.photo ? (
                          <img
                            src={item.photo}
                            alt={item.name}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-2xs shrink-0"
                            style={{ backgroundColor: item.themeColor || '#4F46E5' }}
                          >
                            {item.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-black text-slate-900 text-xs">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                            <span>ID: {item.tenantId}</span>
                            {item.email && (
                              <span className="text-indigo-600 font-mono font-bold flex items-center gap-0.5">
                                • {item.email}
                              </span>
                            )}
                            {item.houseId && (
                              <span className="text-indigo-600 font-bold bg-indigo-50 px-1 rounded">
                                Blok {item.houseId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Title */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                          item.roleTitle.toLowerCase().includes('ketua')
                            ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                            : item.roleTitle.toLowerCase().includes('sekretaris')
                            ? 'bg-sky-50 border border-sky-200 text-sky-700'
                            : item.roleTitle.toLowerCase().includes('bendahara')
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            : 'bg-purple-50 border border-purple-200 text-purple-700'
                        }`}>
                          {item.roleTitle}
                        </span>
                        {item.duties && item.duties.length > 0 && (
                          <p className="text-[10px] text-slate-500 max-w-xs truncate">
                            {item.duties.join(', ')}
                          </p>
                        )}
                      </div>
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
                        <button
                          onClick={() => setAccountTarget(item)}
                          className={`p-1.5 rounded-xl transition-colors cursor-pointer border ${
                            item.email
                              ? 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200 font-bold'
                          }`}
                          title={item.email ? "Kelola / Reset Akun Login" : "Buat Akun Login Pengurus RT"}
                        >
                          <Key size={13} />
                        </button>
                        {parentTenant && (
                          <button
                            onClick={() => onEditTenant(parentTenant)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl transition-colors cursor-pointer border border-slate-200"
                            title="Edit Data Wilayah RT"
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

      {/* Account Provisioning Modal */}
      <CreateOfficialAccountModal 
        isOpen={!!accountTarget}
        target={accountTarget}
        onClose={() => setAccountTarget(null)}
      />
        </div>
      </div>
    </div>
  );
};
