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
  ChevronDown
} from 'lucide-react';
import { House, PaymentStatus } from '../../../types';
import { useFinancial } from '../../../context/FinancialContext';
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
  const [activeActionsMenu, setActiveActionsMenu] = useState<string | null>(null);
  
  const groupedHouses = filteredHouses.reduce((acc, house) => {
    if (!acc[house.block]) acc[house.block] = [];
    acc[house.block].push(house);
    return acc;
  }, {} as Record<string, House[]>);

  const sortedBlocks = Object.entries(groupedHouses).sort(([a], [b]) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  const toggleActionsMenu = (id: string) => {
    setActiveActionsMenu(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {sortedBlocks.map(([block, houses]) => (
        <div key={block} className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_22px_rgba(241,245,249,0.3)] overflow-hidden">
          {/* Section Block Header */}
          <div className="bg-slate-50/70 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-50 border border-indigo-100/40 text-indigo-600 rounded-xl flex items-center justify-center shadow-xs">
                <MapPin size={15} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm tracking-tight">Blok {block}</h3>
                <p className="text-[10px] text-slate-450 font-black uppercase tracking-wider">Wilayah Rukun Tetangga 02</p>
              </div>
            </div>
            <div className="px-3 py-1 text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100/20 rounded-xl uppercase tracking-wider">
              {houses.length} Rumah / Hunian
            </div>
          </div>

          {/* 1. DESKTOP VIEW - Elegant structured heavy-duty table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-5 py-3 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0 cursor-pointer"
                      onChange={handleSelectAll} 
                      checked={selectedIds.size === filteredHouses.length && filteredHouses.length > 0} 
                    />
                  </th>
                  <th className="px-5 py-3">Nama Kepala Keluarga / Pemilik</th>
                  <th className="px-5 py-3 w-28">No. Rumah</th>
                  <th className="px-5 py-3">Kontak WA</th>
                  <th className="px-5 py-3 w-20 text-center">Jiwa</th>
                  <th className="px-5 py-3 w-36">Ket. SPPT PBB</th>
                  <th className="px-5 py-3 w-36">Status Kepemilikan</th>
                  <th className="px-5 py-3 w-28">Jenis Hunian</th>
                  <th className="px-5 py-3 w-28 text-center">Sampah</th>
                  <th className="px-5 py-3 w-28 text-center">Air</th>
                  <th className="px-5 py-3 w-28 text-center">Tunggakan</th>
                  <th className="px-5 py-3 w-32 text-right">Aksi Administrasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                {houses.map((house) => {
                  const statusSampah = getPaymentStatus(house, 'Sampah', selectedMonth);
                  const statusAir = getPaymentStatus(house, 'Air', selectedMonth);
                  const arrears = getArrearsForHouse(house);

                  return (
                    <tr key={house.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Checkbox */}
                      <td className="px-5 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded-lg border-slate-250 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0 cursor-pointer"
                          checked={selectedIds.has(house.id)} 
                          onChange={() => handleSelectOne(house.id)} 
                        />
                      </td>

                      {/* Citizen Name & ID */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border uppercase ${
                            house.status === 'Occupied' 
                              ? 'bg-indigo-50 text-indigo-605 border-indigo-100/50' 
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>
                            {house.headOfFamily ? house.headOfFamily.charAt(0) : <User size={13} />}
                          </div>
                          <div className="max-w-[200px] truncate">
                            <div className="font-extrabold text-slate-850 text-sm truncate">{house.headOfFamily || 'KOSONG (KOSONGAN)'}</div>
                            {house.ownerName && house.ownerName !== house.headOfFamily && (
                              <p className="text-[9px] font-black text-slate-400 truncate mt-0.5 uppercase tracking-wider">Pemilik, {house.ownerName}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* House Number */}
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100/75 border border-slate-200 px-2 py-0.5 rounded-lg text-xs">
                          No. {house.number}
                        </span>
                      </td>

                      {/* Telephone / WhatsApp contact */}
                      <td className="px-5 py-4">
                        {house.phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700 font-bold">{house.phone}</span>
                            {onSendWhatsApp && (
                              <button 
                                onClick={() => onSendWhatsApp(house)} 
                                className="p-1 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg transition-colors"
                                title="Kirim WhatsApp"
                              >
                                <MessageCircle size={14} className="stroke-[2.5]" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-black">-</span>
                        )}
                      </td>

                      {/* Occupants Account (Jiwa) */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-600 font-black bg-slate-50 border border-slate-200/50 w-11 h-6 rounded-lg mx-auto">
                          <Users size={11} className="text-slate-405 stroke-[2.5]" />
                          <span className="text-[10px]">{house.occupants || 0}</span>
                        </div>
                      </td>

                      {/* PBB status quick change */}
                      <td className="px-5 py-4">
                        <button 
                          onClick={() => {
                            const newStatus = house.pbbStatus === 'Sudah Diambil' ? 'Belum Diambil' : 'Sudah Diambil';
                            const year = house.pbbYear || new Date().getFullYear().toString();
                            handleUpdateHouse(house.id, { pbbStatus: newStatus, pbbYear: year });
                            toast.success(`Atribu SPPT PBB No. ${house.number} diubah ke: ${newStatus}`);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black border transition-all ${
                            house.pbbStatus === 'Sudah Diambil' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50' 
                              : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/50'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${house.pbbStatus === 'Sudah Diambil' ? 'bg-emerald-505' : 'bg-amber-505'}`} />
                          <span>{house.pbbStatus === 'Sudah Diambil' ? 'Diambil' : 'Belum'}</span>
                        </button>
                      </td>

                      {/* Ownership Type */}
                      <td className="px-5 py-4">
                        <div className="relative">
                          <select
                            value={house.residenceType || 'Tetap'}
                            onChange={(e) => {
                              handleUpdateHouse(house.id, { residenceType: e.target.value as any });
                              toast.info(`Status Kepemilikan RT No. ${house.number} diset ke ${e.target.value}`);
                            }}
                            className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-[10px] rounded-xl px-2.5 py-1.5 pr-6 border border-slate-200/80 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-100"
                          >
                            <option value="Tetap">🏡 Tetap/Pribadi</option>
                            <option value="Sewa">🔑 Sewa/Kontrak</option>
                            <option value="Rumah Keluarga">👨‍👩‍👦 Keluarga</option>
                          </select>
                          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 stroke-[2.5]" />
                        </div>
                      </td>

                      {/* Occupancy Status */}
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wider ${
                          house.status === 'Occupied' ? 'bg-indigo-50 text-indigo-705 border-indigo-100/40' : 
                          house.status === 'Empty' ? 'bg-slate-50 text-slate-450 border-slate-200/85' : 
                          house.status === 'Business' ? 'bg-purple-50 text-purple-700 border-purple-200/50' :
                          'bg-sky-50 text-sky-700 border-sky-200/50'
                        }`}>
                          {house.status === 'Occupied' ? 'Dihuni' : 
                           house.status === 'Empty' ? 'Kosong' : 
                           house.status === 'Business' ? 'Usaha' : 'Mengunjungi'}
                        </span>
                      </td>

                      {/* Waste Fee (Sampah) */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center">
                          <PaymentIndicator status={statusSampah} />
                        </div>
                      </td>

                      {/* Water Fee (Air) */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center">
                          <PaymentIndicator status={statusAir} color="blue" />
                        </div>
                      </td>

                      {/* Total Arrears (Tunggakan) */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center">
                          {arrears.length > 0 ? (
                            <span className="px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-650 text-[10px] font-black rounded-xl animate-pulse">
                              {arrears.length} Bulan
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 border border-emerald-100/50 text-emerald-600 bg-emerald-50/20 text-[9px] font-black uppercase tracking-widest rounded-lg">Lunas</span>
                          )}
                        </div>
                      </td>

                      {/* Administrative Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => openDetail(house)} 
                            className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 border border-transparent hover:border-indigo-100/50 transition-all rounded-lg"
                            title="Tampilkan Detail Lengkap"
                          >
                            <Eye size={14} className="stroke-[2.5]" />
                          </button>
                          <button 
                            onClick={() => handleOpenEdit(house)} 
                            className="p-1.5 text-slate-400 hover:text-amber-650 hover:bg-amber-50 border border-transparent hover:border-amber-100/50 transition-all rounded-lg"
                            title="Edit Dokumen/Warga"
                          >
                            <Edit2 size={14} className="stroke-[2.5]" />
                          </button>
                          <button 
                            onClick={() => handleDelete(house.id)} 
                            className="p-1.5 text-slate-400 hover:text-rose-650 hover:bg-rose-50 border border-transparent hover:border-rose-100/50 transition-all rounded-lg"
                            title="Hapus Rumah"
                          >
                            <Trash2 size={14} className="stroke-[2.5]" />
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
          <div className="md:hidden divide-y divide-slate-100">
            {houses.map((house) => {
              const statusSampah = getPaymentStatus(house, 'Sampah', selectedMonth);
              const statusAir = getPaymentStatus(house, 'Air', selectedMonth);
              const arrears = getArrearsForHouse(house);

              return (
                <div key={house.id} className="p-4 bg-white hover:bg-slate-50/40 transition-all space-y-3.5">
                  
                  {/* Card Section 1: Main Identifier & Selector */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500/10 cursor-pointer shrink-0 mt-0.5"
                        checked={selectedIds.has(house.id)} 
                        onChange={() => handleSelectOne(house.id)} 
                      />
                      
                      {/* Icon Family head and metadata */}
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border uppercase ${
                          house.status === 'Occupied' 
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                            : 'bg-slate-50 text-slate-450 border-slate-200'
                        }`}>
                          {house.headOfFamily ? house.headOfFamily.charAt(0) : <User size={12} />}
                        </div>
                        <div className="max-w-[140px] xs:max-w-[200px] truncate">
                          <h4 className="font-extrabold text-slate-850 text-sm truncate leading-tight">{house.headOfFamily || 'RUMAH KOSONG'}</h4>
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200/50 px-1.5 py-0.5 rounded">
                            Nomor Rumah: {house.number}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Occupancy state tag */}
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-wider ${
                      house.status === 'Occupied' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                      house.status === 'Empty' ? 'bg-slate-50 text-slate-400 border-slate-200' : 
                      house.status === 'Business' ? 'bg-purple-50 text-purple-700 border-purple-200/55' :
                      'bg-sky-50 text-sky-700 border-sky-200/55'
                    }`}>
                      {house.status === 'Occupied' ? 'Huni' : 
                       house.status === 'Empty' ? 'Kosong' : 
                       house.status === 'Business' ? 'Usaha' : 'Visit'}
                    </span>
                  </div>

                  {/* Card Section 2: Financial statuses & quick parameters */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pr-1.5">
                      <span>Sampah:</span>
                      <PaymentIndicator status={statusSampah} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pl-1.5 border-l border-slate-200/60">
                      <span>Air Bersih:</span>
                      <PaymentIndicator status={statusAir} color="blue" />
                    </div>
                    
                    <div className="col-span-2 pt-2 border-t border-dashed border-slate-200/80 flex items-center justify-between text-[10px] font-bold text-slate-550">
                      <span>Tunggakan Rekening:</span>
                      {arrears.length > 0 ? (
                        <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 font-black rounded-lg">
                          {arrears.length} Bulan
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-black uppercase tracking-wider">Aman</span>
                      )}
                    </div>
                  </div>

                  {/* Card Section 3: Document Status Settings */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* SPPT toggle */}
                    <button 
                      onClick={() => {
                        const newStatus = house.pbbStatus === 'Sudah Diambil' ? 'Belum Diambil' : 'Sudah Diambil';
                        const year = house.pbbYear || new Date().getFullYear().toString();
                        handleUpdateHouse(house.id, { pbbStatus: newStatus, pbbYear: year });
                        toast.success(`Atribu SPPT PBB No. ${house.number} diubah ke: ${newStatus}`);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black border transition-all ${
                        house.pbbStatus === 'Sudah Diambil' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-55/70 text-amber-705 border-amber-200/50'
                      }`}
                    >
                      <FileText size={11} className="stroke-[2.5]" />
                      <span>PBB: {house.pbbStatus === 'Sudah Diambil' ? 'Diambil' : 'Sisa SPT'}</span>
                    </button>

                    {/* Kepemilikan Selector */}
                    <div className="flex-1 relative">
                      <select
                        value={house.residenceType || 'Tetap'}
                        onChange={(e) => {
                          handleUpdateHouse(house.id, { residenceType: e.target.value as any });
                          toast.info(`Status Kepemilikan diset ke ${e.target.value}`);
                        }}
                        className="w-full appearance-none bg-slate-50 border border-slate-200/80 hover:bg-slate-100 text-slate-700 font-black text-[10px] rounded-xl px-2.5 py-2 pr-6 outline-none cursor-pointer"
                      >
                        <option value="Tetap">🏡 Pribadi</option>
                        <option value="Sewa">🔑 Sewa</option>
                        <option value="Rumah Keluarga">👨‍👩‍👦 Keluarga</option>
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Card Section 4: Contact & Operations Panel */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="text-[10px] font-mono font-bold text-slate-450">
                      {house.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone size={10} className="text-slate-400" />
                          <span>{house.phone}</span>
                        </div>
                      ) : (
                        <span>Keanggotaan: RT02</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {house.phone && onSendWhatsApp && (
                        <button 
                          onClick={() => onSendWhatsApp(house)}
                          className="px-2.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100/60 border border-emerald-150 rounded-xl flex items-center justify-center"
                          title="WhatsApp Admin"
                        >
                          <MessageCircle size={13} className="stroke-[2.5]" />
                        </button>
                      )}
                      <button 
                        onClick={() => openDetail(house)}
                        className="px-2.5 py-1.5 bg-indigo-50 text-indigo-650 hover:bg-indigo-100/60 border border-indigo-100/30 rounded-xl flex items-center justify-center gap-1 text-[10px] font-black"
                      >
                        <Eye size={12} className="stroke-[2.5]" />
                        <span>Detail</span>
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(house)}
                        className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-150 border border-slate-200/40 rounded-xl flex items-center justify-center"
                        title="Edit"
                      >
                        <Edit2 size={12} className="stroke-[2.5]" />
                      </button>
                      <button 
                        onClick={() => handleDelete(house.id)}
                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100/60 border border-rose-100/30 rounded-xl flex items-center justify-center"
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
      ))}
    </div>
  );
};

const PaymentIndicator = ({ status, color = 'emerald' }: { status: PaymentStatus, color?: 'emerald' | 'blue' }) => {
  const isPaid = status === PaymentStatus.PAID;
  const colorMap: any = {
    emerald: isPaid 
      ? 'bg-emerald-50 text-emerald-605 border-emerald-100' 
      : 'bg-rose-50 text-rose-600 border-rose-100',
    blue: isPaid 
      ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
      : 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border leading-none text-[10px] font-black ${colorMap[color]}`}>
      {isPaid ? <CheckCircle size={10} className="shrink-0 stroke-[2.5]" /> : <XCircle size={10} className="shrink-0 stroke-[2.5]" />}
      <span>{isPaid ? 'Lunas' : 'Belum'}</span>
    </div>
  );
};
