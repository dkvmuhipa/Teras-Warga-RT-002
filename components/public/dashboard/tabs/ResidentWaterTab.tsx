import React from 'react';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  Droplets, 
  Camera, 
  Activity 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { House, WaterMeterReading, WaterUtilitySettings } from '../../../../types';
import { Card } from '../../../ui/Card';

interface ResidentWaterTabProps {
  currentHouse: House | undefined;
  waterUtilityConfig: WaterUtilitySettings;
  currentWaterReading: WaterMeterReading | undefined;
  houseWaterReadings: WaterMeterReading[];
  previousReadingNumber: number;
  onOpenWaterModal: (currentReadingVal: string, photoVal: string) => void;
}

export const ResidentWaterTab: React.FC<ResidentWaterTabProps> = ({
  currentHouse,
  waterUtilityConfig,
  currentWaterReading,
  houseWaterReadings,
  previousReadingNumber,
  onOpenWaterModal,
}) => {
  return (
    <motion.div
      key="water"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 text-left"
    >
      {/* Notice jika meteran air hilang */}
      {currentHouse?.pdamStatus === 'Hilang' && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border-2 border-purple-300 shadow-sm text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-purple-600 text-white rounded-2xl shrink-0 shadow-md shadow-purple-600/25 animate-bounce">
              <AlertTriangle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-700 text-white">
                  🚨 Laporan: Meteran Fisik Hilang / Raib
                </span>
                {currentHouse.pdamLostDate && (
                  <span className="text-[11px] font-bold text-purple-700">
                    Tercatat: {currentHouse.pdamLostDate}
                  </span>
                )}
              </div>
              <h4 className="font-black text-slate-900 text-sm">Pengamanan Pipa &amp; Pengajuan Penggantian Unit Meteran Baru</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                Rumah Anda terdata dalam berkas laporan meteran hilang RT 02 ke PDAM Kota Palu untuk permohonan unit meter pengganti. <strong>PENTING:</strong> Mohon pastikan stop kran pipa distribusi telah ditutup rapat/didop agar tidak terjadi kebocoran atau aliran air tanpa meteran.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const text = encodeURIComponent(`Halo Pengurus RT 002, saya dari Blok ${currentHouse?.block}-${currentHouse?.number} ingin konfirmasi tindak lanjut laporan penggantian meteran PDAM yang hilang di rumah kami.`);
              window.open(`https://wa.me/?text=${text}`, '_blank');
            }}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            Konfirmasi Pengurus RT
          </button>
        </div>
      )}

      {/* Notice jika rumah belum terpasang meteran PDAM */}
      {(currentHouse?.pdamStatus || 'Terpasang') === 'Belum Terpasang' && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-2 border-rose-200 shadow-sm text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-rose-500 text-white rounded-2xl shrink-0 shadow-md shadow-rose-500/20">
              <Droplets size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white">
                  Status: Belum Terpasang Meteran
                </span>
                <span className="text-xs font-bold text-slate-600">Perumda Air Minum Kota Palu</span>
              </div>
              <h4 className="font-black text-slate-900 text-sm">Hunian Anda Terdata Dalam Antrean Pemasangan Meteran Baru</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Rumah Anda telah dicatat oleh Pengurus RT 002 Huntap Tondo 2 dalam berkas usulan pemasangan resmi ke PDAM Kota Palu. Anda tidak perlu menginput angka kubikasi bulanan sampai unit meteran fisik resmi terpasang.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const text = encodeURIComponent(`Halo Pengurus RT 002, saya dari Blok ${currentHouse?.block}-${currentHouse?.number} ingin konfirmasi terkait status meteran PDAM di rumah kami.`);
              window.open(`https://wa.me/?text=${text}`, '_blank');
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            Hubungi Pengurus RT
          </button>
        </div>
      )}

      {/* Hero Header Air Bersih */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-800 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-cyan-100">
              <Droplets className="w-3.5 h-3.5 animate-pulse" />
              Utilitas Air Bersih PDAM • RT 002
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Catat Meter Air Mandiri (PDAM)
            </h3>
            <p className="text-cyan-100 text-xs sm:text-sm max-w-xl">
              Pengelolaan air bersih kini resmi dikelola oleh <strong>PDAM Kota Palu</strong> dengan skema iuran <strong>Rp 35.000 / 10 m³ pertama</strong> (+ Rp 3.500/m³ kelebihan pemakaian). Kirim angka meteran sebelum tanggal {waterUtilityConfig.readingDueDate} setiap bulan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => {
                onOpenWaterModal(
                  currentWaterReading ? String(currentWaterReading.currentReading) : '',
                  currentWaterReading?.photoUrl || ''
                );
              }}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-blue-700 hover:bg-cyan-50 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-black/10 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              {currentWaterReading ? 'Update Catatan Meter' : 'Catat Meter Bulan Ini'}
            </button>
          </div>
        </div>
      </div>

      {/* Current Month Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Box 1: Status Bulan Ini */}
        <Card className="p-6 border-slate-100 rounded-[2rem] bg-white shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Periode Tagihan</span>
            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
              currentWaterReading 
                ? (currentWaterReading.status === 'Terverifikasi' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200')
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {currentWaterReading ? currentWaterReading.status : 'Belum Dicatat'}
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-slate-800">
              {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Batas catat mandiri: <strong className="text-blue-600">Tgl {waterUtilityConfig.readingDueDate} {new Date().toLocaleDateString('id-ID', { month: 'short' })}</strong>
            </p>
          </div>

          {currentWaterReading?.adminNotes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <span className="font-bold block text-slate-700 mb-0.5">Catatan Pengurus RT:</span>
              {currentWaterReading.adminNotes}
            </div>
          )}
        </Card>

        {/* Box 2: Kubikasi Pemakaian */}
        <Card className="p-6 border-slate-100 rounded-[2rem] bg-white shadow-sm space-y-4">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Volume Pemakaian</span>
          <div>
            <div className="text-3xl font-black text-blue-600 flex items-baseline gap-1">
              {currentWaterReading ? currentWaterReading.usage : 0}
              <span className="text-sm font-bold text-slate-400">m³</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentWaterReading ? (
                `Meter Lalu: ${currentWaterReading.previousReading} m³ → Baru: ${currentWaterReading.currentReading} m³`
              ) : (
                `Meter Terakhir: ${previousReadingNumber} m³`
              )}
            </p>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
            <span>Dicatat oleh:</span>
            <span className="font-bold text-slate-700">{currentWaterReading?.recordedByName || (currentWaterReading ? 'Warga' : '-')}</span>
          </div>
        </Card>

        {/* Box 3: Total Tagihan */}
        <Card className="p-6 border-slate-100 rounded-[2rem] bg-gradient-to-br from-emerald-50/50 to-white shadow-sm space-y-4 border-emerald-100">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total Tagihan Air</span>
          <div>
            <div className="text-3xl font-black text-emerald-600">
              Rp {currentWaterReading ? currentWaterReading.totalAmount.toLocaleString('id-ID') : 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {waterUtilityConfig.billingMode === 'pdam'
                ? `Paket Dasar PDAM (10 m³: Rp ${(waterUtilityConfig.baseFee || 35000).toLocaleString('id-ID')})`
                : waterUtilityConfig.billingMode === 'flat' 
                ? 'Tarif flat lingkungan' 
                : `Kubikasi (${waterUtilityConfig.ratePerM3}/m³)`}
            </p>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex justify-between">
            <span>Kelebihan Pemakaian:</span>
            <span className="font-bold text-slate-700">
              {currentWaterReading ? `${currentWaterReading.excessUsage || 0} m³ (Rp ${(currentWaterReading.excessFee || 0).toLocaleString('id-ID')})` : '-'}
            </span>
          </div>
        </Card>
      </div>

      {/* Photo Evidence Card (if recorded) */}
      {currentWaterReading?.photoUrl && (
        <Card className="p-6 border-slate-100 rounded-[2rem] bg-white shadow-sm">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-600" />
            Foto Bukti Angka Meteran Bulan Ini
          </h4>
          <div className="max-w-md rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
            <img
              src={currentWaterReading.photoUrl}
              alt="Foto Meteran Air"
              className="w-full h-56 object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Card>
      )}

      {/* Historical Usage Chart */}
      <Card className="p-6 sm:p-8 border-slate-100 rounded-[2.5rem] bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h4 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Tren Pemakaian Air Keluarga (m³)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Grafik riwayat kubikasi meteran air dari bulan ke bulan.</p>
          </div>
        </div>

        {houseWaterReadings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Droplets className="w-10 h-10 mx-auto mb-2 text-slate-300 opacity-50" />
            Belum ada rekaman riwayat meter air sebelumnya.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[...houseWaterReadings].reverse().map(r => ({
                  period: r.period,
                  usage: r.usage,
                  total: r.totalAmount
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} m³`, 'Pemakaian']}
                  labelFormatter={(label) => `Periode: ${label}`}
                />
                <Area type="monotone" dataKey="usage" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#waterGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* History Table */}
      <Card className="p-6 border-slate-100 rounded-[2.5rem] bg-white shadow-sm overflow-hidden">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">
          Riwayat Pencatatan Terdahulu
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Periode</th>
                <th className="py-3 px-4 text-center">Meter Awal</th>
                <th className="py-3 px-4 text-center">Meter Akhir</th>
                <th className="py-3 px-4 text-center">Pemakaian</th>
                <th className="py-3 px-4 text-right">Tagihan</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {houseWaterReadings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada riwayat pencatatan.
                  </td>
                </tr>
              ) : (
                houseWaterReadings.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{r.period}</td>
                    <td className="py-3 px-4 text-center font-mono">{r.previousReading} m³</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{r.currentReading} m³</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {r.usage} m³
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      Rp {r.totalAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Terverifikasi' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : r.status === 'Ditolak' 
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};
