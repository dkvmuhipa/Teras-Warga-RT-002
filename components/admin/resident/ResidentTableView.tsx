import React from 'react';
import { CheckCircle, XCircle, ChevronRight, Edit2, Trash2, MessageCircle, User, MapPin, AlertCircle, Eye, Phone, Users } from 'lucide-react';
import { House, PaymentStatus } from '../../../types';
import { useFinancial } from '../../../context/FinancialContext';

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
  
  const groupedHouses = filteredHouses.reduce((acc, house) => {
    if (!acc[house.block]) acc[house.block] = [];
    acc[house.block].push(house);
    return acc;
  }, {} as Record<string, House[]>);

  const sortedBlocks = Object.entries(groupedHouses).sort(([a], [b]) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  return (
    <div className="space-y-6">
      {sortedBlocks.map(([block, houses]) => (
        <div key={block} className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Section Header */}
          <div className="bg-slate-50/50 border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">
                <MapPin size={14} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Blok {block}</h3>
                <p className="text-[10px] text-slate-400 font-medium">Wilayah Rukun Tetangga 02</p>
              </div>
            </div>
            <div className="px-2.5 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50/60 border border-indigo-100 rounded-lg">
              {houses.length} Rumah
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/20 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-250 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0 cursor-pointer"
                      onChange={handleSelectAll} 
                      checked={selectedIds.size === filteredHouses.length && filteredHouses.length > 0} 
                    />
                  </th>
                  <th className="px-5 py-3">Nama Warga</th>
                  <th className="px-5 py-3 w-28">No. Rumah</th>
                  <th className="px-5 py-3">Kontak / WA</th>
                  <th className="px-5 py-3 w-24 text-center">Jiwa</th>
                  <th className="px-5 py-3 w-36">SPPT PBB</th>
                  <th className="px-5 py-3 w-36">Kepemilikan</th>
                  <th className="px-5 py-3 w-28">Status Hunian</th>
                  <th className="px-5 py-3 w-32 text-center">Sampah</th>
                  <th className="px-5 py-3 w-32 text-center">Air</th>
                  <th className="px-5 py-3 w-32 text-center">Tunggakan</th>
                  <th className="px-5 py-3 w-36 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                {houses.map((house) => {
                  const statusSampah = getPaymentStatus(house, 'Sampah', selectedMonth);
                  const statusAir = getPaymentStatus(house, 'Air', selectedMonth);
                  const arrears = getArrearsForHouse(house);

                  return (
                    <tr key={house.id} className="hover:bg-slate-55/35 transition-colors group">
                      {/* Checkbox */}
                      <td className="px-5 py-3.5 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-250 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0 cursor-pointer"
                          checked={selectedIds.has(house.id)} 
                          onChange={() => handleSelectOne(house.id)} 
                        />
                      </td>

                      {/* Citizen Identity */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border uppercase ${
                            house.status === 'Occupied' 
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                              : 'bg-slate-50 text-slate-400 border-slate-150'
                          }`}>
                            {house.headOfFamily ? house.headOfFamily.charAt(0) : <User size={13} />}
                          </div>
                          <div className="max-w-[180px] truncate">
                            <div className="font-bold text-slate-800 text-sm truncate">{house.headOfFamily || 'KOSONG'}</div>
                            {house.ownerName && house.ownerName !== house.headOfFamily && (
                              <p className="text-[9px] text-slate-400 truncate -mt-0.5">Pemilik: {house.ownerName}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* House Number */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 border border-slate-100 rounded-md">
                          No. {house.number}
                        </span>
                      </td>

                      {/* Contact WP */}
                      <td className="px-5 py-3.5">
                        {house.phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-600 font-semibold">{house.phone}</span>
                            {onSendWhatsApp && (
                              <button 
                                onClick={() => onSendWhatsApp(house)} 
                                className="p-1 hover:bg-emerald-50 text-emerald-650 hover:text-emerald-700 rounded transition-colors"
                                title="Kirim Pesan WhatsApp"
                              >
                                <MessageCircle size={14} className="stroke-[2.5]" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Occupants Count */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-600 font-semibold">
                          <Users size={12} className="text-slate-400" />
                          <span>{house.occupants || 0}</span>
                        </div>
                      </td>

                      {/* PBB Status */}
                      <td className="px-5 py-3.5">
                        <button 
                          onClick={() => {
                            const newStatus = house.pbbStatus === 'Sudah Diambil' ? 'Belum Diambil' : 'Sudah Diambil';
                            const year = house.pbbYear || new Date().getFullYear().toString();
                            handleUpdateHouse(house.id, { pbbStatus: newStatus, pbbYear: year });
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            house.pbbStatus === 'Sudah Diambil' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50' 
                              : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/50'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${house.pbbStatus === 'Sudah Diambil' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span>{house.pbbStatus === 'Sudah Diambil' ? 'Diambil' : 'Sisa SPT'}</span>
                        </button>
                      </td>

                      {/* Kepemilikan Status Quick Setter */}
                      <td className="px-5 py-3.5">
                        <select
                          value={house.residenceType || 'Tetap'}
                          onChange={(e) => handleUpdateHouse(house.id, { residenceType: e.target.value as any })}
                          className={`appearance-none px-2.5 py-1 rounded-lg text-[10px] font-bold border outline-none cursor-pointer transition-all ${
                            (house.residenceType || 'Tetap') === 'Tetap'
                              ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                              : (house.residenceType || 'Tetap') === 'Sewa'
                              ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/55'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100/55'
                          }`}
                        >
                          <option value="Tetap" className="bg-white text-slate-800">🏠 Tetap</option>
                          <option value="Sewa" className="bg-white text-slate-800">🔑 Sewa</option>
                          <option value="Rumah Keluarga" className="bg-white text-slate-800">👨‍👩‍👦 Keluarga</option>
                        </select>
                      </td>

                      {/* Occupany Status */}
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          house.status === 'Occupied' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                          house.status === 'Empty' ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {house.status === 'Occupied' ? 'Dihuni' : house.status === 'Empty' ? 'Kosong' : 'Usaha'}
                        </span>
                      </td>

                      {/* Sampah Fee */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex justify-center">
                          <PaymentIndicator status={statusSampah} />
                        </div>
                      </td>

                      {/* Water Fee */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex justify-center">
                          <PaymentIndicator status={statusAir} color="blue" />
                        </div>
                      </td>

                      {/* Arrears */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex justify-center">
                          {arrears.length > 0 ? (
                            <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-650 text-[10px] font-bold rounded-lg whitespace-nowrap">
                              {arrears.length} Bln
                            </span>
                          ) : (
                            <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Aman</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => openDetail(house)} 
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all rounded-lg"
                            title="Detail Profil Warga"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => handleOpenEdit(house)} 
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all rounded-lg"
                            title="Edit Data Warga"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(house.id)} 
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all rounded-lg"
                            title="Hapus Data Warga"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded border leading-none text-[10px] font-bold ${colorMap[color]}`}>
      {isPaid ? <CheckCircle size={10} className="shrink-0" /> : <XCircle size={10} className="shrink-0" />}
      <span>{isPaid ? 'Lunas' : 'Belum'}</span>
    </div>
  );
};

