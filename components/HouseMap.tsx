
import React, { useState, useRef } from 'react';
import { House, PaymentStatus, Report } from '../types';
import { CheckCircle, Home, MapPin, Store, MinusCircle, User, Info, AlertTriangle, X, ArrowRight, DollarSign, Edit, ShieldAlert } from 'lucide-react';

interface HouseMapProps {
  houses: House[];
  isAdmin: boolean;
  reports?: Report[];
  onEditHouse?: (house: House) => void;
  onPayDues?: (house: House) => void;
  onReportHouse?: (house: House) => void;
}

export const HouseMap: React.FC<HouseMapProps> = ({ 
  houses, 
  isAdmin, 
  reports = [], 
  onEditHouse,
  onPayDues,
  onReportHouse
}) => {
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [activeBlock, setActiveBlock] = useState<string>(''); // For scroll spy or selection
  
  // Sort blocks numerically
  const allBlocks: string[] = Array.from(new Set(houses.map(h => h.block))).sort((a: string, b: string) => 
    a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })
  );

  // Set default block if none
  if (!activeBlock && allBlocks.length > 0) setActiveBlock(allBlocks[0]);

  const scrollToBlock = (blockId: string) => {
    setActiveBlock(blockId);
    const element = document.getElementById(`block-${blockId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // --- STATS ---
  const totalOccupied = houses.filter(h => h.status === 'Occupied').length;
  const totalBusiness = houses.filter(h => h.status === 'Business').length;
  const totalEmpty = houses.filter(h => h.status === 'Empty').length;
  const totalIssues = reports.filter(r => r.status !== 'Selesai').length;

  const getHouseColor = (house: House, hasIssue: boolean) => {
      if (hasIssue) return "bg-rose-100 border-rose-500 text-rose-700 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse";
      if (house.status === 'Empty') return "bg-slate-100 border-slate-300 text-slate-400 border-dashed opacity-80";
      if (house.status === 'Business') return "bg-purple-50 border-purple-400 text-purple-700 shadow-sm";
      return "bg-white border-blue-300 text-slate-700 shadow-sm";
  };

  const HouseDetailModal = ({ house, onClose }: { house: House, onClose: () => void }) => {
      const activeReports = reports.filter(r => r.houseId === house.id && r.status !== 'Selesai');
      
      return (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 sm:p-6">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-slide-up ring-1 ring-slate-200">
                  {/* Header */}
                  <div className={`h-24 relative overflow-hidden flex items-center justify-center ${activeReports.length > 0 ? 'bg-rose-500' : 'bg-brand-blue'}`}>
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                      <div className="relative text-center text-white">
                          <h2 className="text-4xl font-black tracking-tighter">{house.block}-{house.number}</h2>
                          <p className="text-xs font-medium uppercase tracking-widest opacity-90">Kavling Rumah</p>
                      </div>
                      <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 text-white p-2 rounded-full transition-colors">
                          <X size={18}/>
                      </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-6">
                      {/* Status Tags */}
                      <div className="flex flex-wrap gap-2 justify-center -mt-10 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                              house.status === 'Occupied' ? 'bg-white text-blue-600 border-blue-100' : 
                              house.status === 'Business' ? 'bg-white text-purple-600 border-purple-100' : 
                              'bg-white text-slate-400 border-slate-200'
                          }`}>
                              {house.status === 'Occupied' ? 'Dihuni' : house.status === 'Business' ? 'Tempat Usaha' : 'Rumah Kosong'}
                          </span>
                          {isAdmin && (
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                                  house.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                  house.paymentStatus === PaymentStatus.PENDING ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                                  'bg-rose-100 text-rose-700 border-rose-200'
                              }`}>
                                  Iuran: {house.paymentStatus}
                              </span>
                          )}
                      </div>

                      {/* Active Issues Warning */}
                      {activeReports.length > 0 && (
                          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
                              <AlertTriangle className="text-rose-500 shrink-0" size={20}/>
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

                      {/* Info Details */}
                      <div className="space-y-4">
                          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <div className="bg-white p-2 rounded-lg text-slate-400 shadow-sm"><User size={20}/></div>
                              <div>
                                  <p className="text-[10px] text-slate-400 uppercase font-bold">Kepala Keluarga</p>
                                  <p className="font-bold text-slate-800 text-lg">{house.headOfFamily}</p>
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                                 <p className="text-[10px] text-slate-400 uppercase font-bold">Jumlah Penghuni</p>
                                 <p className="font-bold text-slate-800 text-lg">{house.occupants} Jiwa</p>
                             </div>
                             <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                                 <p className="text-[10px] text-slate-400 uppercase font-bold">No. Handphone</p>
                                 <p className="font-bold text-slate-800 text-sm mt-1">{house.phone || '-'}</p>
                             </div>
                          </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2">
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
                              <button onClick={() => { onClose(); onReportHouse?.(house); }} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-rose-600 text-white font-bold shadow-lg shadow-rose-200 hover:bg-rose-500 hover:shadow-rose-300 active:scale-95 transition-all">
                                  <ShieldAlert size={18}/> Lapor Masalah di Rumah Ini
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-200 overflow-hidden flex flex-col h-[600px] md:h-[700px]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-20 shadow-sm relative">
        <div>
           <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <MapPin className="text-brand-blue" size={24}/> Denah Digital Warga
           </h3>
           <p className="text-xs text-slate-500 font-medium">Klik nomor rumah untuk melihat detail informasi.</p>
        </div>
        
        <div className="flex gap-4 text-[10px] md:text-xs font-bold bg-slate-50 p-2 rounded-xl border border-slate-100">
           <div className="flex items-center gap-1.5 px-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span> {totalOccupied} Dihuni</div>
           <div className="flex items-center gap-1.5 px-2 border-l border-slate-200"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm"></span> {totalBusiness} Usaha</div>
           <div className="flex items-center gap-1.5 px-2 border-l border-slate-200"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-sm"></span> {totalEmpty} Kosong</div>
           {totalIssues > 0 && <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 text-rose-600 animate-pulse"><AlertTriangle size={12}/> {totalIssues} Laporan</div>}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar Nav */}
          <div className="w-16 md:w-20 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-6 gap-3 overflow-y-auto no-scrollbar z-10 shadow-inner">
             {allBlocks.map(block => (
                 <button
                    key={block}
                    onClick={() => scrollToBlock(block)}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xs md:text-sm font-black transition-all duration-300 ${
                        activeBlock === block 
                        ? 'bg-brand-blue text-white shadow-lg shadow-blue-300 scale-110' 
                        : 'bg-white text-slate-400 border border-slate-200 hover:border-brand-blue hover:text-brand-blue'
                    }`}
                 >
                     {block}
                 </button>
             ))}
          </div>

          {/* Map Area - Blueprint Style */}
          <div className="flex-1 overflow-y-auto bg-slate-50 relative custom-scrollbar scroll-smooth">
               {/* Blueprint Grid Background */}
               <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{
                   backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
                   backgroundSize: '20px 20px'
               }}></div>

               <div className="p-6 md:p-10 pb-32 space-y-12">
                   {allBlocks.map(block => {
                       const blockHouses = houses
                           .filter(h => h.block === block)
                           .sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));

                       return (
                           <div key={block} id={`block-${block}`} className="relative">
                               {/* Block Label */}
                               <div className="flex items-center gap-4 mb-6">
                                   <div className="bg-slate-800 text-white px-4 py-1.5 rounded-lg shadow-lg font-black text-sm tracking-wide z-10">
                                       BLOK {block}
                                   </div>
                                   <div className="h-px flex-1 bg-slate-300 border-b border-dashed border-slate-200"></div>
                               </div>

                               {/* Grid Layout */}
                               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                                   {blockHouses.map(house => {
                                       const hasIssue = reports.some(r => r.houseId === house.id && r.status !== 'Selesai');
                                       
                                       return (
                                           <button
                                               key={house.id}
                                               onClick={() => setSelectedHouse(house)}
                                               className={`
                                                   relative group flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-300
                                                   hover:-translate-y-1 hover:shadow-lg
                                                   ${getHouseColor(house, hasIssue)}
                                               `}
                                           >
                                               {/* Roof Icon */}
                                               <div className={`mb-1 opacity-80 transition-transform group-hover:scale-110 ${house.status === 'Empty' ? 'opacity-30' : ''}`}>
                                                   {house.status === 'Business' ? <Store size={24}/> : <Home size={24}/>}
                                               </div>
                                               
                                               {/* Number */}
                                               <span className="text-lg font-black tracking-tighter leading-none">{house.number}</span>
                                               
                                               {/* Label Status (Optional small text) */}
                                               <span className="text-[9px] font-bold uppercase mt-1 opacity-60">
                                                   {hasIssue ? 'Masalah' : (house.status === 'Business' ? 'Usaha' : house.status === 'Empty' ? 'Kosong' : 'Warga')}
                                               </span>

                                               {/* Status Dot (Admin: Payment, Public: Occupancy) */}
                                               {isAdmin && (
                                                   <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${
                                                       house.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-500' :
                                                       house.paymentStatus === PaymentStatus.PENDING ? 'bg-amber-500' : 'bg-rose-500'
                                                   }`}></div>
                                               )}

                                               {/* Alert Badge */}
                                               {hasIssue && (
                                                   <div className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white p-1 rounded-full shadow-sm animate-bounce">
                                                       <AlertTriangle size={10} fill="currentColor"/>
                                                   </div>
                                               )}
                                           </button>
                                       )
                                   })}
                               </div>
                           </div>
                       )
                   })}
               </div>
          </div>
      </div>

      {/* Detail Modal */}
      {selectedHouse && (
          <HouseDetailModal 
            house={selectedHouse} 
            onClose={() => setSelectedHouse(null)} 
          />
      )}
    </div>
  );
};
