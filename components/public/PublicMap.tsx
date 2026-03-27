import React from 'react';
import { House, Report, Official, MapPoint } from '../../types';
import { HouseMap } from '../HouseMap';

interface PublicMapProps {
  houses: House[];
  reports: Report[];
  officials: Official[];
  mapPoints: MapPoint[];
  iuranPayments?: any[];
}

export const PublicMap: React.FC<PublicMapProps> = ({ houses, reports, officials, mapPoints, iuranPayments }) => {
  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-8 mb-24">
      <h2 className="text-2xl font-black text-slate-800 mb-6 px-2 md:px-0 no-print">Peta Wilayah RT 02</h2>
      <HouseMap 
        houses={houses} 
        isAdmin={false} 
        reports={reports} 
        officials={officials} 
        mapPoints={mapPoints}
        iuranPayments={iuranPayments}
      />
    </div>
  );
};
