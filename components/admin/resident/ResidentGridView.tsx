import React, { useState } from 'react';
import { House, PaymentStatus } from '../../../types';
import { ResidentCard } from '../ResidentCard';
import { useFinancial } from '../../../context/FinancialContext';
import { ChevronDown, ChevronUp, Users, Home, Coins, Search, Layers } from 'lucide-react';

interface ResidentGridViewProps {
  filteredHouses: House[];
  selectedMonth: string;
  openDetail: (house: House) => void;
  handleOpenEdit: (house: House) => void;
  handleDelete: (id: string) => void;
  setSelectedHouseForBills: (house: House) => void;
  openPayModal: (house: House) => void;
  onSendWhatsApp?: (house: House) => void;
  handleUpdateHouse: (id: string, data: Partial<House>) => Promise<void>;
}

export const ResidentGridView: React.FC<ResidentGridViewProps> = ({
  filteredHouses,
  selectedMonth,
  openDetail,
  handleOpenEdit,
  handleDelete,
  setSelectedHouseForBills,
  openPayModal,
  onSendWhatsApp,
  handleUpdateHouse,
}) => {
  const { getPaymentStatus, getArrearsForHouse } = useFinancial();
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());

  const toggleBlock = (block: string) => {
    setCollapsedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(block)) next.delete(block);
      else next.add(block);
      return next;
    });
  };

  const collapseAll = () => {
    const all = new Set(sortedBlocks.map(([block]) => block));
    setCollapsedBlocks(all);
  };

  const expandAll = () => {
    setCollapsedBlocks(new Set());
  };

  const groupedHouses = filteredHouses.reduce((acc, house) => {
    const blockKey = house.block || (house.id && house.id.includes('-') ? house.id.split('-')[0] : 'Lainnya');
    if (!acc[blockKey]) acc[blockKey] = [];
    acc[blockKey].push(house);
    return acc;
  }, {} as Record<string, House[]>);

  const sortedBlocks = Object.entries(groupedHouses).sort(([a], [b]) => 
    (a || '').localeCompare(b || '', undefined, { numeric: true, sensitivity: 'base' })
  );

  // Empty State
  if (filteredHouses.length === 0) {
    return (
      <div className="py-16 px-6 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-xs animate-fade-in">
        <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
          <Search size={26} strokeWidth={2.2} />
        </div>
        <h4 className="text-base font-bold text-slate-800">Tidak Ada Data Warga Ditemukan</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
          Tidak ada hunian atau warga yang sesuai dengan kata kunci pencarian atau filter yang sedang aktif.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Global Block Controls if more than 1 block */}
      {sortedBlocks.length > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
            <Layers size={14} className="text-indigo-600" />
            <span>Total <strong>{sortedBlocks.length}</strong> Blok Kavling ({filteredHouses.length} Rumah)</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              Buka Semua
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={collapseAll}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
            >
              Tutup Semua
            </button>
          </div>
        </div>
      )}

      {sortedBlocks.map(([block, houses]) => {
        const isCollapsed = collapsedBlocks.has(block);
        const occupiedCount = houses.filter(h => h.status === 'Occupied').length;
        const totalOccupants = houses.reduce((sum, h) => sum + (h.occupants || (h.familyMembers?.length ? h.familyMembers.length + 1 : 1)), 0);
        const arrearsCount = houses.filter(h => h.status === 'Occupied' && getArrearsForHouse(h).length > 0).length;

        return (
          <div 
            key={block} 
            className="space-y-4 p-4 sm:p-5 bg-slate-50/70 hover:bg-slate-50/90 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs transition-colors"
          >
            {/* Block Header with Metrics & Collapse Toggle */}
            <div 
              onClick={() => toggleBlock(block)}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1 cursor-pointer select-none group"
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full group-hover:scale-y-110 transition-transform"></div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <span>Blok {block}</span>
                    <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg tabular-nums">
                      {houses.length} Rumah
                    </span>
                  </h3>
                </div>
              </div>

              {/* Block Metrics Summary Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-2xs font-mono tabular-nums">
                  <Home size={11} className="text-emerald-600" />
                  <span>{occupiedCount} Dihuni</span>
                </span>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200/80 rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-2xs font-mono tabular-nums">
                  <Users size={11} className="text-indigo-600" />
                  <span>{totalOccupants} Jiwa</span>
                </span>
                {arrearsCount > 0 ? (
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200/80 rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-2xs font-mono tabular-nums">
                    <Coins size={11} className="text-rose-600" />
                    <span>{arrearsCount} Nunggak</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[10px] font-bold shadow-2xs">
                    ✓ 100% Lunas
                  </span>
                )}

                <button 
                  type="button"
                  className="p-1 hover:bg-slate-200/70 text-slate-500 rounded-lg transition-colors ml-1"
                  aria-label={isCollapsed ? 'Buka blok' : 'Tutup blok'}
                >
                  {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>
            </div>

            {/* Grid Cards (Collapsible) */}
            {!isCollapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 pt-1 animate-fade-in">
                {houses.map((house) => (
                  <ResidentCard 
                    key={house.id}
                    house={house}
                    bills={[]}
                    onOpenDetail={openDetail}
                    onOpenEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    onOpenBills={setSelectedHouseForBills}
                    onOpenPay={openPayModal}
                    onSendWhatsApp={onSendWhatsApp}
                    onUpdatePBB={async (house) => {
                      const newStatus = house.pbbStatus === 'Sudah Diambil' ? 'Belum Diambil' : 'Sudah Diambil';
                      const year = house.pbbYear || new Date().getFullYear().toString();
                      await handleUpdateHouse(house.id, { pbbStatus: newStatus, pbbYear: year });
                    }}
                    dynamicStatusAir={getPaymentStatus(house, 'Air', selectedMonth)}
                    dynamicStatusSampah={getPaymentStatus(house, 'Sampah', selectedMonth)}
                    arrears={house.status === 'Occupied' ? getArrearsForHouse(house) : []}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
