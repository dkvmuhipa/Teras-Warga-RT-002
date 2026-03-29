import React from 'react';
import { CheckCircle, XCircle, ChevronRight, Edit2, Trash2, MessageCircle } from 'lucide-react';
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
    <div className="space-y-8">
      {sortedBlocks.map(([block, houses]) => (
        <div key={block} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="p-4 w-10">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={selectedIds.size === filteredHouses.length && filteredHouses.length > 0} 
                    />
                  </th>
                  <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Nama</th>
                  <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">No</th>
                  <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Telepon</th>
                  <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Pemilik</th>
                  <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Jiwa</th>
                  <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Status</th>
                  <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Sampah</th>
                  <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Air</th>
                  <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Tunggakan</th>
                  <th className="p-4 text-right font-black text-slate-600 uppercase tracking-widest text-[10px]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {houses.map((house) => {
                  const statusSampah = getPaymentStatus(house, 'Sampah', selectedMonth);
                  const statusAir = getPaymentStatus(house, 'Air', selectedMonth);
                  const arrears = getArrearsForHouse(house);

                  return (
                    <tr key={house.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(house.id)} 
                          onChange={() => handleSelectOne(house.id)} 
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{house.headOfFamily}</div>
                        {house.ownerName && house.ownerName !== house.headOfFamily && (
                          <div className="text-[10px] text-slate-400 font-medium italic">Pemilik: {house.ownerName}</div>
                        )}
                      </td>
                      <td className="p-4 font-mono font-black text-slate-600">{house.number}</td>
                      <td className="p-4 text-slate-500">{house.phone || '-'}</td>
                      <td className="p-4">
                        {house.ownerName ? (
                          <div className="space-y-1">
                            <div className="font-bold text-slate-700 text-[10px]">{house.ownerName}</div>
                            <div className="text-[10px] text-slate-400">{house.ownerPhone || '-'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500">{house.occupants || 0}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          house.status === 'Occupied' ? 'bg-emerald-50 text-emerald-600' : 
                          house.status === 'Empty' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {house.status === 'Occupied' ? 'Dihuni' : house.status === 'Empty' ? 'Kosong' : 'Usaha'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          statusSampah === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {statusSampah === PaymentStatus.PAID ? <CheckCircle size={10}/> : <XCircle size={10}/>}
                          {statusSampah === PaymentStatus.PAID ? 'Lunas' : 'Belum'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          statusAir === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {statusAir === PaymentStatus.PAID ? <CheckCircle size={10}/> : <XCircle size={10}/>}
                          {statusAir === PaymentStatus.PAID ? 'Lunas' : 'Belum'}
                        </span>
                      </td>
                      <td className="p-4">
                        {arrears.length > 0 ? (
                          <span className="text-rose-600 font-black text-[10px]">{arrears.length} Bln</span>
                        ) : (
                          <span className="text-emerald-600 font-black text-[10px]">Nihil</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onSendWhatsApp && (
                            <button onClick={() => onSendWhatsApp(house)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Kirim WhatsApp">
                              <MessageCircle size={16}/>
                            </button>
                          )}
                          <button onClick={() => openDetail(house)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                            <ChevronRight size={16}/>
                          </button>
                          <button onClick={() => handleOpenEdit(house)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
                            <Edit2 size={16}/>
                          </button>
                          <button onClick={() => handleDelete(house.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
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
