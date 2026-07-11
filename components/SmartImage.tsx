import React, { useState } from 'react';
import { ImageIcon, FileText, Loader2, ExternalLink, ZoomIn, ZoomOut, RotateCw, Download, Copy, Check, X, Maximize2, Minimize2 } from 'lucide-react';
import { getDriveThumbnail, getDriveId } from '../services/pdfService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ElementType;
  width?: number; // Adaptive resolution, e.g., 200, 400, 800, 1600
}

export const SmartImage: React.FC<SmartImageProps> = ({ 
  src, 
  alt, 
  className = "", 
  fallbackIcon: FallbackIcon = ImageIcon,
  width = 800
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Lightbox view state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const driveId = getDriveId(src);
  // Get adaptive thumbnail size for better loading performance, but use full source for raw download/view
  const displayUrl = driveId ? getDriveThumbnail(src, width) : src;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(src);
      setIsCopied(true);
      toast.success("Tautan gambar berhasil disalin!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Gagal menyalin tautan.");
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      toast.info("Mengunduh gambar...");
      const response = await fetch(src, { mode: 'cors', referrerPolicy: 'no-referrer' });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = alt.toLowerCase().replace(/[^a-z0-9]/gi, '_') + '.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: Open in new window
      window.open(src, '_blank');
    }
  };

  const handleResetLightbox = () => {
    setZoom(1);
    setRotation(0);
  };

  if (!src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 border border-slate-200/50 rounded-2xl ${className}`}>
        <FallbackIcon size={24} strokeWidth={1.5} className="opacity-60" />
        <span className="text-[9px] font-black mt-1.5 uppercase tracking-wider opacity-40">No Image</span>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`relative overflow-hidden group cursor-zoom-in ${className}`}
        onClick={() => {
          if (!hasError && !isLoading) {
            setIsLightboxOpen(true);
            handleResetLightbox();
          }
        }}
      >
        {/* Modern Pulse Skeleton Placeholder */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-100/80 animate-pulse flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-indigo-100 rounded-full animate-ping absolute opacity-75"></div>
              <FallbackIcon size={20} className="text-indigo-400 animate-pulse relative z-10" />
            </div>
            <span className="text-[8px] font-black text-indigo-400/80 uppercase tracking-widest mt-3.5">Memuat Media...</span>
          </div>
        )}
        
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400/70 border border-slate-150 rounded-2xl p-4 text-center">
            <FallbackIcon size={28} className="text-slate-300 stroke-1.5" />
            <p className="text-[9px] mt-2 font-black uppercase tracking-wider text-slate-400">Gagal Memuat</p>
          </div>
        ) : (
          <img 
            src={displayUrl} 
            alt={alt}
            loading="lazy"
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}

        {/* Overlay for Google Drive Source Indicator */}
        {driveId && !isLoading && !hasError && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <div className="bg-white/90 backdrop-blur-md px-1.5 py-1 rounded-lg shadow-sm border border-slate-100 text-indigo-600 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider scale-90 group-hover:scale-95 transition-transform" title="Disimpan Aman di Google Drive">
              <FileText size={10} />
              <span>Drive</span>
            </div>
          </div>
        )}
        
        {/* Beautiful Hover Action overlay */}
        {!isLoading && !hasError && (
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 bg-white/95 backdrop-blur-sm rounded-full text-slate-800 shadow-xl flex items-center justify-center border border-white/40"
            >
              <ExternalLink size={16} className="text-slate-700" />
            </motion.div>
          </div>
        )}
      </div>

      {/* Advanced Lightbox Portal / Dialog with AnimatePresence */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div className="fixed inset-0 z-[9999] flex flex-col justify-between items-center bg-slate-950/95 backdrop-blur-md p-4 select-none">
            {/* Header Controls */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-5xl flex items-center justify-between py-2 border-b border-white/10"
            >
              <div className="text-left">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Pratinjau Media</span>
                <h4 className="text-sm font-black text-white truncate max-w-[200px] sm:max-w-md">{alt}</h4>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Custom Action buttons inside lightbox */}
                <button 
                  onClick={handleCopyLink}
                  className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all cursor-pointer"
                  title="Salin Tautan"
                >
                  {isCopied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                </button>
                <button 
                  onClick={handleDownload}
                  className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all cursor-pointer"
                  title="Unduh Gambar"
                >
                  <Download size={18} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button 
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-2 bg-red-500/20 hover:bg-red-500 rounded-xl text-red-400 hover:text-white transition-all cursor-pointer"
                  title="Tutup"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>

            {/* Main Interactive Stage */}
            <div className="flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-4 relative">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 180 }}
                className="relative max-h-full max-w-full flex items-center justify-center"
              >
                <img 
                  src={src} // Load full resolution in Lightbox
                  alt={alt}
                  referrerPolicy="no-referrer"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  className="max-h-[70vh] sm:max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/5"
                  onClick={(e) => e.stopPropagation()}
                />
              </motion.div>
            </div>

            {/* Bottom Controls Panel */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-slate-900/90 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-5 shadow-2xl backdrop-blur-md"
            >
              <button 
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                disabled={zoom <= 0.5}
                className="p-2 hover:bg-white/10 rounded-xl text-white disabled:opacity-40 transition-colors cursor-pointer"
                title="Perkecil"
              >
                <ZoomOut size={16} />
              </button>
              
              <span className="text-xs font-mono font-black text-indigo-300 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              
              <button 
                onClick={() => setZoom(prev => Math.min(4, prev + 0.25))}
                disabled={zoom >= 4}
                className="p-2 hover:bg-white/10 rounded-xl text-white disabled:opacity-40 transition-colors cursor-pointer"
                title="Perbesar"
              >
                <ZoomIn size={16} />
              </button>

              <div className="w-px h-5 bg-white/10"></div>

              <button 
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors cursor-pointer animate-none"
                title="Putar 90°"
              >
                <RotateCw size={16} />
              </button>

              <div className="w-px h-5 bg-white/10"></div>

              <button 
                onClick={handleResetLightbox}
                className="text-[9px] font-black uppercase tracking-wider text-white bg-white/5 hover:bg-white/15 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Reset Tampilan
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
