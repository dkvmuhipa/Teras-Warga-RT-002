
import React, { useState, useEffect } from 'react';
import { House, PaymentStatus, Report } from '../types';
import { Home, MapPin, Store, X, AlertTriangle, User, Edit, DollarSign, ShieldAlert, ChevronRight, Info, ShieldCheck } from 'lucide-react';

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
                {/* Header Section (Fixed) */}
                <div className={`relative px-6 py-6 flex flex-col items-center justify-center text-center shrink-0 ${activeReports.length > 0 ? 'bg-rose-500' : 'bg-brand-blue'}`}>
                    <button 
                        onClick={onClose} 
                        className="absolute top-3 right-3 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                    >
                        <X size={18}/>
                    </button>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
                    
                    <div className="relative text-white space-y-1 mt-2">
                        <h2 className="text-4xl font-black tracking-tighter">{house.block}-{house.number}</h2>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
                            {house.status === 'Business' ? 'Tempat Usaha' : 'Kavling Rumah'}
                        </p>
                    </div>

                    {/* Status Badges - Absolute bottom overlap */}
                    <div className="absolute -bottom-4 left-0 right-0 flex justify-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm ${
                            house.status === 'Occupied' ? 'bg-white text-blue-600 border-blue-100' : 
                            house.status === 'Business' ? 'bg-white text-purple-600 border-purple-100' : 
                            'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                            {house.status === 'Occupied' ? 'Dihuni' : house.status === 'Business' ? 'Usaha' : 'Kosong'}
                        </span>
                        {isAdmin && (
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm ${
                                house.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                house.paymentStatus === PaymentStatus.PENDING ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                                'bg-rose-100 text-rose-700 border-rose-200'
                            }`}>
                                {house.paymentStatus}
                            </span>
                        )}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto custom-scrollbar flex-1 p-6 pt-8 space-y-5 bg-white">
                    
                    {/* Report / Safety Status Area */}
                    {activeReports.length > 0 ? (
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
                            <div className="bg-rose-100 p-2 rounded-full shadow-sm">
                                <AlertTriangle className="text-rose-500 shrink-0" size={24}/>
                            </div>
                            <div>
                                <h4 className="font-bold text-rose-700 text-sm">Perhatian: Ada Laporan</h4>
                                <ul className="text-xs text-rose-600 mt-1 list-disc pl-4 space-y-1">
                                    {activeReports.map(r => (
                                        <li key={r.id}><span className="font-semibold">{r.type}:</span> {r.description}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
                            <div className="bg-emerald-100 p-2.5 rounded-full shadow-sm shrink-0">
                                <ShieldCheck className="text-emerald-600" size={24}/>
                            </div>
                            <div>
                                <h4 className="font-bold text-emerald-700 text-sm">Status: Aman & Terkendali</h4>
                                <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">
                                    Tidak ada laporan gangguan keamanan atau fasilitas pada rumah ini.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* House Info Cards */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                            <div className="bg-white p-3 rounded-xl text-slate-400 shadow-sm border border-slate-100">
                                <User size={24}/>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Kepala Keluarga</p>
                                <p className="font-bold text-slate-800 text-base leading-tight">
                                    {house.headOfFamily}
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                           <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center shadow-sm">
                               <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Penghuni</p>
                               <p className="font-bold text-slate-800 text-xl mt-1">{house.occupants} <span className="text-xs font-normal text-slate-500">Jiwa</span></p>
                           </div>
                           <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center shadow-sm flex flex-col items-center justify-center">
                               <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Kontak</p>
                               <p className="font-bold text-slate-800 text-xs mt-1 break-all">{house.phone || '-'}</p>
                           </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions (Fixed) */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                    {isAdmin ? (
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => { onClose(); onEditHouse?.(house); }} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                                <Edit size={16}/> Edit Data
                            </button>
                            <button onClick={() => { onClose(); onPayDues?.(house); }} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 shadow-lg shadow-slate-200 transition-all">
                                <DollarSign size={16}/> Catat Iuran
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => { onClose(); onReportHouse?.(house); }} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-rose-600 text-white font-bold shadow-lg shadow-rose-200 hover:bg-rose-500 hover:shadow-rose-300 active:scale-95 transition-all">
                            <ShieldAlert size={18}/> Lapor Masalah / Darurat
                        </button>
                    )}
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
        if (hasIssue) return "bg-rose-50 border-rose-500 text-rose-700 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse ring-1 ring-rose-400 z-10";
        if (house.status === 'Empty') return "bg-slate-100 border-slate-300 text-slate-400 border-dashed opacity-70";
        if (house.status === 'Business') return "bg-purple-50 border-purple-300 text-purple-700";
        return "bg-white border-slate-300 text-slate-700 hover:border-brand-blue hover:text-brand-blue hover:shadow-md";
    };

    return (
        <button
            onClick={onClick}
            className={`
                relative flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all duration-200
                min-h-[48px] w-full
                hover:scale-105
                ${getHouseColor()}
            `}
        >
            <span className="text-xs md:text-sm font-black leading-none tracking-tight">{house.number}</span>
            
            {/* Tiny Icon */}
            <div className="flex items-center justify-center mt-1 opacity-80 scale-75">
                {house.status === 'Business' ? <Store size={14}/> : <Home size={14}/>}
            </div>
            
            {/* Admin Payment Indicator Dot */}
            {isAdmin && (
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full border border-white shadow-sm ${
                    house.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-500' :
                    house.paymentStatus === PaymentStatus.PENDING ? 'bg-amber-500' : 'bg-rose-500'
                }`}></div>
            )}
            
            {/* Issue Icon */}
            {hasIssue && (
                <div className="absolute -top-2 -right-2 text-rose-600 bg-white rounded-full p-0.5 shadow-sm border border-rose-100">
                    <AlertTriangle size={12} fill="currentColor"/>
                </div>
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
    // Helper sort
    const sortByNumber = (a: House, b: House) => parseInt(a.number, 10) - parseInt(b.number, 10);
    const sortByNumberDesc = (a: House, b: House) => parseInt(b.number, 10) - parseInt(a.number, 10);

    // --- LOGIKA U-SHAPE GENERIK ---
    const sortedHouses = [...houses].sort(sortByNumber);
    const splitIndex = Math.ceil(sortedHouses.length / 2);

    // Left: 01 s/d Mid (Ascending)
    const leftSide = sortedHouses.slice(0, splitIndex); 
    
    // Right: End s/d Mid+1 (Descending) - U-Turn logic
    const rightSide = sortedHouses.slice(splitIndex).sort(sortByNumberDesc); 

    return (
        <div className="flex flex-col h-full bg-white border-2 border-slate-800 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.2)] rounded-lg overflow-hidden transition-transform hover:-translate-y-1 duration-300">
            {/* Block Header */}
            <div className="bg-rose-600 text-white text-center py-1 border-b-2 border-slate-800 relative overflow-hidden shrink-0 h-10 flex flex-col justify-center">
                 <div className="absolute inset-0 bg-black/10 skew-x-12 scale-150 pointer-events-none"></div>
                 <h3 className="text-lg font-black tracking-tighter relative z-10 leading-none drop-shadow-md">{blockCode}</h3>
                 <p className="text-[8px] relative z-10 font-bold opacity-90 mt-0.5 tracking-wider">
                     {houses.length > 0 ? `${parseInt(sortedHouses[0].number)} - ${parseInt(sortedHouses[sortedHouses.length-1].number)}` : ''}
                 </p>
            </div>
            
            {/* Street Layout */}
            <div className="flex-1 bg-slate-100 p-2 relative overflow-y-auto custom-scrollbar">
                 {/* Center Line */}
                 <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed border-slate-300 z-0"></div>
                 
                 <div className="flex gap-3 relative z-10 h-full">
                    <div className="flex-1 flex flex-col gap-1.5 justify-start">
                        {leftSide.map(house => (
                            <HouseCard 
                                key={house.id} house={house} isAdmin={isAdmin} 
                                hasIssue={reports.some(r => r.houseId === house.id && r.status !== 'Selesai')}
                                onClick={() => onSelect(house)}
                            />
                        ))}
                    </div>
                     <div className="flex-1 flex flex-col gap-1.5 justify-end mt-auto">
                        {rightSide.map(house => (
                            <HouseCard 
                                key={house.id} house={house} isAdmin={isAdmin} 
                                hasIssue={reports.some(r => r.houseId === house.id && r.status !== 'Selesai')}
                                onClick={() => onSelect(house)}
                            />
                        ))}
                    </div>
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
  const [activeBlock, setActiveBlock] = useState<string>('ALL');

  // Fix: Use useEffect to set default block only if needed, or keeping 'ALL'
  // Currently defaulting to showing all blocks in the grid layout is better for the physical map look.

  // --- STATS ---
  const totalOccupied = houses.filter(h => h.status === 'Occupied').length;
  const totalBusiness = houses.filter(h => h.status === 'Business').length;
  const totalEmpty = houses.filter(h => h.status === 'Empty').length;
  const totalIssues = reports.filter(r => r.status !== 'Selesai').length;

  const getBlockHouses = (code: string) => houses.filter(h => h.block === code);
  
  // Extract unique blocks for sidebar
  // Explicitly defining the order as per physical map top-to-bottomish or numerical
  const blocks = ['C5', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'];

  const scrollToBlock = (blockId: string) => {
      setActiveBlock(blockId);
      // Logic to scroll to specific block if we were in a list view, 
      // but here we are in a grid. We can highlight it.
      // For now, simple state set is enough if we want to add highlighting later.
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-200 overflow-hidden flex flex-col h-[750px]">
      {/* Header Info */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 md:px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-20 shadow-sm shrink-0">
        <div>
           <h3 className="text-lg md:text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <MapPin className="text-brand-blue" size={24}/> Denah Digital RT 002
           </h3>
           <p className="text-xs text-slate-500 font-medium">Klik rumah untuk melihat detail & status.</p>
        </div>
        
        <div className="flex gap-3 text-[10px] md:text-xs font-bold bg-slate-50 p-2 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar w-full md:w-auto">
           <div className="flex items-center gap-1.5 px-2 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span> {totalOccupied} Warga</div>
           <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm"></span> {totalBusiness} Usaha</div>
           <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-sm"></span> {totalEmpty} Kosong</div>
           {totalIssues > 0 && <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 text-rose-600 animate-pulse whitespace-nowrap"><AlertTriangle size={12}/> {totalIssues} Laporan</div>}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar Navigation (Blocks) */}
          <div className="w-16 bg-slate-50 border-r border-slate-100 flex flex-col items-center py-4 gap-2 overflow-y-auto no-scrollbar shrink-0 z-10">
              <span className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider -rotate-90 py-4">Blok</span>
              {blocks.map(b => (
                  <button 
                    key={b} 
                    onClick={() => scrollToBlock(b)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                        activeBlock === b 
                        ? 'bg-slate-800 text-white shadow-lg scale-110' 
                        : 'bg-white border border-slate-200 text-slate-500 hover:border-brand-blue hover:text-brand-blue'
                    }`}
                  >
                      {b}
                  </button>
              ))}
          </div>

          {/* Map Area */}
          <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar p-4 md:p-8">
               {/* Blueprint Pattern */}
               <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" style={{
                   backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                   backgroundSize: '20px 20px'
               }}></div>
               
               {/* Map Container */}
               <div className="min-w-[800px] mx-auto">
                   <div className="border-[6px] border-dashed border-amber-400 bg-amber-50/50 p-6 md:p-8 rounded-[2rem] relative transition-all">
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-amber-900 px-6 py-1.5 rounded-full font-bold text-xs shadow-md uppercase tracking-widest border-2 border-white ring-2 ring-amber-400/30">
                           Batas Wilayah RT 002 / RW 020
                       </div>

                       {/* Grid Layout conforming to physical map */}
                       <div className="grid grid-cols-4 gap-4 md:gap-6 h-[550px]">
                           
                           {/* Column 1: Block C5 (Tall) */}
                           <div className={`col-span-1 row-span-2 transition-opacity duration-500 ${activeBlock !== 'ALL' && activeBlock !== 'C5' ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}>
                               <BlockRenderer blockCode="C5" houses={getBlockHouses('C5')} reports={reports} isAdmin={isAdmin} onSelect={setSelectedHouse} />
                           </div>

                           {/* Column 2: C7 & C8 */}
                           <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                               <div className={`flex-1 transition-opacity duration-500 ${activeBlock !== 'ALL' && activeBlock !== 'C7' ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}>
                                    <BlockRenderer blockCode="C7" houses={getBlockHouses('C7')} reports={reports} isAdmin={isAdmin} onSelect={setSelectedHouse} />
                               </div>
                               <div className={`flex-1 transition-opacity duration-500 ${activeBlock !== 'ALL' && activeBlock !== 'C8' ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}>
                                    <BlockRenderer blockCode="C8" houses={getBlockHouses('C8')} reports={reports} isAdmin={isAdmin} onSelect={setSelectedHouse} />
                               </div>
                           </div>

                           {/* Column 3: C9 & C10 */}
                           <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                               <div className={`flex-1 transition-opacity duration-500 ${activeBlock !== 'ALL' && activeBlock !== 'C9' ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}>
                                   <BlockRenderer blockCode="C9" houses={getBlockHouses('C9')} reports={reports} isAdmin={isAdmin} onSelect={setSelectedHouse} />
                               </div>
                               <div className={`flex-1 transition-opacity duration-500 ${activeBlock !== 'ALL' && activeBlock !== 'C10' ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}>
                                   <BlockRenderer blockCode="C10" houses={getBlockHouses('C10')} reports={reports} isAdmin={isAdmin} onSelect={setSelectedHouse} />
                               </div>
                           </div>

                           {/* Column 4: C11 & C12 */}
                           <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                               <div className={`flex-1 transition-opacity duration-500 ${activeBlock !== 'ALL' && activeBlock !== 'C11' ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}>
                                   <BlockRenderer blockCode="C11" houses={getBlockHouses('C11')} reports={reports} isAdmin={isAdmin} onSelect={setSelectedHouse} />
                               </div>
                               <div className={`flex-1 transition-opacity duration-500 ${activeBlock !== 'ALL' && activeBlock !== 'C12' ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}>
                                   <BlockRenderer blockCode="C12" houses={getBlockHouses('C12')} reports={reports} isAdmin={isAdmin} onSelect={setSelectedHouse} />
                               </div>
                           </div>
                       </div>
                       
                       {/* Compass */}
                       <div className="absolute bottom-4 right-4 opacity-30 pointer-events-none">
                           <div className="w-14 h-14 border-4 border-slate-800 rounded-full flex items-center justify-center relative">
                               <div className="absolute -top-3 bg-slate-800 text-white text-[10px] px-1 font-bold">U</div>
                               <div className="w-0.5 h-10 bg-slate-800"></div>
                               <div className="w-10 h-0.5 bg-slate-800 absolute"></div>
                           </div>
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
