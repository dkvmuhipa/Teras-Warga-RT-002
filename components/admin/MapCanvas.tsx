import React, { useRef, useEffect } from 'react';
import { House, MapPoint } from '../../types';

interface MapCanvasProps {
  houses: House[];
  mapPoints?: MapPoint[];
  onMarkerClick?: (houseId: string) => void;
}

const MapCanvas: React.FC<MapCanvasProps> = ({ houses, mapPoints, onMarkerClick }) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Placeholder for future map library integration
  useEffect(() => {
    // Initialize map here if needed
  }, []);

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diagmonds.png')]"
    >
      {/* Render house markers */}
      {houses.map((house) => (
        <div
          key={house.id}
          className="absolute w-4 h-4 bg-[var(--color-accent)] rounded-full cursor-pointer"
          style={{
            // Placeholder positioning; replace with real coordinates
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          onClick={() => onMarkerClick && onMarkerClick(house.id)}
          aria-label={`Marker for rumah ${house.block}-${house.number}`}
        />
      ))}
    </div>
  );
};

export default MapCanvas;
