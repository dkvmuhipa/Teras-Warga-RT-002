import React from 'react';
import { Recycle, Award, Trophy, ArrowRight } from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';

interface WasteCleanlinessWidgetProps {
  financialSettings: any;
  onOpenLeaderboard: () => void;
}

export const WasteCleanlinessWidget: React.FC<WasteCleanlinessWidgetProps> = ({
  financialSettings,
  onOpenLeaderboard
}) => {
  const { currentTenant } = useTenant();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
      {/* Widget 1: Jadwal & Count Down Pengangkutan Sampah */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden group flex flex-col justify-between">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#e8faf0] text-[#059669] rounded-full border border-emerald-100/80">
              <Recycle size={14} className="animate-spin" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">
                Smart Waste {currentTenant.rt ? `RT ${currentTenant.rt}` : 'Lingkungan'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Pengangkutan Rutin</span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mb-1">
              Jadwal Sampah &amp; Daur Ulang
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Keluarkan tempat sampah Anda sebelum armada kebersihan tiba di pekarangan.
            </p>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 pt-1">
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Organik / Dapur</p>
              <p className="text-sm font-extrabold text-slate-800">Senin, Rabu, Sabtu</p>
              <p className="text-[10px] font-bold text-slate-400">Jam 07:00 WITA</p>
            </div>
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Anorganik / Botol</p>
              <p className="text-sm font-extrabold text-slate-800">Selasa &amp; Jumat</p>
              <p className="text-[10px] font-bold text-slate-400">Jam 15:30 WITA</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Armada Aktif Pagi Ini
          </span>
          <span className="text-[10px] text-slate-400 font-bold">Bank Sampah &amp; TPS3R</span>
        </div>
      </div>

      {/* Widget 2: Indikator Kebersihan & Blok Terbersih */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden group flex flex-col justify-between">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#fff4eb] text-[#ea580c] rounded-full border border-amber-100/80">
              <Award size={14} />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Penghargaan Lingkungan</span>
            </div>
            <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80 uppercase">
              {financialSettings?.cleanestMonth || 'Periode Berjalan'}
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mb-1">
              Blok Terbersih Bulan Ini
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Berdasarkan penilaian kebersihan got, kerapihan pekarangan, dan keasrian tanaman.
            </p>
          </div>

          {financialSettings?.cleanestBlock ? (
            <div className="p-3.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl text-white shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Trophy size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-100">Juara 1 Kebersihan</p>
                  <p className="text-lg font-extrabold text-white">
                    {financialSettings.cleanestBlock}
                  </p>
                </div>
              </div>
              {financialSettings.cleanestScore ? (
                <span className="text-[10px] font-extrabold bg-white text-amber-800 px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-2xs">
                  Nilai {financialSettings.cleanestScore}/100
                </span>
              ) : null}
            </div>
          ) : (
            <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl text-center">
              <p className="text-xs text-slate-500 font-medium">Penilaian kebersihan blok periode ini sedang berlangsung.</p>
            </div>
          )}
        </div>

        <div className="relative z-10 pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
          <span className="text-[10px] text-slate-400 font-bold">
            Evaluasi Lingkungan {currentTenant.rt ? `RT ${currentTenant.rt}` : ''}
          </span>
          <button
            onClick={onOpenLeaderboard}
            className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            Lihat Klasemen <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
