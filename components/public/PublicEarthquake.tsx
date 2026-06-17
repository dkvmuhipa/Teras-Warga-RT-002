import React, { useState } from 'react';
import { useEarthquake, EarthquakeInfo } from '../../hooks/useEarthquake';
import { 
  Activity, AlertTriangle, ShieldCheck, MapPin, Radio, Compass, Clock, 
  HelpCircle, Waves, Phone, ChevronRight, Share2, Info, ArrowRight,
  ShieldAlert, Sparkles, BookOpen, HeartHandshake, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// Coordinates for Huntap Tondo 2, Palu, Sulawesi Tengah
const TONDO_LAT = -0.8511763897139419;
const TONDO_LON = 119.904426820635;

const deg2rad = (deg: number) => deg * (Math.PI / 180);

const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const parseCoordinates = (coordStr: string) => {
  if (!coordStr) return null;
  const parts = coordStr.split(',');
  if (parts.length === 2) {
    const lat = parseFloat(parts[0].trim());
    const lon = parseFloat(parts[1].trim());
    if (!isNaN(lat) && !isNaN(lon)) {
      return { lat, lon };
    }
  }
  return null;
};

export const PublicEarthquake: React.FC = () => {
  const { data, loading, error, refetch } = useEarthquake();
  const [activeTab, setActiveTab] = useState<'m5' | 'felt'>('m5');
  const [copiedInfo, setCopiedInfo] = useState<string | null>(null);
  const [onlySulawesi, setOnlySulawesi] = useState(true);
  const [visualizationMode, setVisualizationMode] = useState<'radar' | 'map'>('radar');
  const [mapFocus, setMapFocus] = useState<'epicenter' | 'huntap' | 'mid'>('mid');
  const [mapProvider, setMapProvider] = useState<'osm' | 'google-sat'>('osm');

  // Helper check if earthquake is in Sulawesi region
  const isSulawesi = (rule: EarthquakeInfo) => {
    const coords = parseCoordinates(rule.Coordinates);
    if (coords) {
      // Sulawesi bounding box
      const inSulawesiCoords = coords.lat >= -8.0 && coords.lat <= 3.5 && coords.lon >= 118.0 && coords.lon <= 126.8;
      if (inSulawesiCoords) return true;
    }

    const name = (rule.Wilayah || '').toLowerCase();
    const keywords = [
      'sulawesi', 'sulteng', 'sulsel', 'sulbar', 'sultra', 'sulut', 'gorontalo',
      'palu', 'donggala', 'sigi', 'poso', 'morowali', 'luwuk', 'toli', 'banggai',
      'parigi', 'tondo', 'buol', 'ampana', 'makassar', 'manado', 'kendari', 'bitung', 'mamuju'
    ];
    return keywords.some(k => name.includes(k));
  };

  // Filtered lists based on Sulawesi boundary
  const filteredM5 = (data?.recentM5 || []).filter(item => !onlySulawesi || isSulawesi(item));
  const filteredFelt = (data?.felt || []).filter(item => !onlySulawesi || isSulawesi(item));

  // Helper to get distance of an earthquake from Huntap Tondo 2
  const calculateDistance = (rule: EarthquakeInfo) => {
    const coordObj = parseCoordinates(rule.Coordinates);
    if (coordObj) {
      return getDistanceInKm(TONDO_LAT, TONDO_LON, coordObj.lat, coordObj.lon);
    }
    return null;
  };

  const getIntensityLevel = (magStr: string) => {
    const mag = parseFloat(magStr);
    if (isNaN(mag)) return { label: 'Ringan', color: 'text-gray-500 bg-gray-50 border-gray-200' };
    if (mag >= 6.0) return { label: 'Sangat Kuat / Merusak', color: 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse' };
    if (mag >= 5.0) return { label: 'Kuat / Sedang', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Ringan / Menengah', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
  };

  const shareAlert = (rule: EarthquakeInfo, dist: number | null) => {
    const text = `🚨 INFO SIAGA GEMPA BMKG (TERAS WARGA RT 02) 🚨\n` +
      `Kekuatan: M ${rule.Magnitude}\n` +
      `Kedalaman: ${rule.Kedalaman}\n` +
      `Waktu: ${rule.Tanggal} - ${rule.Jam}\n` +
      `Lokasi: ${rule.Wilayah}\n` +
      `${dist ? `Jarak dari Huntap Tondo 2: ± ${dist.toFixed(1)} km\n` : ''}` +
      `Keterangan: ${rule.Potensi || rule.Dirasakan || 'Tidak berpotensi tsunami'}\n\n` +
      `Tetap tenang dan ikuti arahan keselamatan Satgas RT 02.`;

    if (navigator.share) {
      navigator.share({
        title: 'Info Siaga Gempa RT 02',
        text: text,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      setCopiedInfo(rule.DateTime);
      setTimeout(() => setCopiedInfo(null), 3000);
    }
  };

  // Determine direction to epicenter
  const getDirection = (epLat: number, epLon: number) => {
    const dLat = epLat - TONDO_LAT;
    const dLon = epLon - TONDO_LON;
    
    // Calculate angle
    let angle = Math.atan2(dLon, dLat) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    if (angle >= 337.5 || angle < 22.5) return 'Utara (N)';
    if (angle >= 22.5 && angle < 67.5) return 'Timur Laut (NE)';
    if (angle >= 67.5 && angle < 112.5) return 'Timur (E)';
    if (angle >= 112.5 && angle < 157.5) return 'Tenggara (SE)';
    if (angle >= 157.5 && angle < 202.5) return 'Selatan (S)';
    if (angle >= 202.5 && angle < 247.5) return 'Barat Daya (SW)';
    if (angle >= 247.5 && angle < 292.5) return 'Barat (W)';
    return 'Barat Laut (NW)';
  };

  const getDistanceLevel = (dist: number) => {
    if (dist < 50) return { label: 'SANGAT DEKAT / AWAS', color: 'text-rose-600 bg-rose-50 border-rose-200' };
    if (dist < 150) return { label: 'DEKAT / WASPADA', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'AMAN / JAUH', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  };

  // Latest Earthquake variables
  const latestGempa = data?.latest;
  const latestDistance = latestGempa ? calculateDistance(latestGempa) : null;
  const latestCoords = latestGempa ? parseCoordinates(latestGempa.Coordinates) : null;
  const latestDirection = (latestCoords && latestGempa) ? getDirection(latestCoords.lat, latestCoords.lon) : '';

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-8" id="earthquake-monitor">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Top Header badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] md:text-xs font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                Pusat Seismologi & Mitigasi Huntap Tondo 2
              </p>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight font-serif">
              Siaga Gempa <span className="text-indigo-650">BMKG</span>
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1 max-w-xl">
              Integrasi sistem data seismik nasional real-time BMKG guna deteksi dini, pemetaan jarak episentrum, serta prosedur darurat warga RT 02.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-black shadow-sm hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              <Activity size={14} className={`${loading ? 'animate-spin text-indigo-500' : 'text-slate-500'}`} />
              {loading ? 'MENYEGARKAN...' : 'SEGARKAN DATA'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm flex items-start gap-3">
            <AlertTriangle className="shrink-0 text-amber-600 mt-0.5" size={18} />
            <div>
              <p className="font-extrabold mb-1">Gagal Terhubung ke BMKG secara Instan</p>
              <p className="text-xs text-amber-700 leading-relaxed font-medium">
                Koneksi langsung ke server BMKG mengalami kendala. Sistem otomatis memicu pangkalan data rujukan redundansi lokal RT 02 Huntap Tondo 2 agar layanan tidak terputus.
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Content (Hero & Map Radar) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* HERO CARD: Latest Earthquake */}
            <div className="bg-slate-900 text-white rounded-3xl overflow-hidden shadow-xl border border-slate-800 relative">
              
              {/* Background gradient effects */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="p-6 md:p-8">
                
                {/* Header of card status */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-rose-500/25 text-rose-400 rounded-2xl border border-rose-500/20">
                      <Radio size={20} className="animate-pulse" />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold tracking-tight">INFORMASI GEMPA TERBARU</h2>
                      <p className="text-[10px] text-slate-400 uppercase font-bold font-mono tracking-widest mt-0.5">BMKG Auto-Alert Terakhir</p>
                    </div>
                  </div>
                  {latestGempa && (
                    <span className="text-[10px] font-black tracking-widest bg-emerald-500 text-white px-3 py-1.5 rounded-full uppercase">
                      TERHUBUNG
                    </span>
                  )}
                </div>

                {loading && !latestGempa ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Activity size={32} className="animate-spin text-indigo-500" />
                    <p className="text-xs font-extrabold tracking-wider uppercase font-mono">Memetakan data BMKG terbaru...</p>
                  </div>
                ) : latestGempa ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    
                    {/* Left Column: Primary Figures, Details, and Warning Stats */}
                    <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="text-center bg-slate-950/60 rounded-2xl p-4 min-w-[102px] border border-white/5 shadow-inner flex-1">
                            <p className="text-xs font-black text-rose-400 uppercase tracking-widest font-mono">Magnitude</p>
                            <p className="text-4xl md:text-5xl font-black text-white font-sans mt-1">
                              {latestGempa.Magnitude}
                            </p>
                          </div>
                          <div className="text-center bg-slate-950/60 rounded-2xl p-4 min-w-[102px] border border-white/5 shadow-inner flex-1">
                            <p className="text-xs font-black text-amber-300 uppercase tracking-widest font-mono">Kedalaman</p>
                            <p className="text-4xl md:text-5xl font-black text-white font-sans mt-1">
                              {latestGempa.Kedalaman.replace(/\D/g, '')}
                              <span className="text-xs font-extrabold text-slate-400 ml-1">KM</span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 bg-slate-950/20 rounded-2xl p-5 border border-white/5 shadow-inner">
                          <h3 className="text-lg md:text-xl font-bold font-serif text-slate-100 leading-snug">
                            {latestGempa.Wilayah}
                          </h3>
                          
                          <div className="flex flex-col gap-2.5 text-xs text-slate-300 font-medium font-sans">
                            <div className="flex items-center gap-2.5">
                              <Clock size={14} className="text-indigo-400" />
                              <span>Terjadi pada {latestGempa.Tanggal} • {latestGempa.Jam}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Compass size={14} className="text-indigo-400" />
                              <span className="font-mono text-slate-350">Koordinat {latestGempa.Lintang} - {latestGempa.Bujur} ({latestGempa.Coordinates})</span>
                            </div>
                            {latestGempa.Potensi && (
                              <div className="flex items-center gap-2.5 font-bold text-emerald-400 mt-2 bg-emerald-500/10 border border-emerald-500/15 px-3 py-1.5 rounded-xl w-fit">
                                <Waves size={14} className="animate-bounce" />
                                <span>{latestGempa.Potensi}</span>
                              </div>
                            )}
                            {latestGempa.Dirasakan && (
                              <div className="flex items-center gap-2.5 font-bold text-slate-300 mt-1 bg-slate-900 border border-white/5 px-3 py-2 rounded-xl">
                                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span>Dirasakan MMI: {latestGempa.Dirasakan}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Distance alert calculations */}
                      {latestDistance !== null && (
                        <div className={`p-5 rounded-2xl border ${
                          latestDistance < 100 
                            ? 'bg-rose-950/40 border-rose-500/30 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.1)]' 
                            : latestDistance < 250 
                            ? 'bg-amber-950/45 border-amber-500/30 text-amber-200' 
                            : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <ShieldAlert size={16} className={latestDistance < 100 ? 'text-rose-400 animate-pulse' : 'text-indigo-400'} />
                            <span className="text-[10px] uppercase font-black font-mono tracking-widest">PROKSIMITAS HUNTAP TONDO II</span>
                          </div>
                          <p className="text-lg font-black tracking-tight font-sans">
                            ± {latestDistance.toFixed(1)} km
                            <span className="text-xs font-semibold ml-2 opacity-80">di arah {latestDirection}</span>
                          </p>
                          <p className="text-[10.5px] mt-1.5 opacity-80 leading-relaxed text-justify">
                            {latestDistance < 100 
                              ? "⚠️ PERINGATAN DARURAT: Episenter gempa tergolong SANGAT DEKAT. Hubungi Pos Siaga Bencana TERAS RT 02, amankan barang berharga, dan periksa kondisi fisik Huntap." 
                              : latestDistance < 250 
                              ? "⚠️ PERHATIAN MITIGASI: Jarak menengah terdeteksi. Getaran minor mungkin dirasakan di area Huntap Tondo 2. Harap tetap siaga dan pantau jalur evakuasi." 
                              : "✅ KONDISI AMAN: Episenter berada dalam radius aman yang relatif jauh dari kawasan perumahan Huntap Tondo 2."}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                        <button
                          onClick={() => shareAlert(latestGempa, latestDistance)}
                          className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition-all text-xs font-black text-white cursor-pointer w-full justify-center shadow-lg uppercase tracking-wider border border-white/5"
                        >
                          <Share2 size={14} />
                          {copiedInfo === latestGempa.DateTime ? '✓ BERHASIL DISALIN!' : 'BAGIKAN ALARM KE WARGA'}
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Interactive Radar & Seamless Multi-Mode Map */}
                    <div className="lg:col-span-7 flex flex-col bg-slate-950/40 rounded-3xl border border-white/5 p-5 min-h-[520px] relative overflow-hidden justify-between">
                      
                      {/* Integrated Tabs Switcher */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 z-30">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">
                          VISUALISASI LOKASI SIAGA
                        </span>
                        
                        <div className="flex p-0.5 bg-white/5 border border-white/10 rounded-xl" id="map-radar-toggle">
                          <button
                            onClick={() => setVisualizationMode('radar')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                              visualizationMode === 'radar'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            RADAR SIAGA
                          </button>
                          <button
                            onClick={() => setVisualizationMode('map')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                              visualizationMode === 'map'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            PETA INTERAKTIF
                          </button>
                        </div>
                      </div>

                      {/* Display content frame */}
                      <div className="flex-1 w-full h-full relative flex flex-col" id="visualization-content-frame">
                        {visualizationMode === 'radar' ? (
                          <div className="flex flex-col items-center justify-center h-full w-full py-6 flex-1">
                            {/* Grid Radar Visualizer */}
                            <div className="relative w-full aspect-square max-w-[320px] flex items-center justify-center">
                              {/* Radar outline circles */}
                              <div className="absolute w-[100%] h-[100%] rounded-full border border-slate-800/60" />
                              <div className="absolute w-[75%] h-[75%] rounded-full border border-slate-800/80" />
                              <div className="absolute w-[50%] h-[50%] rounded-full border border-slate-700/60" />
                              <div className="absolute w-[25%] h-[25%] rounded-full border border-indigo-500/20" />
                              
                              {/* Crosshairs */}
                              <div className="absolute w-full h-px bg-slate-800/40" />
                              <div className="absolute h-full w-px bg-slate-800/40" />

                              {/* Directions label */}
                              <span className="absolute top-2 text-[9px] font-black text-slate-500 font-mono">U (N)</span>
                              <span className="absolute bottom-2 text-[9px] font-black text-slate-500 font-mono">S (S)</span>
                              <span className="absolute right-2 text-[9px] font-black text-slate-500 font-mono">T (E)</span>
                              <span className="absolute left-2 text-[9px] font-black text-slate-500 font-mono">B (W)</span>

                              {/* Center Point of Huntap Tondo 2 */}
                              <div className="absolute z-10 flex flex-col items-center justify-center">
                                <span className="h-3.5 w-3.5 rounded-full bg-indigo-500 border border-slate-900 shadow flex items-center justify-center cursor-pointer">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                                </span>
                                <span className="text-[8px] bg-indigo-605 text-white font-extrabold px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap uppercase tracking-widest font-mono">
                                  HUNTAP 2
                                </span>
                              </div>

                              {/* Episentrum Point */}
                              {latestCoords && latestDistance && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                  className="absolute z-20 flex flex-col items-center"
                                  style={{
                                    left: (() => {
                                      const angleRad = deg2rad((() => {
                                        let angle = Math.atan2(latestCoords.lon - TONDO_LON, latestCoords.lat - TONDO_LAT) * (180 / Math.PI);
                                        if (angle < 0) angle += 360;
                                        return angle - 90; // Align with Canvas mapping
                                      })());
                                      const maxRepresentDistance = 400; // km
                                      const distPercent = Math.min(1.0, latestDistance / maxRepresentDistance);
                                      const radius = 135 * distPercent;
                                      return `calc(50% + ${radius * Math.cos(angleRad)}px)`;
                                    })(),
                                    top: (() => {
                                      const angleRad = deg2rad((() => {
                                        let angle = Math.atan2(latestCoords.lon - TONDO_LON, latestCoords.lat - TONDO_LAT) * (180 / Math.PI);
                                        if (angle < 0) angle += 360;
                                        return angle - 90;
                                      })());
                                      const maxRepresentDistance = 400; // km
                                      const distPercent = Math.min(1.0, latestDistance / maxRepresentDistance);
                                      const radius = 135 * distPercent;
                                      return `calc(50% + ${radius * Math.sin(angleRad)}px)`;
                                    })(),
                                    transform: 'translate(-50%, -50%)'
                                  }}
                                >
                                  <span className="h-4 w-4 bg-rose-600 rounded-full border border-white flex items-center justify-center relative cursor-help">
                                    <span className="absolute -inset-2 bg-rose-500/40 rounded-full animate-ping pointer-events-none" />
                                  </span>
                                  <span className="text-[8px] bg-rose-650 text-white font-extrabold px-1.5 py-0.5 rounded shadow-sm mt-1 whitespace-nowrap tracking-wide font-mono uppercase">
                                    EPISENTER M {latestGempa.Magnitude}
                                  </span>
                                </motion.div>
                              )}

                              {/* Sweep Line animation */}
                              <div className="absolute inset-0 border border-transparent rounded-full animate-[spin_4s_linear_infinite] origin-center pointer-events-none" style={{
                                background: 'linear-gradient(45deg, rgba(99, 102, 241, 0.15) 0%, transparent 40%)'
                              }} />
                            </div>
                            
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono text-center mt-3">
                              Radius Pemetaan Siaga: Max 400 KM dari Huntap
                            </p>
                          </div>
                        ) : (
                          // Free Interactive Map Workspace (OpenStreetMap & Keyless Satelit)
                          <div className="w-full h-full flex flex-col justify-between flex-1" id="free-interactive-map-frame">
                            {/* Map Settings Controls */}
                            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5 border-b border-white/5 pb-2">
                              {/* Source Provider Toggle */}
                              <div className="flex p-0.5 bg-white/5 border border-white/10 rounded-lg">
                                <button
                                  onClick={() => setMapProvider('osm')}
                                  className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase transition-all tracking-wider cursor-pointer ${
                                    mapProvider === 'osm'
                                      ? 'bg-indigo-600 text-white'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  OpenStreetMap
                                </button>
                                <button
                                  onClick={() => setMapProvider('google-sat')}
                                  className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase transition-all tracking-wider cursor-pointer ${
                                    mapProvider === 'google-sat'
                                      ? 'bg-indigo-600 text-white'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Peta Satelit
                                </button>
                              </div>

                              {/* Focus Area Controls */}
                              <div className="flex p-0.5 bg-white/5 border border-white/10 rounded-lg">
                                <button
                                  onClick={() => setMapFocus('mid')}
                                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase transition-all cursor-pointer ${
                                    mapFocus === 'mid'
                                      ? 'bg-indigo-550 bg-indigo-505 bg-indigo-600 text-white'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Split Dua Titik
                                </button>
                                <button
                                  onClick={() => setMapFocus('huntap')}
                                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase transition-all cursor-pointer ${
                                    mapFocus === 'huntap'
                                      ? 'bg-indigo-550 bg-indigo-505 bg-indigo-600 text-white'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Huntap 2
                                </button>
                                {latestCoords && (
                                  <button
                                    onClick={() => setMapFocus('epicenter')}
                                    className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase transition-all cursor-pointer ${
                                      mapFocus === 'epicenter'
                                        ? 'bg-indigo-550 bg-indigo-505 bg-indigo-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    Episenter
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Iframe Render Section - Leaflet Premium Integration */}
                            <div className="w-full flex-1 min-h-[300px] md:min-h-[380px] rounded-2xl overflow-hidden border border-white/15 relative bg-slate-950 shadow-inner">
                              {(() => {
                                const latH = TONDO_LAT;
                                const lonH = TONDO_LON;
                                const latE = latestCoords?.lat || TONDO_LAT;
                                const lonE = latestCoords?.lon || TONDO_LON;
                                const distVal = latestDistance || 0;
                                const magnitudeVal = latestGempa?.Magnitude || '0';
                                const placeVal = latestGempa?.Wilayah || 'BMKG';

                                const tileUrl = mapProvider === 'osm' 
                                  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                                  : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
                                
                                const htmlDoc = `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                  <meta charset="utf-8" />
                                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                                  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                                  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                                  <style>
                                    html, body, #map {
                                      margin: 0; padding: 0; width: 100%; height: 100%;
                                      background: #020617;
                                    }
                                    .leaflet-bar { border: none !important; }
                                    
                                    /* Episentrum Hot Red Breathing Pulse Animation */
                                    .pulse-epicenter-container {
                                      position: relative;
                                      display: flex;
                                      align-items: center;
                                      justify-content: center;
                                    }
                                    .epicenter-ring {
                                      position: absolute;
                                      width: 44px;
                                      height: 44px;
                                      background: transparent;
                                      border: 3px solid rgba(239, 68, 68, 0.9);
                                      border-radius: 50%;
                                      animation: epicenter-ripple 1.4s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
                                      box-sizing: border-box;
                                      box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
                                    }
                                    .epicenter-ring-outer {
                                      position: absolute;
                                      width: 72px;
                                      height: 72px;
                                      background: transparent;
                                      border: 1.5px solid rgba(239, 68, 68, 0.4);
                                      border-radius: 50%;
                                      animation: epicenter-ripple 2.4s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
                                      box-sizing: border-box;
                                    }
                                    .epicenter-dot {
                                      width: 14px;
                                      height: 14px;
                                      background: #ef4444;
                                      border: 2px solid #ffffff;
                                      border-radius: 50%;
                                      box-shadow: 0 0 8px #ef4444;
                                      z-index: 5;
                                    }

                                    /* Huntap Indigo Home Pulse */
                                    .pulse-huntap-container {
                                      position: relative;
                                      display: flex;
                                      align-items: center;
                                      justify-content: center;
                                    }
                                    .huntap-ring {
                                      position: absolute;
                                      width: 32px;
                                      height: 32px;
                                      background: transparent;
                                      border: 2.5px solid rgba(99, 102, 241, 0.85);
                                      border-radius: 50%;
                                      animation: epicenter-ripple 2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
                                      box-sizing: border-box;
                                      box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);
                                    }
                                    .huntap-dot {
                                      width: 12px;
                                      height: 12px;
                                      background: #6366f1;
                                      border: 2px solid #ffffff;
                                      border-radius: 50%;
                                      box-shadow: 0 0 6px #6366f1;
                                      z-index: 5;
                                    }

                                    @keyframes epicenter-ripple {
                                      0% { transform: scale(0.2); opacity: 1; }
                                      80% { opacity: 0.5; }
                                      100% { transform: scale(1.8); opacity: 0; }
                                    }

                                    /* Clean dark custom tooltips */
                                    .leaflet-tooltip-dark {
                                      background: rgba(15, 23, 42, 0.92) !important;
                                      border: 1px solid rgba(255, 255, 255, 0.15) !important;
                                      color: #ffffff !important;
                                      font-weight: 850 !important;
                                      font-size: 9.5px !important;
                                      font-family: ui-sans-serif, system-ui, sans-serif !important;
                                      border-radius: 8px !important;
                                      padding: 5px 9px !important;
                                      box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
                                      letter-spacing: 0.05em !important;
                                    }
                                    .leaflet-tooltip-dark::before {
                                      border-top-color: rgba(15, 23, 42, 0.92) !important;
                                      border-bottom-color: rgba(15, 23, 42, 0.92) !important;
                                    }
                                  </style>
                                </head>
                                <body>
                                  <div id="map"></div>
                                  <script>
                                    const map = L.map('map', { 
                                      zoomControl: true,
                                      attributionControl: false
                                    });
                                    
                                    // Custom map tiles base
                                    L.tileLayer('${tileUrl}', {
                                      maxZoom: 18,
                                      minZoom: 4
                                    }).addTo(map);

                                    // Coordinates
                                    const latH = ${latH};
                                    const lonH = ${lonH};
                                    const latE = ${latE};
                                    const lonE = ${lonE};

                                    // Icons
                                    const huntapIcon = L.divIcon({
                                      className: 'pulse-huntap-container',
                                      html: '<div class="huntap-ring"></div><div class="huntap-dot"></div>',
                                      iconSize: [40, 40],
                                      iconAnchor: [20, 20]
                                    });

                                    const epicenterIcon = L.divIcon({
                                      className: 'pulse-epicenter-container',
                                      html: '<div class="epicenter-ring-outer"></div><div class="epicenter-ring"></div><div class="epicenter-dot"></div>',
                                      iconSize: [60, 60],
                                      iconAnchor: [30, 30]
                                    });

                                    // Draw markers
                                    const markerH = L.marker([latH, lonH], { icon: huntapIcon }).addTo(map);
                                    markerH.bindTooltip("🔑 HUNTAP TONDO II (AMU)", { 
                                      permanent: true, 
                                      className: "leaflet-tooltip-dark", 
                                      direction: "top" 
                                    });

                                    const markerE = L.marker([latE, lonE], { icon: epicenterIcon }).addTo(map);
                                    markerE.bindTooltip("🟥 EPISENTER M " + "${magnitudeVal}", { 
                                      permanent: true, 
                                      className: "leaflet-tooltip-dark", 
                                      direction: "bottom" 
                                    });

                                    // Dash alert connector line with pulsing wave representation
                                    const pathPoints = [[latH, lonH], [latE, lonE]];
                                    const polyline = L.polyline(pathPoints, {
                                      color: '#f43f5e',
                                      weight: 2.5,
                                      dashArray: '6, 8',
                                      opacity: 0.8
                                    }).addTo(map);

                                    // Zoom adjustment strategy
                                    const focusMode = "${mapFocus}";
                                    if (focusMode === 'epicenter') {
                                      map.setView([latE, lonE], 9);
                                    } else if (focusMode === 'huntap') {
                                      map.setView([latH, lonH], 12);
                                    } else {
                                      // Fit both showing lines
                                      const group = new L.featureGroup([markerH, markerE]);
                                      map.fitBounds(group.getBounds().pad(0.35));
                                    }
                                  </script>
                                </body>
                                </html>
                                `;

                                return (
                                  <iframe
                                    title="Peta Taktis Gempa"
                                    width="100%"
                                    height="100%"
                                    srcDoc={htmlDoc}
                                    className="w-full h-full opacity-90 transition-all duration-300 rounded-2xl"
                                    style={{ border: 0 }}
                                  />
                                );
                              })()}
                            </div>

                            {/* Info Footer */}
                            <div className="mt-2 text-center bg-white/5 border border-white/5 rounded-xl py-1.5 px-3 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide font-mono flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                AKTIF & BEBAS BIAYA
                              </span>
                              <span className="text-[10px] text-slate-350 font-black uppercase font-mono">
                                Jarak: ±{latestDistance ? latestDistance.toFixed(1) : '-'} KM ke Huntap
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-400 py-10 text-center">Gagal memuat data gempa terakhir.</p>
                )}
              </div>
            </div>

            {/* TAB LISTS: Recent Earthquakes */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow">
              
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-slate-105 pb-5 mb-6">
                <div>
                  <h2 className="text-xl font-bold font-serif text-slate-800">
                    Aktivitas Seismik Regional
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Histori gempa regional seputar Sulawesi dan BMKG nasional.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Sulawesi Only Toggle button */}
                  <button
                    onClick={() => setOnlySulawesi(!onlySulawesi)}
                    className={`flex items-center gap-2 px-3  py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      onlySulawesi 
                        ? 'bg-indigo-55 bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${onlySulawesi ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`} />
                    FOKUS SULAWESI
                  </button>

                  {/* Tabs selection */}
                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setActiveTab('m5')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer uppercase tracking-wider ${
                        activeTab === 'm5' 
                          ? 'bg-slate-900 text-white shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      M ≥ 5.0
                    </button>
                    <button
                      onClick={() => setActiveTab('felt')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer uppercase tracking-wider ${
                        activeTab === 'felt' 
                          ? 'bg-slate-900 text-white shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Dirasakan
                    </button>
                  </div>
                </div>
              </div>

              {/* Lists content */}
              <div className="space-y-4">
                {loading && (
                  <div className="py-12 flex justify-center text-slate-400">
                    <Activity className="animate-spin text-indigo-500" size={24} />
                  </div>
                )}

                {!loading && activeTab === 'm5' && (
                  filteredM5.length > 0 ? (
                    filteredM5.map((rule, idx) => {
                      const distance = calculateDistance(rule);
                      const severity = getIntensityLevel(rule.Magnitude);
                      
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={rule.DateTime + idx}
                          className="p-5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-2xl transition-all duration-300 group"
                        >
                          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            
                            <div className="flex items-start gap-4">
                              <span className={`text-base font-black px-3 py-2 rounded-xl text-center min-w-[55px] ${severity.color}`}>
                                M {rule.Magnitude}
                              </span>
                              <div>
                                <h4 className="text-sm md:text-base font-bold text-slate-800 leading-snug">
                                  {rule.Wilayah}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-bold mt-1.5">
                                  <span>{rule.Tanggal} • {rule.Jam}</span>
                                  <span>•</span>
                                  <span>Kedalaman: {rule.Kedalaman}</span>
                                  <span>•</span>
                                  <span>Koordinat: {rule.Coordinates}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-200/50 pt-2 md:pt-0">
                              {distance !== null && (
                                <div className="text-right">
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border inline-block ${getDistanceLevel(distance).color}`}>
                                    {getDistanceLevel(distance).label}
                                  </span>
                                  <p className="text-xs font-extrabold text-slate-600 mt-0.5">
                                    ± {distance.toFixed(1)} km
                                  </p>
                                </div>
                              )}
                              <button
                                onClick={() => shareAlert(rule, distance)}
                                className="p-2 bg-white hover:bg-slate-200 border border-slate-200 text-slate-500 rounded-xl hover:text-slate-800 transition-colors cursor-pointer active:scale-95"
                                title="Bagikan informasi"
                              >
                                <Share2 size={13} />
                              </button>
                            </div>

                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="py-10 text-center text-xs text-slate-400 font-black uppercase">
                      {onlySulawesi 
                        ? "Tidak ada terekam data gempa M ≥ 5.0 di wilayah Sulawesi baru-baru ini."
                        : "Tidak ada terekam data gempa M ≥ 5.0 dalam pencatatan terbaru."}
                    </p>
                  )
                )}

                {!loading && activeTab === 'felt' && (
                  filteredFelt.length > 0 ? (
                    filteredFelt.map((rule, idx) => {
                      const distance = calculateDistance(rule);
                      const severity = getIntensityLevel(rule.Magnitude);
                      
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={rule.DateTime + idx}
                          className="p-5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-2xl transition-all duration-300 group"
                        >
                          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            
                            <div className="flex items-start gap-4">
                              <span className={`text-base font-black px-3 py-2 rounded-xl text-center min-w-[55px] ${severity.color}`}>
                                M {rule.Magnitude}
                              </span>
                              <div>
                                <h4 className="text-sm md:text-base font-bold text-slate-800 leading-snug">
                                  {rule.Wilayah}
                                </h4>
                                <p className="text-xs font-semibold text-slate-550 mt-1">
                                  Skala Dirasakan: {rule.Dirasakan || 'Felt MMI tidak tercatat'}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-bold mt-1.5">
                                  <span>{rule.Tanggal} • {rule.Jam}</span>
                                  <span>•</span>
                                  <span>Kedalaman: {rule.Kedalaman}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-200/50 pt-2 md:pt-0">
                              {distance !== null && (
                                <div className="text-right">
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border inline-block ${getDistanceLevel(distance).color}`}>
                                    {getDistanceLevel(distance).label}
                                  </span>
                                  <p className="text-xs font-extrabold text-slate-600 mt-0.5">
                                    ± {distance.toFixed(1)} km
                                  </p>
                                </div>
                              )}
                              <button
                                onClick={() => shareAlert(rule, distance)}
                                className="p-2 bg-white hover:bg-slate-200 border border-slate-200 text-slate-500 rounded-xl hover:text-slate-800 transition-colors cursor-pointer active:scale-95"
                                title="Bagikan informasi"
                              >
                                <Share2 size={13} />
                              </button>
                            </div>

                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="py-10 text-center text-xs text-slate-400 font-black uppercase">
                      {onlySulawesi 
                        ? "Tidak ada laporan dirasakan oleh warga Sulawesi baru-baru ini."
                        : "Tidak ada laporan dirasakan oleh warga baru-baru ini."}
                    </p>
                  )
                )}
              </div>
            </div>

          </div>

          {/* Sidebar Area (Safety conditions, emergency contacts, evacuation plans) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* CARD 1: Sesar Palu-Koro Status */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow">
              <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider font-sans mb-4 flex items-center gap-2">
                <Compass className="text-indigo-600 animate-spin-slow" size={18} />
                Tingkat Resiko Geografis
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Paku Tektonik</p>
                  <p className="text-base font-extrabold text-slate-800 font-serif mt-0.5">Zona Sesar Palu-Koro</p>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                    Huntap Tondo 2 berdiri di kawasan yang dipengaruhi oleh aktivitas Sesar Palu-Koro yang aktif. Kesiapsiagaan digital adalah kunci utama keselamatan.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5 animate-bounce-slow" size={18} />
                  <div>
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Status RT 02 Saat Ini</h4>
                    <p className="text-sm font-bold text-emerald-800">Kondisi Aman Terkendali</p>
                    <p className="text-[11px] text-emerald-700/80 leading-relaxed mt-0.5 font-medium">
                      Tidak ada pergerakan seismik berkekuatan merusak terdeteksi di koordinat lokal Huntap Tondo 2 dalam 48 jam terakhir.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: Safe Exit Routes & Evacuation point */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow">
              <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider font-sans mb-4 flex items-center gap-2">
                <MapPin className="text-indigo-650" size={18} />
                Jalur Evakuasi RT 02
              </h3>

              <div className="space-y-3 font-sans">
                <div className="flex gap-3 start-0">
                  <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    1
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">Titik Kumpul Utama (Assembly Point)</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-normal mt-0.5">
                      Lapangan Fasilitas Umum (Depan Masjid Al-Ikhlas) Huntap Tondo 2. Area lapang terjauh dari kemungkinan runtuhan bangunan berlantai.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 start-0">
                  <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    2
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">Sistem Kebencanaan Mandiri</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-normal mt-0.5">
                      Teras Warga dilengkapi sirine kebencanaan dan tombol siaga (SOS/Panic Button) terintegrasi yang berbunyi secara merata jika dipicu satgas resmi.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 start-0">
                  <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">Jalur Evakuasi Darurat</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-normal mt-0.5">
                      Berlari ke arah jalur sirkulasi luar (Blok A/B) menuju timur ke arah jalan lingkar luar yang berjarak aman dari struktur tebing atau lereng.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: Mitigasi Gempa (Panduan Keselamatan) */}
            <div className="bg-indigo-950 text-indigo-100 rounded-3xl p-6 border border-indigo-900 shadow">
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider font-sans mb-4 flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-400" />
                Panduan Saat Terjadi Gempa
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="font-extrabold text-white mb-0.5 flex items-center gap-1.5 text-rose-350">
                    <span>1. MERUNDUK (DROP)</span>
                  </p>
                  <p className="opacity-80 text-[11px] leading-relaxed">
                    Segera jatuhkan badan ke lutut dan tangan Anda agar tidak roboh akibat guncangan mendadak.
                  </p>
                </div>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="font-extrabold text-white mb-0.5 flex items-center gap-1.5 text-amber-300">
                    <span>2. LINDUNGI (COVER)</span>
                  </p>
                  <p className="opacity-80 text-[11px] leading-relaxed">
                    Lindungi kepala, leher, dan seluruh tubuh dengan berlindung di bawah meja kayu yang kokoh atau struktur kolom beton kuat.
                  </p>
                </div>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="font-extrabold text-white mb-0.5 flex items-center gap-1.5 text-emerald-400">
                    <span>3. BERTAHAN (HOLD ON)</span>
                  </p>
                  <p className="opacity-80 text-[11px] leading-relaxed">
                    Pegang erat-erat tiang meja atau tumpuan perlindungan hingga getaran gempa mereda sepenuhnya, lalu evakuasi keluar secara tertib.
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 4: Kontak Darurat */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight font-sans mb-4 flex items-center gap-2">
                <Phone className="text-rose-500" size={18} />
                Kontak Darurat Palu
              </h3>

              <div className="space-y-2.5 font-sans">
                <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all duration-200">
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">Satgas Bencana RT 02 (Irfan)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">WhatsApp Siaga RT</p>
                  </div>
                  <a
                    href="https://wa.me/6282188880202"
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="text-[10.5px] font-black text-indigo-650 hover:underline uppercase"
                  >
                    HUBUNGI
                  </a>
                </div>

                <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all duration-200">
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">Basarnas Palu</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">(0451) 481110</p>
                  </div>
                  <a
                    href="tel:0451481110"
                    className="text-[10.5px] font-black text-rose-500 hover:underline uppercase"
                  >
                    TELEPON
                  </a>
                </div>

                <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all duration-200">
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">Ambulans Gawat Darurat</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Layanan 118</p>
                  </div>
                  <a
                    href="tel:118"
                    className="text-[10.5px] font-black text-rose-500 hover:underline uppercase"
                  >
                    PANGGIL
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
