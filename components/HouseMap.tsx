
import React, { useState, useEffect } from 'react';
import { House, PaymentStatus, Report } from '../types';
import { Home, MapPin, Store, X, AlertTriangle, User, Edit, DollarSign, ShieldAlert, ChevronRight, Info } from 'lucide-react';

interface HouseMapProps {
  houses: House[];
  isAdmin: boolean;
  reports?: Report[];
  onEditHouse?: (house: House) => void;
  onPayDues?: (house: House) => void;
  onReportHouse?: (house: House) => void;
}

interface HouseDetailModalProps {
    house: House;
    onClose: () => void;
    reports: Report[];
    isAdmin: boolean;
    onEditHouse?: (house: House) => void;
    onPayDues?: (house: House) => void;
    onReportHouse?: (house: House) => void;
}

// --- Detail Modal Component ---
const HouseDetailModal: React.FC<HouseDetailModalProps> = ({ 
    house, 
    onClose, 
    reports, 
    isAdmin, 
    onEditHouse, 
    onPayDues, 
    onReportHouse 
}) => {
    const activeReports = reports.filter(r => r.houseId === house.id && r.status !== 'Selesai');
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="bg-white w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-slide-up ring-1 ring-slate-200 flex flex-col max-h-[85vh]">
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                >
                    <X size={18}/>
                </button>

                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <div className={`relative px-6 py-8 flex flex-col items-center justify-center text-center ${activeReports.length > 0 ? 'bg-rose-500' : 'bg-brand-blue'}`}>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
                        <div className="relative text-white space-y-1 mt-2">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">{house.block}-{house.number}</h2>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Kavling Rumah</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6 bg-white relative">
                        <div className="flex flex-wrap gap-2 justify-center pb-2 border-b border-slate-100">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${
                                house.status === 'Occupied' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                house.status === 'Business' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                                'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                                {house.status === 'Occupied' ? 'Dihuni' : house.status === 'Business' ? 'Tempat Usaha' : 'Rumah Kosong'}
                            </span>
                            {isAdmin && (
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${
                                    house.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                    house.paymentStatus === PaymentStatus.PENDING ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                    'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                    Iuran: {house.paymentStatus}
                                </span>
                            )}
                        </div>

                        {activeReports.length > 0 && (
                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
                                <div className="bg-rose-100 p-2 rounded-full">
                                    <AlertTriangle className="text-rose-500 shrink-0" size={20}/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-rose-700 text-sm">Laporan Aktif</h4>
                                    <ul className="text-xs text-rose-600 mt-1 list-disc pl-4 space-y-0.5">
                                        {activeReports.map(r => (
                                            <li key={r.id}>{r.type}: {r.description}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="bg-white p-3 rounded-xl text-slate-400 shadow-sm border border-slate-100"><User size={24}/></div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Kepala Keluarga</p>
                                    <p className="font-bold text-slate-800 text-lg leading-tight">{house.headOfFamily}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                                   <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Penghuni</p>
                                   <p className="font-bold text-slate-800 text-xl mt-1">{house.occupants} <span className="text-xs font-normal text-slate-500">Jiwa</span></p>
                               </div>
                               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                                   <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Telepon</p>
                                   <p className="font-bold text-slate-800 text-sm mt-2 break-all">{house.phone || '-'}</p>
                               </div>
                            </div>
                        </div>

                        <div className="pt-2 pb-2">
                            {isAdmin ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => { onClose(); onEditHouse?.(house); }} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 active:scale-95 transition-all">
                                        <Edit size={16}/> Edit Data
                                    </button>
                                    <button onClick={() => { onClose(); onPayDues?.(house); }} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 active:scale-95 transition-all">
                                        <DollarSign size={16}/> Catat Iuran
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => { onClose(); onReportHouse?.(house); }} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-rose-600 text-white font-bold shadow-lg shadow-rose-200 hover:bg-rose-500 hover:shadow-rose-300 active:scale-95 transition-all">
                                    <ShieldAlert size={20}/> Lapor Masalah di Rumah Ini
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface HouseCardProps {
    house: House;
    hasIssue: boolean;
    isAdmin: boolean;
    onClick: () => void;
}

// --- House Card Component (Tiny) ---
const HouseCard: React.FC<HouseCardProps> = ({ house, hasIssue, isAdmin, onClick }) => {
    const getHouseColor = () => {
        if (hasIssue) return "bg-rose-50 border-rose-500 text-rose-700 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse ring-1 ring-rose-400";
        if (house.status === 'Empty') return "bg-slate-100 border-slate-300 text-slate-400 border-dashed opacity-70";
        if (house.status === 'Business') return "bg-purple-50 border-purple-300 text-purple-700";
        return "bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-600";
    };

    return (
        <button
            onClick={onClick}
            className={`
                relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200
                min-h-[50px] w-full
                hover:scale-105 hover:shadow-md hover:z-10
                ${getHouseColor()}
            `}
        >
            <span className="text-sm font-black leading-none">{house.number}</span>
            <div className="flex items-center justify-center mt-1">
                {house.status === 'Business' ? <Store size={12} className="opacity-70"/> : <Home size={12} className="opacity-70"/>}
            </div>
            
            {/* Admin Indicator */}
            {isAdmin && (
                <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                    house.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-500' :
                    house.paymentStatus === PaymentStatus.PENDING ? 'bg-amber-500' : 'bg-rose-500'
                }`}></div>
            )}
            
            {/* Issue Indicator */}
            {hasIssue && (
                <div className="absolute -top-1 -left-1 text-rose-600 bg-white rounded-full"><AlertTriangle size={10} fill="currentColor"/></div>
            )}
        </button>
    );
};

interface BlockRendererProps {
    blockCode: string;
    houses: House[];
    reports: Report[];
    isAdmin: boolean;
    onSelect: (h: House) => void;
}

// --- Block Component ---
const BlockRenderer: React.FC<BlockRendererProps> = ({ blockCode, houses, reports, isAdmin, onSelect }) => {
    // Sort houses numerically
    const sortedHouses = [...houses].sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));

    return (
        <div className="flex flex-col h-full bg-white border-2 border-slate-800 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.2)] rounded-lg overflow-hidden">
            {/* Red Header */}
            <div className="bg-rose-600 text-white text-center py-1.5 border-b-2 border-slate-800 relative overflow-hidden">
                 <div className="absolute inset-0 bg-black/10 skew-x-12 scale-150 pointer-events-none"></div>
                 <h3 className="text-xl font-black tracking-tighter relative z-10 drop-shadow-md">{blockCode}</h3>
            </div>
            
            {/* Street Content */}
            <div className="flex-1 bg-slate-100 p-2 relative">
                 {/* Dashed Center Line (Street) */}
                 <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed border-slate-300 z-0"></div>
                 
                 <div className="grid grid-cols-2 gap-x-6 gap-y-2 relative z-10">
                     {sortedHouses.map(house => (
                         <HouseCard 
                            key={house.id} 
                            house={house} 
                            isAdmin={isAdmin} 
                            hasIssue={reports.some(r => r.houseId === house.id && r.status !== 'Selesai')}
                            onClick={() => onSelect(house)}
                         />
                     ))}
                 </div>
            </div>
        </div>
    );
};


export const HouseMap: React.FC<HouseMapProps> = ({ 
  houses, 
  isAdmin, 
  reports = [], 
  onEditHouse,
  onPayDues,
  onReportHouse
}) => {
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);

  // --- STATS ---
  const totalOccupied = houses.filter(h => h.status === 'Occupied').length;
  const totalBusiness = houses.filter(h => h.status === 'Business').length;
  const totalEmpty = houses.filter(h => h.status === 'Empty').length;
  const totalIssues = reports.filter(r => r.status !== 'Selesai').length;

  // Helper to filter houses by block
  const getBlockHouses = (code: string) => houses.filter(h => h.block === code);

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-200 overflow-hidden flex flex-col h-[700px]">
      {/* Header Info */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-20 shadow-sm">
        <div>
           <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <MapPin className="text-brand-blue" size={24}/> Denah Digital RT 002
           </h3>
           <p className="text-xs text-slate-500 font-medium">Klik nomor rumah untuk melihat detail informasi.</p>
        </div>
        
        <div className="flex gap-4 text-[10px] md:text-xs font-bold bg-slate-50 p-2 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar max-w-full">
           <div className="flex items-center gap-1.5 px-2 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span> {totalOccupied} Warga</div>
           <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm"></span> {totalBusiness} Usaha</div>
           <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-sm"></span> {totalEmpty} Kosong</div>
           {totalIssues > 0 && <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 text-rose-600 animate-pulse whitespace-nowrap"><AlertTriangle size={12}/> {totalIssues} Laporan</div>}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
           {/* Blueprint Background */}
           <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" style={{
               backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
               backgroundSize: '20px 20px'
           }}></div>
           
           {/* Map Container - Dashed Border (Physical Map Look) */}
           <div className="min-w-[900px] p-8">
               <div className="border-[6px] border-dashed border-amber-400 bg-amber-50/50 p-6 rounded-3xl relative">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-amber-900 px-4 py-1 rounded-full font-bold text-xs shadow-sm uppercase tracking-widest border border-amber-500">
                       Batas Wilayah RT 002 / RW 020
                   </div>

                   {/* Grid Layout based on Image */}
                   <div className="grid grid-cols-4 gap-6">
                       
                       {/* Column 1: Block C5 (Spans Full Height) */}
                       <div className="col-span-1 row-span-2">
                           <BlockRenderer blockCode="C5" houses={getBlockHouses('C5')} reports={reports} isAdmin={isAdmin} onSelect={setSelectedHouse} />
                       </div>

                       {/* Column 2: C7 & C8 */}
                       <div className="col-span-1 flex flex-col gap-6">
                           <BlockRenderer blockCode="C7" houses={getBlockHouses('C7')} reports={reports} isAdmin={isAdmin} onSelect={setSelectedHouse} />
                           <BlockRenderer blockCode="C8" houses={getBlockHouses('C8')} reports={reports} isAdmin={isAdmin} onSelect={setSelectedHouse} />
                       </div>

                       {/* Column 3: C9 & C10 */}
                       <div className="col-span-1 flex flex-col gap-6">
                           <BlockRenderer blockCode="C9" houses={getBlockHouses('C9')} reports={reports} isAdmin={isAdmin} onSelect={setSelectedHouse} />
                           <BlockRenderer blockCode="C10" houses={getBlockHouses('C10')} reports={reports} isAdmin={isAdmin} onSelect={setSelectedHouse} />
                       </div>

                       {/* Column 4: C11 & C12 */}
                       <div className="col-span-1 flex flex-col gap-6">
                           <BlockRenderer blockCode="C11" houses={getBlockHouses('C11')} reports={reports} isAdmin={isAdmin} onSelect={setSelectedHouse} />
                           <BlockRenderer blockCode="C12" houses={getBlockHouses('C12')} reports={reports} isAdmin={isAdmin} onSelect={setSelectedHouse} />
                       </div>
                   </div>
                   
                   {/* Legend / Compass */}
                   <div className="absolute bottom-4 right-4 opacity-20 pointer-events-none">
                       <div className="w-16 h-16 border-4 border-slate-800 rounded-full flex items-center justify-center relative">
                           <div className="absolute -top-3 bg-slate-800 text-white text-[10px] px-1 font-bold">U</div>
                           <div className="w-1 h-12 bg-slate-800"></div>
                           <div className="w-12 h-1 bg-slate-800 absolute"></div>
                       </div>
                   </div>
               </div>
           </div>
      </div>

      {/* Detail Modal */}
      {selectedHouse && (
          <HouseDetailModal 
            house={selectedHouse} 
            onClose={() => setSelectedHouse(null)}
            reports={reports}
            isAdmin={isAdmin}
            onEditHouse={onEditHouse}
            onPayDues={onPayDues}
            onReportHouse={onReportHouse}
          />
      )}
    </div>
  );
};
