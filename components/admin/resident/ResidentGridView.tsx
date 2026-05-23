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
        <div key={block} className="space-y-4 p-5 bg-slate-50/50 rounded-xl border border-slate-200/60">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
            <h3 className="text-base font-bold text-slate-800">Blok {block}</h3>
            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {houses.length} Keluarga
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
        </div>
      ))}
    </div>
  );
};
