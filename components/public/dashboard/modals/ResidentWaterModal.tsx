import React from 'react';
import { 
  Droplets, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  Camera, 
  X, 
  Check 
} from 'lucide-react';
import { House, WaterUtilitySettings } from '../../../../types';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { calculateWaterUtilityBill } from '../../../../services/databaseService';

interface ResidentWaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleSubmitWaterMeter: (e: React.FormEvent) => void;
  currentHouse: House | undefined;
  waterUtilityConfig: WaterUtilitySettings;
  previousReadingNumber: number;
  waterInputReading: number | '';
  setWaterInputReading: (val: number | '') => void;
  handleWaterPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  waterPhoto: string;
  setWaterPhoto: (photo: string) => void;
  isSubmittingWater: boolean;
}

export const ResidentWaterModal: React.FC<ResidentWaterModalProps> = ({
  isOpen,
  onClose,
  handleSubmitWaterMeter,
  currentHouse,
  waterUtilityConfig,
  previousReadingNumber,
  waterInputReading,
  setWaterInputReading,
  handleWaterPhotoUpload,
  waterPhoto,
  setWaterPhoto,
  isSubmittingWater,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Meter Air Mandiri Bulan Ini"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmitWaterMeter} className="space-y-4 text-left">
        {/* Header Card: PDAM & House Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-4 text-white shadow-lg shadow-blue-500/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-inner">
                <Droplets className="w-6 h-6 text-sky-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200">Mandiri Warga</span>
                  <span className="bg-white/20 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">RT 002</span>
                </div>
                <h4 className="text-xl font-black tracking-tight text-white">
                  Rumah Blok {currentHouse?.block}-{currentHouse?.number}
                </h4>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-sky-200 tracking-wider block">Pengelola Resmi</span>
              <span className="inline-flex items-center gap-1.5 bg-white text-blue-900 text-xs font-black px-2.5 py-1 rounded-xl shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {waterUtilityConfig.providerName || 'PDAM Kota Palu'}
              </span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs text-sky-100">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-200" />
              Periode: <strong className="text-white">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</strong>
            </span>
            <span className="text-[11px] font-semibold bg-black/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/10">
              Paket Kuota Dasar: {waterUtilityConfig.baseQuotaM3 || 10} m³
            </span>
          </div>
        </div>

        {/* Dual Meter Inputs */}
        <div className="grid grid-cols-2 gap-3">
          {/* Meter Lalu */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Meter Bulan Lalu
              </label>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                Tercatat
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                readOnly
                disabled
                value={previousReadingNumber}
                className="w-full pl-3.5 pr-9 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-base font-bold font-mono text-slate-600 outline-none cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                m³
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Stand meteran lalu</p>
          </div>

          {/* Meter Terkini */}
          <div className="p-3.5 bg-blue-50/60 rounded-2xl border-2 border-blue-400/80 shadow-sm shadow-blue-500/5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-blue-700">
                Meter Terkini <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-600 text-white animate-pulse">
                Input
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min={previousReadingNumber}
                required
                placeholder={`≥ ${previousReadingNumber}`}
                value={waterInputReading}
                onChange={(e) => setWaterInputReading(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full pl-3.5 pr-9 py-2.5 bg-white border-2 border-blue-500 rounded-xl text-base font-black font-mono text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-blue-600">
                m³
              </span>
            </div>
            <p className="text-[10px] text-blue-600/80 mt-1">Digit angka fisik kran</p>
          </div>
        </div>

        {/* Live Calculation Preview - High-End Fintech Breakdown */}
        {waterInputReading !== '' && Number(waterInputReading) >= previousReadingNumber && (() => {
          const usage = Math.max(0, Number(waterInputReading) - previousReadingNumber);
          const preview = calculateWaterUtilityBill(usage, waterUtilityConfig);
          const quota = waterUtilityConfig.baseQuotaM3 || 10;
          const isWithinQuota = usage <= quota;
          const progressPercent = Math.min(100, Math.round((usage / quota) * 100));

          return (
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-4 shadow-xl border border-slate-700/80 space-y-3">
              {/* Top: Net Volume & Status Pill */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-sky-400 flex items-center justify-center border border-blue-500/30">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">Estimasi Pemakaian Bersih</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black font-mono text-white">{usage}</span>
                      <span className="text-xs font-bold text-slate-400">m³</span>
                    </div>
                  </div>
                </div>

                <div>
                  {waterUtilityConfig.billingMode === 'pdam' && (
                    isWithinQuota ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Dalam Kuota Dasar (≤ 10 m³)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                        +{preview.excessUsage} m³ Kelebihan
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Visual Quota Gauge (PDAM) */}
              {waterUtilityConfig.billingMode === 'pdam' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">
                      Kuota Paket: <strong className="text-white">{usage}</strong> / {quota} m³
                    </span>
                    <span className={isWithinQuota ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {isWithinQuota ? `${progressPercent}% kuota dasar` : `100% + ${preview.excessUsage} m³ kelebihan`}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-slate-700/50">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${isWithinQuota ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min(100, (Math.min(usage, quota) / quota) * 100)}%` }}
                    />
                    {preview.excessUsage > 0 && (
                      <div 
                        className="h-full rounded-full bg-amber-500 transition-all duration-300 ml-1"
                        style={{ width: `${Math.min(100, (preview.excessUsage / quota) * 100)}%` }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Itemized Calculation */}
              <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                {waterUtilityConfig.billingMode === 'pdam' ? (
                  <>
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        Paket Dasar PDAM (s/d {waterUtilityConfig.baseQuotaM3 || 10} m³)
                      </span>
                      <span className="font-mono font-bold text-white">
                        Rp {(preview.baseFee).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {preview.excessUsage > 0 && (
                      <div className="flex justify-between items-center text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Kelebihan ({preview.excessUsage} m³ × Rp {waterUtilityConfig.ratePerM3}):
                        </span>
                        <span className="font-mono font-bold">
                          + Rp {preview.excessFee.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Tarif Kubikasi ({usage} m³ × Rp {waterUtilityConfig.ratePerM3}):</span>
                    <span className="font-mono font-bold text-white">
                      Rp {(usage * waterUtilityConfig.ratePerM3).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                {waterUtilityConfig.maintenanceFee > 0 && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Beban Admin / Pemeliharaan:
                    </span>
                    <span className="font-mono font-bold text-white">
                      + Rp {waterUtilityConfig.maintenanceFee.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Tagihan Result */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between bg-slate-950/50 -mx-4 -mb-4 p-3.5 px-4 rounded-b-2xl">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Estimasi Tagihan Anda
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Sesuai tarif resmi {waterUtilityConfig.providerName || 'PDAM Kota Palu'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                    Rp {preview.totalAmount.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Upload Foto Meteran Fisik */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-blue-600" />
            Foto Bukti Angka Meteran Fisik (Opsional / Disarankan)
          </label>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleWaterPhotoUpload}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {waterPhoto && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 max-h-48">
                <img src={waterPhoto} alt="Preview Meter" className="w-full h-48 object-contain" />
                <button
                  type="button"
                  onClick={() => setWaterPhoto('')}
                  className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-full text-xs shadow-md hover:bg-rose-700"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            Foto akan otomatis dikompresi di browser Anda agar hemat kuota internet.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-bold"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmittingWater || waterInputReading === ''}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {isSubmittingWater ? 'Menyimpan Catatan...' : 'Kirim Catatan Meter'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
