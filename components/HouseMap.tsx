

import React, { useState } from 'react';
import { House, PaymentStatus, Report } from '../types';
import { CheckCircle, Home, MapPin, Store, MinusCircle, User, Info, ChevronDown, ChevronUp, Filter, AlertTriangle } from 'lucide-react';

interface HouseMapProps {
  houses: House[];
  isAdmin: boolean;
  onHouseClick?: (house: House) => void;
  reports?: Report[]; // Add reports prop to link issues to houses
}

export const HouseMap: React.FC<HouseMapProps> = ({ houses, isAdmin, onHouseClick, reports = [] }) => {
  const [selectedBlock, setSelectedBlock] = useState<string>('All');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  
  // Sort blocks numerically (e.g. C5 before C10)
  const allBlocks = Array.from(new Set(houses.map(h => h.block))).sort((a: string, b: string) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  const blocksToShow = selectedBlock === 'All' ? allBlocks : [selectedBlock];

  // Stats
  const totalOccupied = houses.filter(h => h.status === 'Occupied').length;
  const totalBusiness = houses.filter(h => h.status === 'Business').length;
  const totalEmpty = houses.filter(h => h.status === 'Empty').length;

  const getStatusStyles = (house: House, hasActiveReport: boolean) => {
    // If there is an issue/report, override style with warning style
    if (hasActiveReport) {
      return 'bg-rose-50 border-rose-500 ring-2 ring-rose-200 text-rose-700 shadow-md shadow-rose-100 z-10 animate-pulse';
    }

    // ADMIN VIEW: Focus on Payment
    if (isAdmin) {
      if (house.paymentStatus === PaymentStatus.PAID) {
        return 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:shadow-emerald-200';
      }
      if (house.paymentStatus === PaymentStatus.PENDING) {
        return 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 hover:shadow-amber-200';
      }
      return 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 hover:shadow-rose-200';
    }

    // PUBLIC VIEW: Focus on Occupancy
    if (house.status === 'Empty') {
      return 'bg-slate-50 border-slate-300 text-slate-400 border-dashed hover:bg-slate-100';
    }
    if (house.status === 'Business') {
      return 'bg-white border-purple-300 text-purple-700 shadow-sm shadow-purple-100 hover:bg-purple-50 hover:border-purple-400 hover:shadow-md';
    }
    // Occupied
    return 'bg-white border-sky-300 text-sky-700 shadow-sm shadow-sky-100 hover:bg-sky-50 hover:border-sky-400 hover:shadow-md';
  };

  const getStatusIcon = (house: House, hasActiveReport: boolean) => {
    if (hasActiveReport) return <AlertTriangle size={16} className="text-rose-600 fill-rose-100" />;
    if (house.status === 'Business') return <Store size={14} />;
    if (house.status === 'Empty') return <MinusCircle size={14} />;
    return <Home size={14} />;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden animate-slide-up transition-all duration-300">
      {/* Header & Filter */}
      <div className="p-5 border-b border-slate-100 bg-white relative z-20">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 mb-1">
              <div className="bg-brand-blue text-white p-1.5 rounded-lg shadow-md shadow-blue-200">
                 <MapPin size={20} />
              </div>
              Denah Digital Warga
            </h3>
            <p className="text-slate-500 text-sm font-medium">Status hunian real-time RT 002.</p>
          </div>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-full transition-colors"
          >
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>

        {/* Collapsible Stats & Filter */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0'}`}>
           <div className="flex flex-col gap-3">
              {/* Mini Stats */}
              <div className="flex flex-wrap gap-3 text-[10px] sm:text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 self-start">
                <div className="flex items-center gap-1.5 px-1">
                    <div className="w-2 h-2 rounded-full bg-sky-500"></div> {totalOccupied} Dihuni
                </div>
                <div className="w-px h-3 bg-slate-300"></div>
                <div className="flex items-center gap-1.5 px-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div> {totalBusiness} Usaha
                </div>
                <div className="w-px h-3 bg-slate-300"></div>
                <div className="flex items-center gap-1.5 px-1">
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div> {totalEmpty} Kosong
                </div>
              </div>

              {/* Block Filter Scrollable */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar mask-gradient-right">
                <Filter size={14} className="text-slate-400 shrink-0"/>
                <button 
                  onClick={() => setSelectedBlock('All')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${selectedBlock === 'All' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  Semua
                </button>
                {allBlocks.map(block => (
                  <button
                    key={block}
                    onClick={() => setSelectedBlock(block)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${selectedBlock === block ? 'bg-brand-blue text-white border-brand-blue shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    Blok {block}
                  </button>
                ))}
              </div>
           </div>
        </div>
      </div>

      {/* Map Content - Parent Group used for scroll gradient */}
      <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[450px]' : 'max-h-0'} bg-slate-50/50 relative group`}>
        <div className="overflow-y-auto max-h-[450px] p-5 custom-scrollbar pb-24">
            {blocksToShow.map((block) => {
              const blockHouses = houses.filter(h => h.block === block);
              const minNum = blockHouses[0]?.number;
              const maxNum = blockHouses[blockHouses.length - 1]?.number;
              
              return (
                <div key={block} className="mb-8 last:mb-0 animate-fade-in">
                  <div className="flex items-center gap-3 mb-3 sticky top-0 z-10 py-2 -mx-2 px-2 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/50">
                    <span className="text-xs font-black text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm flex items-center gap-1.5">
                      BLOK {block}
                      {minNum && maxNum && (
                        <span className="text-[10px] text-slate-400 font-medium border-l border-slate-200 pl-1.5">
                           ({minNum} - {maxNum})
                        </span>
                      )}
                    </span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {blockHouses.map((house) => {
                      // Check for active reports linked to this house
                      const activeReport = reports.find(r => r.houseId === house.id && r.status !== 'Selesai');
                      const hasIssue = !!activeReport;

                      return (
                        <button
                          key={house.id}
                          onClick={() => onHouseClick && onHouseClick(house)}
                          className={`
                            group/house relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200
                            hover:-translate-y-0.5 hover:z-20 w-full aspect-square
                            ${getStatusStyles(house, hasIssue)}
                          `}
                        >
                          {/* Alert Badge Overlay */}
                          {hasIssue && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                            </span>
                          )}

                          <div className="flex flex-col items-center gap-1">
                              <span className="text-lg font-black tracking-tighter leading-none">{house.number}</span>
                              <div className="opacity-70 group-hover/house:scale-110 transition-transform">
                                 {getStatusIcon(house, hasIssue)}
                              </div>
                          </div>

                          {/* Hover Detail Tooltip - FIXED POSITION (Below Icon) */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover/house:block w-40 z-50 pointer-events-none">
                              <div className="bg-slate-800 text-white p-2.5 rounded-lg shadow-xl border border-slate-700 text-left relative">
                                  {/* Triangle pointing UP */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div>
                                  
                                  <div className="flex items-center gap-2 mb-2 border-b border-slate-600 pb-1.5">
                                      <div className={`p-1 rounded bg-white/10`}>
                                         {getStatusIcon(house, hasIssue)}
                                      </div>
                                      <div>
                                          <p className="font-bold text-xs">{house.block}-{house.number}</p>
                                          <p className="text-[10px] text-slate-400">
                                            {hasIssue ? 'ADA LAPORAN' : (house.status === 'Empty' ? 'Kosong' : 'Dihuni')}
                                          </p>
                                      </div>
                                  </div>
                                  
                                  <div className="space-y-0.5">
                                      {hasIssue ? (
                                        <p className="text-[10px] text-rose-300 font-bold bg-rose-500/10 p-1 rounded border border-rose-500/20">
                                          ⚠ {activeReport.type}: {activeReport.description.substring(0, 30)}...
                                        </p>
                                      ) : (
                                        <p className="text-[10px] flex items-center gap-1.5 text-slate-300">
                                            <User size={10} className="text-slate-500"/> 
                                            <span className="truncate">{house.headOfFamily}</span>
                                        </p>
                                      )}
                                      
                                      {isAdmin && (
                                          <div className="mt-1 pt-1 border-t border-slate-600 flex justify-between items-center">
                                              <span className="text-[9px] text-slate-500 font-bold uppercase">Iuran</span>
                                              <span className={`text-[9px] font-bold ${house.paymentStatus === PaymentStatus.PAID ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                  {house.paymentStatus}
                                              </span>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
        {/* Scroll Indicator Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-100 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Legend Footer */}
      {isExpanded && (
        <div className="bg-white border-t border-slate-100 p-3 animate-fade-in relative z-20">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] sm:text-xs font-bold text-slate-500">
                {isAdmin ? (
                   <>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-300 flex items-center justify-center"><CheckCircle size={8} className="text-emerald-600"/></div> Lunas</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-50 border border-rose-300 flex items-center justify-center"><MinusCircle size={8} className="text-rose-600"/></div> Belum</div>
                   </>
                ) : (
                    <>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-white border border-sky-300 flex items-center justify-center"><Home size={8} className="text-sky-600"/></div> Dihuni</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-white border border-purple-300 flex items-center justify-center"><Store size={8} className="text-purple-600"/></div> Usaha</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center"><MinusCircle size={8} className="text-slate-400"/></div> Kosong</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-50 border border-rose-500 flex items-center justify-center"><AlertTriangle size={8} className="text-rose-600"/></div> Ada Laporan</div>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
};