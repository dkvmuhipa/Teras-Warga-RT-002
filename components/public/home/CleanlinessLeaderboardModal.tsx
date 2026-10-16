import React from 'react';
import { Trophy, Award } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { useTenant } from '../../../context/TenantContext';

interface CleanlinessLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  financialSettings: any;
}

export const CleanlinessLeaderboardModal: React.FC<CleanlinessLeaderboardModalProps> = ({
  isOpen,
  onClose,
  financialSettings
}) => {
  const { currentTenant } = useTenant();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Papan Peringkat Kebersihan Lingkungan ${currentTenant.name}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 p-2">
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md">
              <Trophy size={24} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-sm">Evaluasi Kebersihan Kawasan</h4>
              <p className="text-xs text-slate-500 font-medium">
                Periode Evaluasi: <span className="font-black text-amber-700">{financialSettings?.cleanestMonth || 'Periode Berjalan'}</span>
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
            Official Board
          </span>
        </div>

        {financialSettings?.cleanestBlock && financialSettings?.cleanestRankings ? (
          <div className="space-y-3">
            {financialSettings.cleanestRankings.map((item: any, idx: number) => {
              const rankNum = item.rank || idx + 1;
              const badge = rankNum === 1 ? '🥇 Juara 1 (Emas)' : rankNum === 2 ? '🥈 Juara 2 (Perak)' : rankNum === 3 ? '🥉 Juara 3 (Perunggu)' : `Peringkat ${rankNum}`;
              const badgeBg = rankNum === 1 ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : rankNum === 2 ? 'bg-slate-300 text-slate-800' : rankNum === 3 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700';
              const border = rankNum === 1 ? 'border-amber-400/80 bg-amber-50/40 shadow-xs' : rankNum === 2 ? 'border-slate-200 bg-slate-50/60' : rankNum === 3 ? 'border-amber-900/10 bg-amber-900/5' : 'border-slate-200 bg-white';

              return (
                <div key={rankNum} className={`p-4 rounded-2xl border ${border} flex items-center justify-between transition-all hover:scale-[1.01]`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${badgeBg} flex items-center justify-center font-black text-sm shrink-0`}>
                      {rankNum}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-black text-slate-900 text-sm">{item.block}</h5>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">{badge}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5">{item.status || 'Evaluasi Lingkungan Baik'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl block">
                      {item.score}/100
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Score Nilai</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-slate-50 border-2 border-dashed border-amber-300 rounded-3xl text-center space-y-3">
            <div className="inline-flex p-4 bg-amber-500/20 text-amber-700 rounded-2xl">
              <Award size={36} />
            </div>
            <h4 className="text-base font-black text-slate-800 uppercase tracking-wider">Penilaian Kebersihan Sedang Berlangsung</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              Pengurus {currentTenant.name} dan Tim Penilai Gotong Royong sedang melakukan evaluasi berkala kebersihan drainase, kerapian pekarangan, serta keasrian tanaman di setiap blok.
            </p>
            <div className="inline-block px-4 py-1.5 bg-amber-100 border border-amber-200 rounded-full text-[10px] font-black text-amber-800 uppercase tracking-widest">
              Pengumuman Peringkat Segera Dipublikasikan
            </div>
          </div>
        )}

        <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs font-medium text-slate-600 leading-relaxed">
          💡 <strong className="text-indigo-900">Kriteria Penilaian Kebersihan:</strong> Kebersihan got/drainase (35%), kerapian pekarangan &amp; sampah (35%), keasrian tanaman (30%). Evaluasi dilakukan pengurus setiap akhir bulan.
        </div>
      </div>
    </Modal>
  );
};
