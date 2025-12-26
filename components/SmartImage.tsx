
import React, { useState } from 'react';
import { ImageIcon, FileText, Loader2, ExternalLink } from 'lucide-react';
import { getDriveThumbnail, getDriveId } from '../services/pdfService';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ElementType;
}

export const SmartImage: React.FC<SmartImageProps> = ({ src, alt, className = "", fallbackIcon: FallbackIcon = ImageIcon }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const driveId = getDriveId(src);
  const displayUrl = driveId ? getDriveThumbnail(src) : src;

  if (!src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 ${className}`}>
        <FallbackIcon size={32} strokeWidth={1.5} />
        <span className="text-[10px] font-bold mt-2 uppercase tracking-widest opacity-50">No Image</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden group ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
          <Loader2 size={24} className="text-slate-300 animate-spin" />
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 z-20">
          <FallbackIcon size={32} />
          <p className="text-[8px] mt-2 font-bold uppercase">Load Failed</p>
        </div>
      ) : (
        <img 
          src={displayUrl} 
          alt={alt}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}

      {/* Overlay for Drive Links */}
      {driveId && !isLoading && !hasError && (
        <div className="absolute top-2 right-2 z-20">
            <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm border border-white/50 text-blue-600" title="Google Drive File">
                <FileText size={14} />
            </div>
        </div>
      )}
      
      {/* Quick View Button on Hover */}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <a 
            href={src} 
            target="_blank" 
            rel="noreferrer" 
            className="p-3 bg-white rounded-full text-slate-800 shadow-xl transform scale-75 group-hover:scale-100 transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={20} />
          </a>
      </div>
    </div>
  );
};
