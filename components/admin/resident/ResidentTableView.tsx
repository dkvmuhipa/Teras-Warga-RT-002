import React from 'react';
import { CheckCircle, XCircle, ChevronRight, Edit2, Trash2, MessageCircle, User, MapPin, AlertCircle } from 'lucide-react';
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
        <div key={block} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-600/20">
                 <MapPin size={14} />
               </div>
               <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Blok {block} <span className="text-slate-400 font-bold ml-1 text-xs">Lingkungan RT 02</span></h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
              {houses.length} Rumah Terrun
            </span>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm min-w-[1000px] border-collapse">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-6 py-4 w-12">
                    <div className="flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        onChange={handleSelectAll} 
                        checked={selectedIds.size === filteredHouses.length && filteredHouses.length > 0} 
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Identitas Warga</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Lokasi</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Kontak</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Jiwa</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">SPPT PBB</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Hunian</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Iuran Sampah</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Iuran Air</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Tunggakan</th>
                  <th className="px-6 py-4 text-right font-black text-slate-400 uppercase tracking-widest text-[10px]">Opsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {houses.map((house) => {
                  const statusSampah = getPaymentStatus(house, 'Sampah', selectedMonth);
                  const statusAir = getPaymentStatus(house, 'Air', selectedMonth);
                  const arrears = getArrearsForHouse(house);

                  return (
                    <tr key={house.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={selectedIds.has(house.id)} 
                            onChange={() => handleSelectOne(house.id)} 
                          />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border flex-shrink-0 ${
                            house.status === 'Occupied' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                            {house.headOfFamily ? house.headOfFamily.charAt(0) : <User size={16} />}
                          </div>
                          <div>
                            <div className="font-black text-slate-800 text-sm">{house.headOfFamily || 'KOSONG'}</div>
                            {house.ownerName && house.ownerName !== house.headOfFamily && (
                              <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-tight">Milik: {house.ownerName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                           <span className="font-mono font-black text-slate-700">No. {house.number}</span>
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lingkungan B</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {house.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600">{house.phone}</span>
                            {onSendWhatsApp && (
                               <button 
                                 onClick={() => onSendWhatsApp(house)} 
                                 className="text-emerald-500 hover:text-emerald-600 transition-colors"
                                 title="Kirim WhatsApp"
                               >
                                 <MessageCircle size={14} />
                               </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-black text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{house.occupants || 0} Jiwa</span>
                      </td>
                      <td className="px-6 py-5">
                        <button 
                          onClick={() => {
                            const newStatus = house.pbbStatus === 'Sudah Diambil' ? 'Belum Diambil' : 'Sudah Diambil';
                            const year = house.pbbYear || new Date().getFullYear().toString();
                            handleUpdateHouse(house.id, { pbbStatus: newStatus, pbbYear: year });
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            house.pbbStatus === 'Sudah Diambil' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}
                        >
                          {house.pbbStatus === 'Sudah Diambil' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                          {house.pbbStatus === 'Sudah Diambil' ? `Diambil` : 'Belum'}
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          house.status === 'Occupied' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          house.status === 'Empty' ? 'bg-slate-100 text-slate-500 border-slate-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {house.status === 'Occupied' ? 'Huni' : house.status === 'Empty' ? 'Kosong' : 'Usaha'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                         <PaymentIndicator status={statusSampah} />
                      </td>
                      <td className="px-6 py-5">
                         <PaymentIndicator status={statusAir} color="blue" />
                      </td>
                      <td className="px-6 py-5">
                        {arrears.length > 0 ? (
                           <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full w-fit">
                             <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                             <span className="font-black text-[10px] uppercase">{arrears.length} Bulan</span>
                           </div>
                        ) : (
                          <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest">Aman</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openDetail(house)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm">
                            <ChevronRight size={16}/>
                          </button>
                          <button onClick={() => handleOpenEdit(house)} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-600 hover:text-white rounded-xl transition-all shadow-sm">
                            <Edit2 size={16}/>
                          </button>
                          <button onClick={() => handleDelete(house.id)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm">
                            <Trash2 size={16}/>
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
    emerald: isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100',
    blue: isPaid ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border w-fit ${colorMap[color]}`}>
      {isPaid ? <CheckCircle size={12} className="shrink-0" /> : <XCircle size={12} className="shrink-0" />}
      <span className="text-[10px] font-black uppercase tracking-widest leading-none">{isPaid ? 'Lunas' : 'Belum'}</span>
    </div>
  );
};
