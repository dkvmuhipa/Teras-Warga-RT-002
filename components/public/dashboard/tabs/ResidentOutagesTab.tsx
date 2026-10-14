import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  AlertTriangle, 
  Droplets, 
  Info, 
  CheckCircle 
} from 'lucide-react';
import { Card } from '../../../ui/Card';

interface ResidentOutagesTabProps {
  utilityOutages: any[];
  onOpenOutageModal: () => void;
}

export const ResidentOutagesTab: React.FC<ResidentOutagesTabProps> = ({
  utilityOutages,
  onOpenOutageModal,
}) => {
  return (
    <motion.div 
      key="outages"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 text-left"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Zap size={22} />
          </span>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Papan Informasi Pemadaman PLN &amp; Air Bersih</h3>
            <p className="text-xs text-slate-500 font-medium">Informasi resmi pemeliharaan jaringan listrik PLN dan perbaikan pipa saluran air bersih RT 02.</p>
          </div>
        </div>
        <button
          onClick={onOpenOutageModal}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
        >
          <AlertTriangle size={14} />
          <span>Lapor Gangguan &amp; Posko</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {utilityOutages.length > 0 ? (
          utilityOutages.map((outage) => (
            <Card 
              key={outage.id} 
              className={`p-6 bg-white border-2 rounded-[2rem] shadow-sm flex flex-col justify-between ${
                outage.status === 'Ongoing' ? 'border-amber-400 ring-4 ring-amber-50' : 'border-slate-100'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      outage.type === 'PLN' ? 'bg-amber-100 text-amber-800' :
                      outage.type === 'PDAM' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {outage.type === 'PLN' ? <Zap size={12} /> : <Droplets size={12} />} {outage.type}
                    </span>

                    {outage.impactSeverity && (
                      <span className={`px-2.5 py-0.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest ${
                        outage.impactSeverity === 'Kritis' ? 'bg-rose-100 text-rose-700' :
                        outage.impactSeverity === 'Sedang' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                      }`}>
                        Dampak: {outage.impactSeverity}
                      </span>
                    )}
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest ${
                    outage.status === 'Ongoing' ? 'bg-rose-50 text-rose-600 animate-pulse' :
                    outage.status === 'Scheduled' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {outage.status === 'Ongoing' ? '⚠️ Sedang Berlangsung' : outage.status === 'Scheduled' ? '🗓️ Terjadwal' : '✓ Normal / Selesai'}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-slate-900 text-base">{outage.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 mt-1">
                    {outage.officialRefNumber && <span>📄 No: {outage.officialRefNumber}</span>}
                    {outage.feederName && <span>🔌 {outage.feederName}</span>}
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1.5">{outage.description}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1.5 text-xs border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Tanggal &amp; Waktu:</span>
                    <span className="font-bold text-slate-700">
                      {outage.date ? `${new Date(outage.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • ` : ''}
                      {outage.startTime} s.d {outage.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Wilayah Terdampak:</span>
                    <span className="font-black text-slate-700">{outage.affectedBlocks?.join(', ') || 'Semua Blok'}</span>
                  </div>
                  {outage.contactCenter && (
                    <div className="flex justify-between border-t border-slate-200/50 pt-1 mt-1">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Call Center:</span>
                      <span className="font-bold text-indigo-600">{outage.contactCenter}</span>
                    </div>
                  )}
                </div>

                {outage.emergencyNotes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
                    <Info size={14} className="text-amber-600 shrink-0" />
                    <span>{outage.emergencyNotes}</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-3 shadow-xs">
              <CheckCircle size={32} />
            </div>
            <h4 className="font-black text-slate-800 text-sm mb-1">Kondisi Jaringan Listrik &amp; Air Normal</h4>
            <p className="text-xs text-slate-400 font-medium">Tidak ada jadwal pemadaman listrik PLN atau perbaikan air pipa yang tercatat saat ini.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
