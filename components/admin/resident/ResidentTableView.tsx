import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  MessageCircle, 
  User, 
  MapPin, 
  AlertCircle, 
  Eye, 
  Phone, 
  Users, 
  FileText, 
  MoreVertical, 
  CreditCard,
  Building,
  Check,
  ChevronDown,
  ArrowUpDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Hash,
  Coins,
  Search,
  CheckCircle2
} from 'lucide-react';
import { House, PaymentStatus } from '../../../types';
import { useFinancial } from '../../../context/FinancialContext';
import { generateResidentCardPDF } from '../../../services/pdfService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ResidentTableViewProps {
  filteredHouses: House[];
  selectedMonth: string;
  selectedIds: Set<string>;
  handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectOne: (id: string) => void;
  openDetail: (house: House) => void;
  handleOpenEdit: (house: House) => void;
  handleDelete: (id: string) => void;
  onSendWhatsApp?: (house: House) => void;
  handleUpdateHouse: (id: string, data: Partial<House>) => Promise<void>;
}

export const ResidentTableView: React.FC<ResidentTableViewProps> = ({
  filteredHouses,
  selectedMonth,
  selectedIds,
  handleSelectAll,
  handleSelectOne,
  openDetail,
  handleOpenEdit,
  handleDelete,
  onSendWhatsApp,
  handleUpdateHouse,
}) => {
  const { getPaymentStatus, getArrearsForHouse } = useFinancial();
  const [sortField, setSortField] = useState<'number' | 'headOfFamily' | 'occupants' | 'arrears' | 'pbbStatus' | 'residenceType' | 'status'>('number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      toast.info(`Urutan diubah ke: ${field === 'number' ? 'No. Rumah' : field === 'headOfFamily' ? 'Nama' : field === 'occupants' ? 'Jiwa' : field === 'arrears' ? 'Tunggakan' : 'Data'} (${sortDirection === 'asc' ? 'Z-A / Descending' : 'A-Z / Ascending'})`);
    } else {
      setSortField(field);
      setSortDirection('asc');
      toast.info(`Urut berdasarkan: ${field === 'number' ? 'No. Rumah' : field === 'headOfFamily' ? 'Nama' : field === 'occupants' ? 'Jiwa' : field === 'arrears' ? 'Tunggakan' : 'Data'}`);
    }
  };

  // Group by block
  const groupedHouses = filteredHouses.reduce((acc, house) => {
    if (!acc[house.block]) acc[house.block] = [];
    acc[house.block].push(house);
    return acc;
  }, {} as Record<string, House[]>);

  const sortedBlocks = Object.entries(groupedHouses).sort(([a], [b]) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={11} className="text-slate-350 ml-1 inline-block opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp size={11} className="text-indigo-600 ml-1 inline-block stroke-[3]" />
      : <ChevronDown size={11} className="text-indigo-600 ml-1 inline-block stroke-[3]" />;
  };

  return (
    <div className="space-y-6">
      {/* Dynamic & Interactive Modern Quick Sort Pill-tray for ALL Devices (especially helpful on mobile) */}
      <div className="bg-slate-50/50 backdrop-blur-md rounded-2xl border border-slate-150 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-50 border border-indigo-100/65 rounded-xl flex items-center justify-center text-indigo-605 shadow-sm shrink-0">
            <ArrowUpDown size={14} className="stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Urutan Data Aktif</h4>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">Klik kolom tabel atau pilih opsi cepat ini untuk mengurutkan warga</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: 'number', label: 'No. Rumah' },
            { id: 'headOfFamily', label: 'Nama Warga' },
            { id: 'occupants', label: 'Jiwa/Huni' },
            { id: 'arrears', label: 'Tunggakan' },
            { id: 'status', label: 'Hunian' },
          ].map(field => {
            const isCurrent = sortField === field.id;
            return (
              <button
                key={field.id}
                type="button"
                onClick={() => handleSort(field.id as any)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all border ${
                  isCurrent 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-650 shadow-sm shadow-indigo-100/30' 
                    : 'bg-white hover:bg-slate-50 text-slate-550 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{field.label}</span>
                {isCurrent && (
                  sortDirection === 'asc' ? <ChevronUp size={11} className="stroke-[3]" /> : <ChevronDown size={11} className="stroke-[3]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {sortedBlocks.map(([block, houses]) => {
        // Sort houses inside this block based on selected fields
        const sortedHouses = [...houses].sort((a, b) => {
          let valA: any = '';
          let valB: any = '';

          if (sortField === 'headOfFamily') {
            valA = a.headOfFamily || '';
            valB = b.headOfFamily || '';
          } else if (sortField === 'number') {
            valA = a.number || '';
            valB = b.number || '';
          } else if (sortField === 'occupants') {
            valA = a.occupants || 0;
            valB = b.occupants || 0;
          } else if (sortField === 'arrears') {
            valA = getArrearsForHouse(a).length;
            valB = getArrearsForHouse(b).length;
          } else if (sortField === 'pbbStatus') {
            valA = a.pbbStatus || '';
            valB = b.pbbStatus || '';
          } else if (sortField === 'residenceType') {
            valA = a.residenceType || '';
            valB = b.residenceType || '';
          } else if (sortField === 'status') {
            valA = a.status || '';
            valB = b.status || '';
          }

          if (typeof valA === 'string' && typeof valB === 'string') {
            return sortDirection === 'asc' 
              ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
              : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
          } else {
            return sortDirection === 'asc' 
              ? (valA > valB ? 1 : valA < valB ? -1 : 0)
              : (valB > valA ? 1 : valB < valA ? -1 : 0);
          }
        });

        return (
          <div key={block} className="bg-white rounded-[2rem] border border-slate-150 shadow-[0_5px_25px_rgba(235,240,245,0.45)] overflow-hidden transition-all duration-300">
            {/* Section Block Header */}
            <div className="bg-slate-50/80 border-b border-slate-150 px-5 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-2xs">
                  <MapPin size={16} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                    <span>Blok Wilayah:</span>
                    <span className="font-black text-indigo-650 bg-indigo-50/80 px-2.5 py-0.5 rounded-lg border border-indigo-100/40">Blok {block}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Sektor Manajemen Rukun Tetangga 02</p>
                </div>
              </div>
              <div className="self-start sm:self-center px-3.5 py-1.5 text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100/20 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-3xs">
                <Building size={11} />
                <span>{houses.length} Rumah Terdaftar</span>
              </div>
            </div>

            {/* 1. DESKTOP VIEW - Elegant structured heavy-duty table */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    <th className="px-3 py-3.5 w-10 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0 cursor-pointer"
                        onChange={handleSelectAll} 
                        checked={selectedIds.size === filteredHouses.length && filteredHouses.length > 0} 
                      />
                    </th>
                    <th className="px-3 py-3.5 group cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => handleSort('headOfFamily')}>
                      <div className="flex items-center gap-1">
                        <span>Nama Kepala Keluarga / Pemilik</span>
                        {renderSortIcon('headOfFamily')}
                      </div>
                    </th>
                    <th className="px-3 py-3.5 w-24 group cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => handleSort('number')}>
                      <div className="flex items-center gap-1">
                        <span>No. Rumah</span>
                        {renderSortIcon('number')}
                      </div>
                    </th>
                    <th className="px-3 py-3.5">Kontak WhatsApp</th>
                    <th className="px-3 py-3.5 w-16 text-center cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => handleSort('occupants')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>Jiwa</span>
                        {renderSortIcon('occupants')}
                      </div>
                    </th>
                    <th className="px-3 py-3.5 w-28 group cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => handleSort('pbbStatus')}>
                      <div className="flex items-center gap-1">
                        <span>SPPT PBB</span>
                        {renderSortIcon('pbbStatus')}
                      </div>
                    </th>
                    <th className="px-3 py-3.5 w-32 group cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => handleSort('residenceType')}>
                      <div className="flex items-center gap-1">
                        <span>Jenis Hak</span>
                        {renderSortIcon('residenceType')}
                      </div>
                    </th>
                    <th className="px-3 py-3.5 w-24 group cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        {renderSortIcon('status')}
                      </div>
                    </th>
                    <th className="px-3 py-3.5 w-24 text-center font-black">S. Sampah</th>
                    <th className="px-3 py-3.5 w-24 text-center font-black">S. Air</th>
                    <th className="px-3 py-3.5 w-24 text-center group cursor-pointer hover:bg-slate-50/50 transition-colors font-black" onClick={() => handleSort('arrears')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>Tunggakan</span>
                        {renderSortIcon('arrears')}
                      </div>
                    </th>
                    <th className="px-3 py-3.5 w-28 text-right font-black">Aksi Panel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                  {sortedHouses.map((house) => {
                    const statusSampah = getPaymentStatus(house, 'Sampah', selectedMonth);
                    const statusAir = getPaymentStatus(house, 'Air', selectedMonth);
                    const arrears = getArrearsForHouse(house);
                    const isSelected = selectedIds.has(house.id);

                    return (
                      <tr 
                        key={house.id} 
                        className={`transition-all duration-150 group ${
                          isSelected 
                            ? 'bg-indigo-50/30 hover:bg-indigo-50/45 border-l-4 border-l-indigo-600' 
                            : 'hover:bg-slate-50/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-5 py-4.5 text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded-lg border-slate-350 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0 cursor-pointer transition-all"
                            checked={isSelected} 
                            onChange={() => handleSelectOne(house.id)} 
                          />
                        </td>

                        {/* Citizen Name & Verification Quick-Action */}
                        <td className="px-5 py-4.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border uppercase shadow-3xs transition-transform group-hover:scale-105 ${
                              house.status === 'Occupied' 
                                ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/40 text-indigo-600 border-indigo-100' 
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}>
                              {house.headOfFamily ? house.headOfFamily.charAt(0) : <User size={13} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 max-w-[220px]">
                                <span className="font-extrabold text-slate-800 text-sm truncate">{house.headOfFamily || 'KOSONG (KOSONGAN)'}</span>
                                
                                {/* Dynamic Interactive Official Verification Shield Badge */}
                                {house.isVerified ? (
                                  <button 
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await handleUpdateHouse(house.id, { isVerified: false });
                                      toast.info(`Status verifikasi ${house.headOfFamily || 'Rumah'} dinonaktifkan.`);
                                    }}
                                    className="text-blue-600 hover:text-rose-600 transition-colors focus:outline-none focus:scale-110 active:scale-95 shrink-0"
                                    title="Telah Terverifikasi RT 02 (Klik untuk batalkan verifikasi)"
                                  >
                                    <ShieldCheck size={14} className="fill-blue-50 stroke-blue-600 stroke-[2.5]" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await handleUpdateHouse(house.id, { isVerified: true });
                                      toast.success(`Warga ${house.headOfFamily || 'Rumah'} terverifikasi resmi!`);
                                    }}
                                    className="text-slate-300 hover:text-emerald-600 transition-colors focus:outline-none focus:scale-110 active:scale-95 shrink-0"
                                    title="Belum Diverifikasi RT (Klik untuk verifikasi resmi instan)"
                                  >
                                    <ShieldAlert size={14} className="stroke-[2.5]" />
                                  </button>
                                )}
                              </div>
                              {house.ownerName && house.ownerName !== house.headOfFamily && (
                                <p className="text-[10px] font-bold text-slate-450 truncate mt-0.5 tracking-wide uppercase">
                                  PEMILIK: <span className="text-slate-500 font-extrabold">{house.ownerName}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* House Number */}
                        <td className="px-5 py-4.5">
                          <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg text-xs shadow-3xs">
                            No. {house.number}
                          </span>
                        </td>

                        {/* Telephone / WhatsApp contact */}
                        <td className="px-5 py-4.5">
                          {house.phone && house.phone !== '-' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-700 font-bold tracking-wide">{house.phone}</span>
                              {onSendWhatsApp && (
                                <button 
                                  onClick={() => onSendWhatsApp(house)} 
                                  className="p-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-lg border border-emerald-100/40 transition-colors flex items-center gap-0.5 active:scale-90"
                                  title="Kirim Pesan WhatsApp"
                                >
                                  <MessageCircle size={13} className="stroke-[2.5]" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 hover:text-slate-400 transition-colors italic text-[11px] font-normal cursor-help" title="Gunakan tombol edit di kanan untuk mengisi no. HP warga">- Belum Ada HP -</span>
                          )}
                        </td>

                        {/* Occupants Account (Jiwa) */}
                        <td className="px-5 py-4.5 text-center">
                          <div className="inline-flex items-center justify-center gap-1 text-slate-700 font-black bg-slate-50 border border-slate-205 w-11 h-6 rounded-lg shadow-3xs">
                            <Users size={11} className="text-indigo-500 stroke-[2.5]" />
                            <span className="text-[10px]">{house.occupants || 0}</span>
                          </div>
                        </td>

                        {/* PBB status quick change */}
                        <td className="px-5 py-4.5">
                          <button 
                            onClick={() => {
                              const newStatus = house.pbbStatus === 'Sudah Diambil' ? 'Belum Diambil' : 'Sudah Diambil';
                              const year = house.pbbYear || new Date().getFullYear().toString();
                              handleUpdateHouse(house.id, { pbbStatus: newStatus, pbbYear: year });
                              toast.success(`Administrasi SPPT PBB No. ${house.number} diubah ke: ${newStatus}`);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all active:scale-95 shadow-3xs hover:-translate-y-0.5 ${
                              house.pbbStatus === 'Sudah Diambil' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/55' 
                                : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/55'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${house.pbbStatus === 'Sudah Diambil' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            <span>{house.pbbStatus === 'Sudah Diambil' ? 'Diambil' : 'Belum'}</span>
                          </button>
                        </td>

                        {/* Ownership Type */}
                        <td className="px-5 py-4.5">
                          <div className="relative inline-block w-28">
                            <select
                              value={house.residenceType || 'Tetap'}
                              onChange={(e) => {
                                handleUpdateHouse(house.id, { residenceType: e.target.value as any });
                                toast.info(`Status Kepemilikan RT No. ${house.number} diset ke ${e.target.value}`);
                              }}
                              className="appearance-none w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-[10px] rounded-xl px-2.5 py-1.5 pr-6 border border-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all shadow-3xs"
                            >
                              <option value="Tetap">🏡 Tetap/Pribadi</option>
                              <option value="Sewa">🔑 Sewa/Kontrak</option>
                              <option value="Rumah Keluarga">👨‍👩‍👦 Keluarga</option>
                            </select>
                            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 stroke-[2.5]" />
                          </div>
                        </td>

                        {/* Occupancy Status */}
                        <td className="px-5 py-4.5">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wider shadow-4xs ${
                            house.status === 'Occupied' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                            house.status === 'Empty' ? 'bg-slate-50 text-slate-505 border-slate-200' : 
                            house.status === 'Business' ? 'bg-purple-50 text-purple-700 border-purple-150' :
                            'bg-sky-50 text-sky-700 border-sky-150'
                          }`}>
                            {house.status === 'Occupied' ? 'Dihuni' : 
                             house.status === 'Empty' ? 'Kosong' : 
                             house.status === 'Business' ? 'Usaha' : 'Visit'}
                          </span>
                        </td>

                        {/* Waste Fee (Sampah) */}
                        <td className="px-5 py-4.5 text-center">
                          <div className="flex justify-center">
                            <PaymentIndicator status={statusSampah} service="Sampah" />
                          </div>
                        </td>

                        {/* Water Fee (Air) */}
                        <td className="px-5 py-4.5 text-center">
                          <div className="flex justify-center">
                            <PaymentIndicator status={statusAir} service="Air" />
                          </div>
                        </td>

                        {/* Total Arrears (Tunggakan) */}
                        <td className="px-5 py-4.5 text-center">
                          <div className="flex justify-center">
                            {arrears.length > 0 ? (
                              <span className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-650 text-[10px] font-black rounded-xl animate-pulse shadow-4xs">
                                <Coins size={10} />
                                <span>{arrears.length} Bulan</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 border border-emerald-100/50 text-emerald-605 bg-emerald-50/20 text-[9px] font-black uppercase tracking-widest rounded-lg">Lunas</span>
                            )}
                          </div>
                        </td>

                        {/* Administrative Actions Panel */}
                        <td className="px-5 py-4.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => generateResidentCardPDF(house)} 
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-all rounded-lg shadow-3xs"
                              title="Cetak Kartu Warga Digital RT 02 (PDF)"
                            >
                              <FileText size={14} className="stroke-[2.5] text-emerald-600" />
                            </button>
                            <button 
                              onClick={() => openDetail(house)} 
                              className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-150 transition-all rounded-lg shadow-3xs"
                              title="Tampilkan Info Profile Detail"
                            >
                              <Eye size={14} className="stroke-[2.5]" />
                            </button>
                            <button 
                              onClick={() => handleOpenEdit(house)} 
                              className="p-1.5 text-slate-400 hover:text-amber-655 hover:bg-amber-50 border border-slate-100 hover:border-amber-150 transition-all rounded-lg shadow-3xs"
                              title="Edit Biodata Rumah"
                            >
                              <Edit2 size={13} className="stroke-[2.5]" />
                            </button>
                            <button 
                              onClick={() => handleDelete(house.id)} 
                              className="p-1.5 text-slate-400 hover:text-rose-650 hover:bg-rose-50 border border-slate-100 hover:border-rose-150 transition-all rounded-lg shadow-3xs"
                              title="Hapus Data Hunian"
                            >
                              <Trash2 size={13} className="stroke-[2.5]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. MOBILE VIEW - Optimized High-Fidelity Bento Cards (No overflow, responsive layout) */}
            <div className="md:hidden divide-y divide-slate-100 bg-slate-50/20">
              {sortedHouses.map((house) => {
                const statusSampah = getPaymentStatus(house, 'Sampah', selectedMonth);
                const statusAir = getPaymentStatus(house, 'Air', selectedMonth);
                const arrears = getArrearsForHouse(house);
                const isSelected = selectedIds.has(house.id);

                return (
                  <div 
                    key={house.id} 
                    className={`p-4 transition-all duration-150 space-y-4 ${
                      isSelected ? 'bg-indigo-50/30 border-l-4 border-l-indigo-500' : 'bg-white hover:bg-slate-50/30'
                    }`}
                  >
                    
                    {/* Card Section 1: Main Identifier & Selector */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 w-full max-w-[80%]">
                        {/* Selector checkbox */}
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500/10 cursor-pointer shrink-0 mt-0.5"
                          checked={isSelected} 
                          onChange={() => handleSelectOne(house.id)} 
                        />
                        
                        {/* Avatar Image Initials / Icon */}
                        <div className="flex items-center gap-2.5 truncate w-full">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border uppercase shadow-3xs ${
                            house.status === 'Occupied' 
                              ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/35 text-indigo-600 border-indigo-100' 
                              : 'bg-slate-55 text-slate-400 border-slate-200'
                          }`}>
                            {house.headOfFamily ? house.headOfFamily.charAt(0) : <User size={13} />}
                          </div>
                          <div className="truncate w-[75%]">
                            <div className="flex items-center gap-1">
                              <h4 className="font-extrabold text-slate-800 text-sm truncate leading-tight">{house.headOfFamily || 'RUMAH KOSONG'}</h4>
                              {house.isVerified ? (
                                <ShieldCheck size={14} className="fill-blue-50 stroke-blue-600 stroke-[2.5] shrink-0" />
                              ) : (
                                <ShieldAlert size={14} className="stroke-slate-300 stroke-[2] shrink-0" />
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="font-mono text-[9px] font-black text-indigo-750 bg-indigo-50/80 border border-indigo-100/20 px-1.5 py-0.5 rounded shadow-3xs leading-none">
                                NO. {house.number}
                              </span>
                              {house.occupants ? (
                                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5 leading-none">
                                  <Users size={10} className="text-slate-400" /> {house.occupants} Jiwa
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Occupancy state tag */}
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-wider shrink-0 shadow-3xs ${
                        house.status === 'Occupied' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                        house.status === 'Empty' ? 'bg-slate-50 text-slate-450 border-slate-205' : 
                        house.status === 'Business' ? 'bg-purple-50 text-purple-700 border-purple-150' :
                        'bg-sky-50 text-sky-700 border-sky-150'
                      }`}>
                        {house.status === 'Occupied' ? 'Huni' : 
                         house.status === 'Empty' ? 'Kosong' : 
                         house.status === 'Business' ? 'Usaha' : 'Visit'}
                      </span>
                    </div>

                    {/* Card Section 2: Financial statuses & quick parameters */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50/60 p-3 rounded-xl border border-slate-150 shadow-3xs">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pr-1.5 my-0.5">
                        <span className="flex items-center gap-1 font-black text-slate-400 uppercase tracking-wide"><Coins size={10} /> Iuran Sampah:</span>
                        <PaymentIndicator status={statusSampah} service="Sampah" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pl-2 my-0.5 border-l border-slate-200">
                        <span className="flex items-center gap-1 font-black text-slate-400 uppercase tracking-wide"><Coins size={10} /> Air Bersih:</span>
                        <PaymentIndicator status={statusAir} service="Air" />
                      </div>
                      
                      <div className="col-span-2 pt-2 border-t border-dashed border-slate-200/80 flex items-center justify-between text-[10px] font-bold text-slate-550">
                        <span className="font-extrabold uppercase tracking-wide">Tunggakan Iuran:</span>
                        {arrears.length > 0 ? (
                          <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-605 font-extrabold rounded-lg animate-pulse flex items-center gap-1">
                            <Coins size={9} />
                            <span>{arrears.length} Bulan</span>
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-black uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 size={11} /> LUNAS
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Section 3: Document Status Settings & Verification quick triggers */}
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        {/* SPPT toggle */}
                        <button 
                          onClick={() => {
                            const newStatus = house.pbbStatus === 'Sudah Diambil' ? 'Belum Diambil' : 'Sudah Diambil';
                            const year = house.pbbYear || new Date().getFullYear().toString();
                            handleUpdateHouse(house.id, { pbbStatus: newStatus, pbbYear: year });
                            toast.success(`Administrasi SPPT PBB No. ${house.number} diubah ke: ${newStatus}`);
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black border transition-all shadow-3xs ${
                            house.pbbStatus === 'Sudah Diambil' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-150'
                          }`}
                        >
                          <FileText size={11} className="stroke-[2.5]" />
                          <span>PBB: {house.pbbStatus === 'Sudah Diambil' ? 'Diambil' : 'Belum Ditagih'}</span>
                        </button>

                        {/* Kepemilikan Selector */}
                        <div className="flex-1 relative">
                          <select
                            value={house.residenceType || 'Tetap'}
                            onChange={(e) => {
                              handleUpdateHouse(house.id, { residenceType: e.target.value as any });
                              toast.info(`Status Kepemilikan diset ke ${e.target.value}`);
                            }}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-black text-[10px] rounded-xl px-2.5 py-2 pr-6 outline-none cursor-pointer shadow-3xs"
                          >
                            <option value="Tetap">🏡 Pribadi</option>
                            <option value="Sewa">🔑 Sewa</option>
                            <option value="Rumah Keluarga">👨‍👩‍👦 Keluarga</option>
                          </select>
                          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 stroke-[2.5]" />
                        </div>
                      </div>

                      {/* Mobile quick-verify command node */}
                      <button 
                        onClick={async () => {
                          const nextState = !house.isVerified;
                          await handleUpdateHouse(house.id, { isVerified: nextState });
                          if (nextState) {
                            toast.success(`Warga ${house.headOfFamily || 'Rumah'} berhasil diverifikasi resmi!`);
                          } else {
                            toast.info(`Status verifikasi ${house.headOfFamily || 'Rumah'} dibatalkan.`);
                          }
                        }}
                        className={`w-full py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 shadow-3xs ${
                          house.isVerified 
                            ? 'bg-blue-50/50 text-blue-700 border-blue-200/50 hover:bg-blue-105' 
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {house.isVerified ? (
                          <>
                            <ShieldCheck size={11} className="text-blue-600 fill-blue-50 stroke-[2.5]" />
                            <span>Terverifikasi RT02 (Klik Batalkan)</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert size={11} className="text-slate-400 stroke-[2]" />
                            <span>Klik untuk Verifikasi Resmi RT</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Card Section 4: Contact & Operations Panel */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="text-[10px] font-mono font-bold text-slate-500 flex items-center gap-1">
                        {house.phone && house.phone !== '-' ? (
                          <div className="flex items-center gap-1 text-slate-605">
                            <Phone size={10} className="text-indigo-500" />
                            <span>{house.phone}</span>
                          </div>
                        ) : (
                          <span className="italic text-slate-400 font-sans font-medium text-[9px]">- Tidak ada no. HP -</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {house.phone && house.phone !== '-' && onSendWhatsApp && (
                          <button 
                            onClick={() => onSendWhatsApp(house)}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-150 rounded-xl flex items-center justify-center shadow-3xs active:scale-[0.93]"
                            title="WhatsApp Pemohon"
                          >
                            <MessageCircle size={13} className="stroke-[2.5]" />
                          </button>
                        )}
                        <button 
                          onClick={() => openDetail(house)}
                          className="px-2.5 py-1.5 bg-indigo-50 text-indigo-650 hover:bg-indigo-110 border border-indigo-100/50 rounded-xl flex items-center justify-center gap-1 text-[10px] font-black shadow-3xs active:scale-[0.93]"
                        >
                          <Eye size={12} className="stroke-[2.5]" />
                          <span>Profil</span>
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(house)}
                          className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center shadow-xs active:scale-[0.93]"
                          title="Edit Hunian"
                        >
                          <Edit2 size={12} className="stroke-[2.5]" />
                        </button>
                        <button 
                          onClick={() => handleDelete(house.id)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-105 rounded-xl flex items-center justify-center shadow-xs active:scale-[0.93]"
                          title="Hapus"
                        >
                          <Trash2 size={12} className="stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        );
      })}
    </div>
  );
};

interface PaymentIndicatorProps {
  status: PaymentStatus;
  service: 'Sampah' | 'Air';
}

const PaymentIndicator: React.FC<PaymentIndicatorProps> = ({ status, service }) => {
  const isPaid = status === PaymentStatus.PAID;
  
  if (service === 'Sampah') {
    return (
      <div className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-lg border leading-none text-[9.5px] font-black transition-all ${
        isPaid 
          ? 'bg-emerald-50/80 text-emerald-700 border-emerald-100 shadow-3xs' 
          : 'bg-rose-50/80 text-rose-650 border-rose-100'
      }`}>
        {isPaid ? <Check size={10} className="stroke-[3]" /> : <XCircle size={10} className="stroke-[2.5]" />}
        <span>{isPaid ? 'Lunas' : 'Belum'}</span>
      </div>
    );
  } else {
    return (
      <div className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-lg border leading-none text-[9.5px] font-black transition-all ${
        isPaid 
          ? 'bg-sky-50/80 text-sky-700 border-sky-100 shadow-3xs' 
          : 'bg-rose-50/80 text-rose-650 border-rose-100'
      }`}>
        {isPaid ? <Check size={10} className="stroke-[3]" /> : <XCircle size={10} className="stroke-[2.5]" />}
        <span>{isPaid ? 'Lunas' : 'Belum'}</span>
      </div>
    );
  }
};
