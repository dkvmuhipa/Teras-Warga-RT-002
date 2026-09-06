import React from 'react';
import { House, Report, Official, MapPoint } from '../../types';
import { PublicEarthquake } from './PublicEarthquake';

interface PublicMapProps {
  houses?: House[];
  reports?: Report[];
  officials?: Official[];
  mapPoints?: MapPoint[];
  iuranPayments?: any[];
}

export const PublicMap: React.FC<PublicMapProps> = () => {
  return <PublicEarthquake defaultTab="evacuation" />;
};
