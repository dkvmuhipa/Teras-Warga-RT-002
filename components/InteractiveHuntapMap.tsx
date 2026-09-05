import React, { useState } from 'react';
import { Compass, ZoomIn, ZoomOut, RotateCcw, Navigation } from 'lucide-react';

interface BlockZone {
  id: string;
  name: string;
  rt: 'RW19-RT01' | 'RW19-RT02' | 'RW19-RT03' | 'RW20-RT01' | 'RW20-RT02' | 'RW20-RT03';
  rtLabel: string;
  color: string;
  borderColor: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Data koordinat blok berdasarkan peta site plan Huntap Tondo 2
const BLOCKS: BlockZone[] = [
  // --- RW-19 / RT-01 (Sisi Barat & Barat Daya - 110 KK) ---
  { id: 'A1', name: 'Blok A1', rt: 'RW19-RT01', rtLabel: 'RW 19 / RT 01 (110 KK)', color: 'fill-sky-500/35', borderColor: 'stroke-sky-400', x: 180, y: 520, w: 38, h: 85 },
  { id: 'A2', name: 'Blok A2', rt: 'RW19-RT01', rtLabel: 'RW 19 / RT 01 (110 KK)', color: 'fill-sky-500/35', borderColor: 'stroke-sky-400', x: 230, y: 420, w: 38, h: 80 },
  { id: 'A3', name: 'Blok A3', rt: 'RW19-RT01', rtLabel: 'RW 19 / RT 01 (110 KK)', color: 'fill-sky-500/35', borderColor: 'stroke-sky-400', x: 230, y: 520, w: 38, h: 85 },
  { id: 'A4', name: 'Blok A4', rt: 'RW19-RT01', rtLabel: 'RW 19 / RT 01 (110 KK)', color: 'fill-sky-500/35', borderColor: 'stroke-sky-400', x: 280, y: 410, w: 38, h: 90 },
  { id: 'A5', name: 'Blok A5', rt: 'RW19-RT01', rtLabel: 'RW 19 / RT 01 (110 KK)', color: 'fill-sky-500/35', borderColor: 'stroke-sky-400', x: 280, y: 520, w: 38, h: 85 },
  { id: 'A6', name: 'Blok A6', rt: 'RW19-RT01', rtLabel: 'RW 19 / RT 01 (110 KK)', color: 'fill-sky-500/35', borderColor: 'stroke-sky-400', x: 330, y: 330, w: 38, h: 105 },

  // --- RW-19 / RT-02 (Sisi Barat Laut & Utara - 119 KK) ---
  { id: 'B1', name: 'Blok B1', rt: 'RW19-RT02', rtLabel: 'RW 19 / RT 02 (119 KK)', color: 'fill-blue-600/35', borderColor: 'stroke-blue-500', x: 180, y: 360, w: 38, h: 85 },
  { id: 'B2', name: 'Blok B2', rt: 'RW19-RT02', rtLabel: 'RW 19 / RT 02 (119 KK)', color: 'fill-blue-600/35', borderColor: 'stroke-blue-500', x: 230, y: 300, w: 38, h: 85 },
  { id: 'B3', name: 'Blok B3', rt: 'RW19-RT02', rtLabel: 'RW 19 / RT 02 (119 KK)', color: 'fill-blue-600/35', borderColor: 'stroke-blue-500', x: 280, y: 240, w: 38, h: 85 },
  { id: 'B4', name: 'Blok B4', rt: 'RW19-RT02', rtLabel: 'RW 19 / RT 02 (119 KK)', color: 'fill-blue-600/35', borderColor: 'stroke-blue-500', x: 330, y: 190, w: 38, h: 85 },
  { id: 'B5', name: 'Blok B5', rt: 'RW19-RT02', rtLabel: 'RW 19 / RT 02 (119 KK)', color: 'fill-blue-600/35', borderColor: 'stroke-blue-500', x: 385, y: 155, w: 38, h: 120 },
  { id: 'B6', name: 'Blok B6', rt: 'RW19-RT02', rtLabel: 'RW 19 / RT 02 (119 KK)', color: 'fill-blue-600/35', borderColor: 'stroke-blue-500', x: 435, y: 130, w: 38, h: 145 },
  { id: 'B7', name: 'Blok B7', rt: 'RW19-RT02', rtLabel: 'RW 19 / RT 02 (119 KK)', color: 'fill-blue-600/35', borderColor: 'stroke-blue-500', x: 485, y: 110, w: 38, h: 165 },
  { id: 'D1', name: 'Blok D1', rt: 'RW19-RT02', rtLabel: 'RW 19 / RT 02 (119 KK)', color: 'fill-blue-600/35', borderColor: 'stroke-blue-500', x: 535, y: 95, w: 38, h: 180 },

  // --- RW-19 / RT-03 (Sisi Selatan Tengah: C1, C2, C3, C4, C6, A7 - 127 KK) ---
  { id: 'A7', name: 'Blok A7', rt: 'RW19-RT03', rtLabel: 'RW 19 / RT 03 (127 KK)', color: 'fill-emerald-500/35', borderColor: 'stroke-emerald-400', x: 330, y: 520, w: 38, h: 85 },
  { id: 'C1', name: 'Blok C1', rt: 'RW19-RT03', rtLabel: 'RW 19 / RT 03 (127 KK)', color: 'fill-emerald-500/35', borderColor: 'stroke-emerald-400', x: 385, y: 320, w: 38, h: 120 },
  { id: 'C2', name: 'Blok C2', rt: 'RW19-RT03', rtLabel: 'RW 19 / RT 03 (127 KK)', color: 'fill-emerald-500/35', borderColor: 'stroke-emerald-400', x: 385, y: 475, w: 38, h: 105 },
  { id: 'C3', name: 'Blok C3', rt: 'RW19-RT03', rtLabel: 'RW 19 / RT 03 (127 KK)', color: 'fill-emerald-500/35', borderColor: 'stroke-emerald-400', x: 435, y: 320, w: 38, h: 120 },
  { id: 'C4', name: 'Blok C4', rt: 'RW19-RT03', rtLabel: 'RW 19 / RT 03 (127 KK)', color: 'fill-emerald-500/35', borderColor: 'stroke-emerald-400', x: 435, y: 475, w: 38, h: 105 },
  { id: 'C6', name: 'Blok C6', rt: 'RW19-RT03', rtLabel: 'RW 19 / RT 03 (127 KK)', color: 'fill-emerald-500/35', borderColor: 'stroke-emerald-400', x: 485, y: 475, w: 38, h: 90 },

  // --- RW-20 / RT-02 (Tengah: C5, C7, C8, C9, C10, C11, C12 - 129 KK) ---
  { id: 'C5', name: 'Blok C5', rt: 'RW20-RT02', rtLabel: 'RW 20 / RT 02 (129 KK)', color: 'fill-amber-500/35', borderColor: 'stroke-amber-400', x: 485, y: 320, w: 38, h: 120 },
  { id: 'C7', name: 'Blok C7', rt: 'RW20-RT02', rtLabel: 'RW 20 / RT 02 (129 KK)', color: 'fill-amber-500/35', borderColor: 'stroke-amber-400', x: 535, y: 320, w: 38, h: 120 },
  { id: 'C8', name: 'Blok C8', rt: 'RW20-RT02', rtLabel: 'RW 20 / RT 02 (129 KK)', color: 'fill-amber-500/35', borderColor: 'stroke-amber-400', x: 535, y: 475, w: 38, h: 75 },
  { id: 'C9', name: 'Blok C9', rt: 'RW20-RT02', rtLabel: 'RW 20 / RT 02 (129 KK)', color: 'fill-amber-500/35', borderColor: 'stroke-amber-400', x: 585, y: 320, w: 38, h: 120 },
  { id: 'C10', name: 'Blok C10', rt: 'RW20-RT02', rtLabel: 'RW 20 / RT 02 (129 KK)', color: 'fill-amber-500/35', borderColor: 'stroke-amber-400', x: 585, y: 475, w: 38, h: 75 },
  { id: 'C11', name: 'Blok C11', rt: 'RW20-RT02', rtLabel: 'RW 20 / RT 02 (129 KK)', color: 'fill-amber-500/35', borderColor: 'stroke-amber-400', x: 635, y: 320, w: 38, h: 120 },
  { id: 'C12', name: 'Blok C12', rt: 'RW20-RT02', rtLabel: 'RW 20 / RT 02 (129 KK)', color: 'fill-amber-500/35', borderColor: 'stroke-amber-400', x: 635, y: 475, w: 38, h: 70 },

  // --- RW-20 / RT-01 (Sisi Utara Timur: D2, D3, D4, F1, F2, F3 - 137 KK) ---
  { id: 'D2', name: 'Blok D2', rt: 'RW20-RT01', rtLabel: 'RW 20 / RT 01 (137 KK)', color: 'fill-indigo-500/35', borderColor: 'stroke-indigo-400', x: 585, y: 95, w: 38, h: 180 },
  { id: 'D3', name: 'Blok D3', rt: 'RW20-RT01', rtLabel: 'RW 20 / RT 01 (137 KK)', color: 'fill-indigo-500/35', borderColor: 'stroke-indigo-400', x: 635, y: 95, w: 38, h: 180 },
  { id: 'D4', name: 'Blok D4', rt: 'RW20-RT01', rtLabel: 'RW 20 / RT 01 (137 KK)', color: 'fill-indigo-500/35', borderColor: 'stroke-indigo-400', x: 685, y: 95, w: 38, h: 180 },
  { id: 'F1', name: 'Blok F1', rt: 'RW20-RT01', rtLabel: 'RW 20 / RT 01 (137 KK)', color: 'fill-indigo-500/35', borderColor: 'stroke-indigo-400', x: 735, y: 105, w: 36, h: 170 },
  { id: 'F2', name: 'Blok F2', rt: 'RW20-RT01', rtLabel: 'RW 20 / RT 01 (137 KK)', color: 'fill-indigo-500/35', borderColor: 'stroke-indigo-400', x: 780, y: 125, w: 36, h: 150 },
  { id: 'F3', name: 'Blok F3', rt: 'RW20-RT01', rtLabel: 'RW 20 / RT 01 (137 KK)', color: 'fill-indigo-500/35', borderColor: 'stroke-indigo-400', x: 825, y: 155, w: 36, h: 120 },

  // --- RW-20 / RT-03 (Sisi Timur: E1..E9, F4 - 128 KK) ---
  { id: 'F4', name: 'Blok F4', rt: 'RW20-RT03', rtLabel: 'RW 20 / RT 03 (128 KK)', color: 'fill-rose-500/35', borderColor: 'stroke-rose-400', x: 870, y: 195, w: 36, h: 80 },
  { id: 'E1', name: 'Blok E1', rt: 'RW20-RT03', rtLabel: 'RW 20 / RT 03 (128 KK)', color: 'fill-rose-500/35', borderColor: 'stroke-rose-400', x: 735, y: 320, w: 36, h: 120 },
  { id: 'E2', name: 'Blok E2', rt: 'RW20-RT03', rtLabel: 'RW 20 / RT 03 (128 KK)', color: 'fill-rose-500/35', borderColor: 'stroke-rose-400', x: 735, y: 475, w: 36, h: 70 },
  { id: 'E3', name: 'Blok E3', rt: 'RW20-RT03', rtLabel: 'RW 20 / RT 03 (128 KK)', color: 'fill-rose-500/35', borderColor: 'stroke-rose-400', x: 780, y: 320, w: 36, h: 120 },
  { id: 'E4', name: 'Blok E4', rt: 'RW20-RT03', rtLabel: 'RW 20 / RT 03 (128 KK)', color: 'fill-rose-500/35', borderColor: 'stroke-rose-400', x: 780, y: 475, w: 36, h: 70 },
  { id: 'E5', name: 'Blok E5', rt: 'RW20-RT03', rtLabel: 'RW 20 / RT 03 (128 KK)', color: 'fill-rose-500/35', borderColor: 'stroke-rose-400', x: 825, y: 320, w: 36, h: 120 },
  { id: 'E6', name: 'Blok E6', rt: 'RW20-RT03', rtLabel: 'RW 20 / RT 03 (128 KK)', color: 'fill-rose-500/35', borderColor: 'stroke-rose-400', x: 825, y: 475, w: 36, h: 70 },
  { id: 'E7', name: 'Blok E7', rt: 'RW20-RT03', rtLabel: 'RW 20 / RT 03 (128 KK)', color: 'fill-rose-500/35', borderColor: 'stroke-rose-400', x: 870, y: 320, w: 36, h: 120 },
  { id: 'E8', name: 'Blok E8', rt: 'RW20-RT03', rtLabel: 'RW 20 / RT 03 (128 KK)', color: 'fill-rose-500/35', borderColor: 'stroke-rose-400', x: 870, y: 475, w: 36, h: 50 },
  { id: 'E9', name: 'Blok E9', rt: 'RW20-RT03', rtLabel: 'RW 20 / RT 03 (128 KK)', color: 'fill-rose-500/35', borderColor: 'stroke-rose-400', x: 915, y: 320, w: 36, h: 145 },
];

export const InteractiveHuntapMap: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [hoveredBlock, setHoveredBlock] = useState<BlockZone | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const filterOptions = [
    { id: 'ALL', label: 'Semua Wilayah', color: 'bg-slate-900 text-white' },
    { id: 'RW20-RT02', label: 'RW-20 / RT-02', color: 'bg-amber-600 text-white' },
    { id: 'RW19-RT02', label: 'RW-19 / RT-02', color: 'bg-blue-600 text-white' },
    { id: 'RW19-RT03', label: 'RW-19 / RT-03', color: 'bg-emerald-600 text-white' },
    { id: 'RW19-RT01', label: 'RW-19 / RT-01', color: 'bg-sky-600 text-white' },
    { id: 'RW20-RT01', label: 'RW-20 / RT-01', color: 'bg-indigo-600 text-white' },
    { id: 'RW20-RT03', label: 'RW-20 / RT-03', color: 'bg-rose-600 text-white' },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-150">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-blue-600 text-white rounded-2xl shadow-md shadow-indigo-600/20">
            <Compass size={22} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Peta Vektor Interaktif Huntap Tondo 2
              </h3>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-md tracking-wider">
                Digital Vector
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Arahkan kursor atau sentuh blok rumah untuk melihat RT, RW, dan jalur evakuasi
            </p>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.6))}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            title="Perbesar Peta"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.85))}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            title="Perkecil Peta"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Filter Tabs by RT */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {filterOptions.map(f => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === f.id
                ? `${f.color} shadow-md scale-102`
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Interactive SVG Map Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-inner flex items-center justify-center min-h-[500px]">
        
        {/* Background Grid Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

        {/* Compass Wind Rose */}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white p-2.5 rounded-xl border border-white/10 shadow-lg pointer-events-none flex flex-col items-center z-10">
          <span className="text-[10px] font-black text-rose-400">U</span>
          <div className="w-0.5 h-3 bg-rose-400 my-0.5" />
          <span className="text-[8px] font-bold text-slate-400">B — T</span>
          <div className="w-0.5 h-3 bg-slate-600 my-0.5" />
          <span className="text-[9px] font-black text-slate-400">S</span>
        </div>

        {/* Hovered / Selected Block Popover */}
        {hoveredBlock && (
          <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-white/15 shadow-2xl z-20 max-w-xs animate-fadeIn">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="font-black text-base text-white">{hoveredBlock.name}</h4>
            </div>
            <p className="text-xs font-bold text-amber-400">{hoveredBlock.rtLabel}</p>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Kawasan Hunian Tetap Tondo 2, Mantikulore, Kota Palu.
            </p>
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-emerald-300 font-bold">
              <Navigation size={12} /> Rute: Menuju Area Jalan Utama
            </div>
          </div>
        )}

        {/* Scalable SVG Render */}
        <div 
          className="transition-transform duration-300 ease-out origin-center p-4 w-full flex items-center justify-center overflow-auto"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox="100 60 920 600"
            className="w-full max-w-[980px] h-auto drop-shadow-2xl select-none"
          >
            {/* Base Perimeter Polygon (Denah Kawasan) */}
            <polygon
              points="140,630 140,360 310,180 520,80 730,85 910,180 970,300 970,490 890,570 360,630"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="6 4"
            />

            {/* ============================================================ */}
            {/* JARINGAN JALAN TERPADU (INTEGRATED STREET NETWORK)           */}
            {/* ============================================================ */}

            {/* 1. Jalan Akses Masuk Barat (dari Gerbang TK-2) */}
            <path
              d="M 125,575 L 180,515 L 230,415 L 280,335 L 360,297"
              fill="none"
              stroke="#1e293b"
              strokeWidth="38"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 125,575 L 180,515 L 230,415 L 280,335 L 360,297"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="6 6"
              opacity="0.75"
            />

            {/* 2. JALAN UTAMA POROS KAWASAN (Central Main Boulevard) */}
            <rect
              x="340"
              y="275"
              width="620"
              height="45"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1.5"
              rx="4"
            />
            {/* Garis Tengah Marka Kuning Jalan Utama */}
            <line
              x1="350"
              y1="297.5"
              x2="950"
              y2="297.5"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="10 8"
            />
            {/* Label Marka Jalan Utama */}
            <text
              x="620"
              y="302"
              fill="#fef08a"
              fontSize="9"
              fontWeight="900"
              letterSpacing="2.5"
              textAnchor="middle"
              className="pointer-events-none select-none opacity-90"
            >
              ══ JALAN UTAMA POROS HUNTAP TONDO 2 ══
            </text>

            {/* 3. JALAN KOLEKTOR TENGAH SELATAN (Antara C/E Atas dan Bawah) */}
            <rect
              x="365"
              y="440"
              width="550"
              height="35"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
              rx="3"
            />
            <line
              x1="375"
              y1="457.5"
              x2="905"
              y2="457.5"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />
            <text
              x="640"
              y="461"
              fill="#94a3b8"
              fontSize="8"
              fontWeight="800"
              letterSpacing="2"
              textAnchor="middle"
              className="pointer-events-none select-none opacity-80"
            >
              ── JALAN LINGKUNGAN SELATAN ──
            </text>

            {/* 4. Lorong / Jalan Antar Blok (Cross Streets) */}
            {/* Lorong Vertikal di Blok C & E */}
            {[423, 473, 523, 573, 623, 673, 723, 771, 816, 861, 906].map((lx, idx) => (
              <rect
                key={`lane-${idx}`}
                x={lx}
                y="275"
                width="12"
                height="320"
                fill="#1e293b"
                className="opacity-70 pointer-events-none"
              />
            ))}

            {/* Lorong Vertikal di Blok D & F Utara */}
            {[573, 623, 673, 723, 771, 816, 861].map((lx, idx) => (
              <rect
                key={`lane-north-${idx}`}
                x={lx}
                y="90"
                width="12"
                height="190"
                fill="#1e293b"
                className="opacity-70 pointer-events-none"
              />
            ))}

            {/* Jalan Lingkar Luar Selatan */}
            <path
              d="M 180,615 L 340,615 L 680,560 L 920,535"
              fill="none"
              stroke="#1e293b"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M 180,615 L 340,615 L 680,560 L 920,535"
              fill="none"
              stroke="#475569"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />

            {/* Jalan Lingkar Luar Utara */}
            <path
              d="M 330,180 L 535,85 L 745,95 L 910,180"
              fill="none"
              stroke="#1e293b"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M 330,180 L 535,85 L 745,95 L 910,180"
              fill="none"
              stroke="#475569"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />

            {/* ============================================================ */}
            {/* BLOK-BLOK HUNIAN RUMAH WARGA                                 */}
            {/* ============================================================ */}
            {BLOCKS.map(block => {
              const isMatch = selectedFilter === 'ALL' || selectedFilter === block.rt;
              const isHovered = hoveredBlock?.id === block.id;

              return (
                <g 
                  key={block.id}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredBlock(block)}
                  onMouseLeave={() => setHoveredBlock(null)}
                  onClick={() => setHoveredBlock(block)}
                >
                  {/* Lot Rectangle */}
                  <rect
                    x={block.x}
                    y={block.y}
                    width={block.w}
                    height={block.h}
                    rx="5"
                    className={`transition-all duration-300 ${block.color} ${block.borderColor} ${
                      !isMatch 
                        ? 'opacity-20' 
                        : isHovered 
                        ? 'opacity-100 stroke-[3px] filter drop-shadow(0 0 12px rgba(255,255,255,0.75))' 
                        : 'opacity-90 stroke-[1.5px]'
                    }`}
                  />
                  
                  {/* Block Label text */}
                  <text
                    x={block.x + block.w / 2}
                    y={block.y + block.h / 2 + 3}
                    textAnchor="middle"
                    className={`text-[9px] font-black pointer-events-none transition-all ${
                      isMatch ? 'fill-white' : 'fill-slate-500'
                    }`}
                  >
                    {block.id}
                  </text>
                </g>
              );
            })}

            {/* ============================================================ */}
            {/* TITIK KUMPUL EVAKUASI RESMI (TK-1 & TK-2)                     */}
            {/* ============================================================ */}

            {/* Titik Kumpul 1: Area Jalan Utama Poros (Pulsing di tengah Jalan Utama) */}
            <g className="pointer-events-none">
              <circle cx="560" cy="297.5" r="24" fill="#10b981" fillOpacity="0.3" className="animate-ping" />
              <circle cx="560" cy="297.5" r="13" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
              <text x="560" y="301" fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle">TK-1</text>
              <rect x="495" y="318" width="130" height="18" rx="5" fill="rgba(15, 23, 42, 0.95)" stroke="#10b981" strokeWidth="1.2" />
              <text x="560" y="330" fill="#a7f3d0" fontSize="8" fontWeight="900" textAnchor="middle" letterSpacing="0.5">AREA JALAN UTAMA</text>
            </g>

            {/* Titik Kumpul 2: Gerbang Utama Sisi Barat */}
            <g className="pointer-events-none">
              <circle cx="125" cy="575" r="22" fill="#3b82f6" fillOpacity="0.3" className="animate-ping" />
              <circle cx="125" cy="575" r="12" fill="#3b82f6" stroke="#ffffff" strokeWidth="2.5" />
              <text x="125" y="578.5" fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle">TK-2</text>
              <rect x="68" y="594" width="114" height="18" rx="5" fill="rgba(15, 23, 42, 0.95)" stroke="#3b82f6" strokeWidth="1.2" />
              <text x="125" y="606" fill="#93c5fd" fontSize="8" fontWeight="900" textAnchor="middle" letterSpacing="0.5">GERBANG UTAMA</text>
            </g>

          </svg>
        </div>
      </div>

      {/* Interactive Legend Box */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
        <div 
          onClick={() => setSelectedFilter('RW20-RT02')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'RW20-RT02' ? 'bg-amber-500/15 border-amber-500 shadow-sm' : 'bg-slate-50 border-slate-200/80 hover:bg-amber-50/50'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <p className="text-[11px] font-black text-slate-800">RT-02 / RW-20</p>
          </div>
          <p className="text-[10px] text-slate-500 font-bold">C5, C7 s/d C12</p>
        </div>

        <div 
          onClick={() => setSelectedFilter('RW19-RT02')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'RW19-RT02' ? 'bg-blue-500/15 border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-200/80 hover:bg-blue-50/50'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <p className="text-[11px] font-black text-slate-800">RT-02 / RW-19</p>
          </div>
          <p className="text-[10px] text-slate-500 font-bold">B1-B7, D1</p>
        </div>

        <div 
          onClick={() => setSelectedFilter('RW19-RT03')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'RW19-RT03' ? 'bg-emerald-500/15 border-emerald-500 shadow-sm' : 'bg-slate-50 border-slate-200/80 hover:bg-emerald-50/50'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <p className="text-[11px] font-black text-slate-800">RT-03 / RW-19</p>
          </div>
          <p className="text-[10px] text-slate-500 font-bold">C1 s/d C4, C6, A7</p>
        </div>

        <div 
          onClick={() => setSelectedFilter('RW19-RT01')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'RW19-RT01' ? 'bg-sky-500/15 border-sky-500 shadow-sm' : 'bg-slate-50 border-slate-200/80 hover:bg-sky-50/50'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <p className="text-[11px] font-black text-slate-800">RT-01 / RW-19</p>
          </div>
          <p className="text-[10px] text-slate-500 font-bold">A1 s/d A6</p>
        </div>

        <div 
          onClick={() => setSelectedFilter('RW20-RT01')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'RW20-RT01' ? 'bg-indigo-500/15 border-indigo-500 shadow-sm' : 'bg-slate-50 border-slate-200/80 hover:bg-indigo-50/50'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <p className="text-[11px] font-black text-slate-800">RT-01 / RW-20</p>
          </div>
          <p className="text-[10px] text-slate-500 font-bold">D2-D4, F1, F2, F3</p>
        </div>

        <div 
          onClick={() => setSelectedFilter('RW20-RT03')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'RW20-RT03' ? 'bg-rose-500/15 border-rose-500 shadow-sm' : 'bg-slate-50 border-slate-200/80 hover:bg-rose-50/50'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <p className="text-[11px] font-black text-slate-800">RT-03 / RW-20</p>
          </div>
          <p className="text-[10px] text-slate-500 font-bold">E1 s/d E9, F4</p>
        </div>
      </div>

    </div>
  );
};