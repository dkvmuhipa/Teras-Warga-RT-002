import React from 'react';
import { House, PaymentStatus } from '../../../types';
import { ResidentCard } from '../ResidentCard';
import { useFinancial } from '../../../context/FinancialContext';

interface ResidentGridViewProps {
  filteredHouses: House[];
  selectedMonth: string;
  openDetail: (house: House) => void;
  handleOpenEdit: (house: House) => void;
  handleDelete: (id: string) => void;
  setSelectedHouseForBills: (house: House) => void;
  openPayModal: (house: House) => void;
}

export const ResidentGridView: React.FC<ResidentGridViewProps> = ({
  filteredHouses,
  selectedMonth,
  openDetail,
  handleOpenEdit,
  handleDelete,
  setSelectedHouseForBills,
  openPayModal,
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
        <div key={block} className="space-y-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1.5 h-8 bg-indigo-500 rounded-full"></div>
            <h3 className="text-xl font-black text-slate-800">Blok {block}</h3>
            <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">{houses.length} Rumah</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                dynamicStatusAir={getPaymentStatus(house, 'Air', selectedMonth)}
                dynamicStatusSampah={getPaymentStatus(house, 'Sampah', selectedMonth)}
                arrears={house.status === 'Occupied' ? getArrearsForHouse(house) : []}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
