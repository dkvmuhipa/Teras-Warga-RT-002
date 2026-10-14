import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Phone, 
  Check, 
  Droplets, 
  Trash2, 
  Waves, 
  Sparkles 
} from 'lucide-react';
import { House, STBMRecord } from '../../../../types';

interface ResidentStbmTabProps {
  currentHouse: House | undefined;
  stbmRecord: STBMRecord | null;
  onReportIssue: (desc: string) => void;
}

export const ResidentStbmTab: React.FC<ResidentStbmTabProps> = ({
  currentHouse,
  stbmRecord,
  onReportIssue,
}) => {
  return (
    <motion.div 
      key="stbm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 text-left"
    >
      {/* Header Sanitasi Eksekutif */}
      <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 rounded-[2.5rem] p-6 md:p-8 text-white border border-emerald-500/30 shadow-xl shadow-emerald-950/20 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                Standar Kemenkes RI • ODF 100%
              </span>
              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/10 text-slate-300 border border-white/10">
                Huntap Tondo 2 PUPR
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Profil Sanitasi 5 Pilar STBM Kavling
            </h3>
            <p className="text-xs md:text-sm text-slate-300 font-medium max-w-xl leading-relaxed">
              Kavling Blok {currentHouse?.block} No. {currentHouse?.number} • Kepala Keluarga: <strong>{currentHouse?.headOfFamily || 'Warga'}</strong>.
              Pemukiman Huntap Tondo 2 telah tersertifikasi Bebas Buang Air Besar Sembarangan (Open Defecation Free / ODF).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={() => {
                onReportIssue(
                  `[KENDALA SANITASI/STBM] Kavling Blok ${currentHouse?.block}-${currentHouse?.number}: Mengalami kendala pada sarana sanitasi (biotank/saluran/sampah). Mohon bantuan peninjauan pengurus/kader.`
                );
              }}
              className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <AlertTriangle size={15} />
              <span>Laporkan Kendala Sanitasi</span>
            </button>

            <button
              onClick={() => {
                const message = `Halo Pengurus RT 002 / Kader Posyandu Huntap Tondo 2, saya warga Kavling Blok ${currentHouse?.block} No. ${currentHouse?.number} (${currentHouse?.headOfFamily}) ingin berkonsultasi mengenai pemeliharaan sarana sanitasi & 5 pilar STBM di rumah kami. Terima kasih.`;
                window.open(`https://api.whatsapp.com/send?phone=6285961194621&text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Phone size={15} className="text-emerald-400" />
              <span>Konsultasi Kader via WA</span>
            </button>
          </div>
        </div>

        {/* Status Banner */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Status BABS (Pilar 1)</span>
            <span className="text-base md:text-lg font-black text-emerald-400 mt-0.5 block">100% ODF Bebas</span>
            <span className="text-[8px] text-slate-400 font-semibold">Jamban Biotank PUPR</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Kualitas Air Bersih</span>
            <span className="text-base md:text-lg font-black text-cyan-300 mt-0.5 block">Terhubung PDAM</span>
            <span className="text-[8px] text-slate-400 font-semibold">Meter Mandiri Aktif</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Pengolahan Limbah Cair</span>
            <span className="text-base md:text-lg font-black text-teal-300 mt-0.5 block">SPALDT Tertutup</span>
            <span className="text-[8px] text-slate-400 font-semibold">Saluran Got Mengalir</span>
          </div>
          <div className={`border rounded-2xl p-3 ${stbmRecord?.needsFollowUp ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Kondisi Kavling</span>
            <span className={`text-base md:text-lg font-black mt-0.5 block ${stbmRecord?.needsFollowUp ? 'text-rose-400' : 'text-emerald-400'}`}>
              {stbmRecord?.needsFollowUp ? 'Perlu Pemeliharaan' : 'Sangat Baik (Prima)'}
            </span>
            <span className="text-[8px] text-slate-400 font-semibold">
              {stbmRecord?.problemType || 'Semua Pilar Terpenuhi'}
            </span>
          </div>
        </div>
      </div>

      {/* 5 Pilar Detailed Interactive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pilar 1 */}
        <div className="p-5 bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-wider border border-emerald-200/60">
                Pilar 1 STBM
              </span>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                <Check size={14} /> Terpenuhi
              </span>
            </div>
            <h4 className="text-sm font-black text-slate-900">Stop Buang Air Besar Sembarangan (ODF)</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Rumah telah dilengkapi jamban leher angsa kedap dengan sistem tangki septik biotank pabrikan standar PUPR Huntap Tondo 2.
            </p>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl text-[10px] font-bold text-emerald-800 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>Kloset Leher Angsa + Biotank Standar</span>
          </div>
        </div>

        {/* Pilar 2 */}
        <div className="p-5 bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-xl text-[9px] font-black uppercase tracking-wider border border-blue-200/60">
                Pilar 2 STBM
              </span>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                <Check size={14} /> Terpenuhi
              </span>
            </div>
            <h4 className="text-sm font-black text-slate-900">Cuci Tangan Pakai Sabun (CTPS)</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Tersedia fasilitas wastafel / keran air mengalir beserta sabun pembersih untuk kebiasaan cuci tangan sebelum makan dan setelah dari toilet.
            </p>
          </div>
          <div className="p-3 bg-blue-50/60 rounded-xl text-[10px] font-bold text-blue-800 flex items-center gap-2">
            <Droplets size={14} className="text-blue-600 shrink-0" />
            <span>Keran Air Mengalir + Sabun Cuci Tangan</span>
          </div>
        </div>

        {/* Pilar 3 */}
        <div className="p-5 bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-xl text-[9px] font-black uppercase tracking-wider border border-amber-200/60">
                Pilar 3 STBM
              </span>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                <Check size={14} /> Terpenuhi
              </span>
            </div>
            <h4 className="text-sm font-black text-slate-900">Pengelolaan Air Minum &amp; Pangan (PAMM-RT)</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Air minum dimasak mendidih atau menggunakan filter bersertifikasi, serta wadah makanan selalu tertutup rapat terlindung dari lalat dan debu.
            </p>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-xl text-[10px] font-bold text-amber-800 flex items-center gap-2">
            <ShieldCheck size={14} className="text-amber-600 shrink-0" />
            <span>Air Minum Masak &amp; Makanan Tertutup</span>
          </div>
        </div>

        {/* Pilar 4 */}
        <div className="p-5 bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-xl text-[9px] font-black uppercase tracking-wider border border-teal-200/60">
                Pilar 4 STBM
              </span>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                <Check size={14} /> Terpenuhi
              </span>
            </div>
            <h4 className="text-sm font-black text-slate-900">Pengelolaan Sampah Rumah Tangga (TPS3R)</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Pemilahan sampah organik dan anorganik di rumah tangga, tidak membakar sampah, dan terdaftar pada layanan retribusi pengangkutan sampah RT.
            </p>
          </div>
          <div className="p-3 bg-teal-50/60 rounded-xl text-[10px] font-bold text-teal-800 flex items-center gap-2">
            <Trash2 size={14} className="text-teal-600 shrink-0" />
            <span>Tempat Sampah Tertutup + Retribusi Aktif</span>
          </div>
        </div>

        {/* Pilar 5 */}
        <div className="p-5 bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-xl text-[9px] font-black uppercase tracking-wider border border-violet-200/60">
                Pilar 5 STBM
              </span>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                <Check size={14} /> Terpenuhi
              </span>
            </div>
            <h4 className="text-sm font-black text-slate-900">Pengelolaan Limbah Cair Rumah Tangga</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Air limbah bekas mandi dan cuci dapur dialirkan melalui pipa tertutup langsung ke sistem drainase pemukiman tanpa genangan terbuka di pekarangan.
            </p>
          </div>
          <div className="p-3 bg-violet-50/60 rounded-xl text-[10px] font-bold text-violet-800 flex items-center gap-2">
            <Waves size={14} className="text-violet-600 shrink-0" />
            <span>Saluran Tertutup Tanpa Genangan Air</span>
          </div>
        </div>

        {/* Tips Pemeliharaan Sanitasi Huntap */}
        <div className="p-5 bg-slate-900 text-white rounded-2xl md:rounded-3xl border border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-xl text-[9px] font-black uppercase tracking-wider border border-amber-500/30">
              Tips Huntap Tondo 2
            </span>
            <h4 className="text-sm font-black text-white">Panduan Pemeliharaan Biotank</h4>
            <ul className="text-xs text-slate-300 font-medium space-y-1.5 list-disc list-inside">
              <li>Jangan buang tisu, pembalut, atau plastik ke kloset</li>
              <li>Hindari membuang minyak jelantah panas ke wastafel</li>
              <li>Gunakan sabun/pembersih lantai secukupnya</li>
            </ul>
          </div>
          <div className="p-3 bg-white/10 rounded-xl text-[10px] font-bold text-slate-300 flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400 shrink-0" />
            <span>Kavling Sehat, Keluarga Kuat</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
