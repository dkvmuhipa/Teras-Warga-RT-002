import React from 'react';
import { 
  Sun, Cloud, CloudRain, CloudLightning, CloudFog, 
  Wind, Droplets, Thermometer, ShieldAlert, AlertTriangle, 
  Share2, RefreshCw, Compass, Eye, ShieldCheck, Info, CheckCircle2,
  Sparkles, Flame, Gauge
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { WeatherData } from '../../hooks/useWeather';
import { toast } from 'sonner';

interface WeatherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData | null;
  loading: boolean;
  onRefresh?: () => void;
}

export const WeatherDetailModal: React.FC<WeatherDetailModalProps> = ({
  isOpen,
  onClose,
  weather,
  loading,
  onRefresh
}) => {
  if (!isOpen) return null;

  const getWeatherIcon = (code?: number) => {
    if (code === undefined || code === 0) return <Sun size={36} className="text-amber-500 animate-spin-slow" />;
    if (code >= 1 && code <= 3) return <Cloud size={36} className="text-sky-500" />;
    if (code === 45 || code === 48) return <CloudFog size={36} className="text-slate-400" />;
    if (code >= 51 && code <= 55) return <CloudRain size={36} className="text-blue-400" />;
    if (code >= 61 && code <= 65) return <CloudRain size={36} className="text-blue-600" />;
    if (code >= 80 && code <= 82) return <CloudRain size={36} className="text-indigo-600" />;
    if (code >= 95) return <CloudLightning size={36} className="text-amber-500" />;
    return <Sun size={36} className="text-amber-500 animate-spin-slow" />;
  };

  const getUvLevel = (uv: number = 5) => {
    if (uv <= 2) return { label: 'Rendah (Aman)', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (uv <= 5) return { label: 'Sedang (Kacamata/Topi)', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    if (uv <= 7) return { label: 'Tinggi (Gunakan Sunscreen)', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    if (uv <= 10) return { label: 'Sangat Tinggi (Kurangi Terik)', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
    return { label: 'Ekstrem (Wajib Lindungi Kulit)', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
  };

  const uvInfo = getUvLevel(weather?.uvIndex);

  const handleShareToWhatsApp = () => {
    if (!weather) return;

    let alertNote = '';
    if (weather.isExtremeWind) {
      alertNote = `\n⚠️ *PERINGATAN ANGIN KENCANG*: Hembusan mencapai ${weather.windGusts} km/h. Harap pastikan atap kanopi dan jemuran terikat kuat!`;
    } else if (weather.isExtremeHeat) {
      alertNote = `\n🔥 *PERINGATAN PANAS TERIK*: Suhu mencapai ${weather.temp}°C (Terasa ${weather.apparentTemp}°C). Jaga hidrasi & batasi aktivitas terik matahari!`;
    } else if (weather.isHighPollution) {
      alertNote = `\n😷 *WASPADA KUALITAS UDARA*: AQI ${weather.aqi} (Sensitif). Disarankan gunakan masker saat keluar rumah.`;
    }

    const message = 
`🌤️ *SIAGA CUACA & INDEKS LINGKUNGAN HUNTAP TONDO 2*
*RT 002 / RW 020 Kelurahan Tondo, Kota Palu*
_Pembaruan Terkini: ${weather.lastUpdated || 'Hari ini'}_

🌡️ *Suhu*: ${weather.temp}°C (Suhu Terasa: ${weather.apparentTemp}°C)
💨 *Angin*: ${weather.windSpeed} km/h (Hembusan: ${weather.windGusts} km/h)
💧 *Kelembaban*: ${weather.humidity}%
☀️ *Indeks UV*: ${weather.uvIndex} (${uvInfo.label})
🌿 *Kualitas Udara (AQI)*: ${weather.aqi} - ${weather.aqiLabel}
🌫️ *Partikel Debu*: PM2.5: ${weather.pm2_5} µg/m³ | PM10: ${weather.pm10} µg/m³
☁️ *Kondisi*: ${weather.condition}${alertNote}

📍 _Stasiun Pantau: Huntap Tondo 2, Palu Timur_
📲 _Cek portal warga resmi:_ https://teraswarga02.web.app`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stasiun Cuaca & Kualitas Udara Huntap"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 p-1 text-left">
        {/* Geographic Subtitle */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
          <div className="flex items-center gap-2">
            <Compass size={15} className="text-amber-600 shrink-0" />
            <span className="font-bold text-slate-700">
              Huntap Tondo 2 • RT 002 / RW 020, Palu (-0.8917°, 119.8707°)
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
            Elevasi ±80m dpl
          </span>
        </div>

        {/* Live Weather Alert Banner */}
        {weather?.alertMessage ? (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3 shadow-xs">
            <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 animate-pulse">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[9px] font-black uppercase tracking-wider">
                  Siaga Lingkungan Huntap
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  Update: {weather.lastUpdated || 'Baru saja'}
                </span>
              </div>
              <p className="text-xs font-bold text-amber-950 mt-1 leading-relaxed">
                {weather.alertMessage}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold text-emerald-900">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
              <span>Kondisi lingkungan dan parameter cuaca lereng Tondo terpantau stabil & aman.</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-black bg-emerald-100/80 px-2 py-0.5 rounded-lg shrink-0">
              Kondusif
            </span>
          </div>
        )}

        {/* Big Main Card: Temperature & Status Overview */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Sensor Real-Time Huntap</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl sm:text-6xl font-black font-sans tracking-tight">
                  {weather ? `${weather.temp}°` : '--'}
                </span>
                <div className="space-y-0.5">
                  <span className="text-base sm:text-lg font-black text-amber-400 block">
                    {weather?.condition || 'Cerah'}
                  </span>
                  <span className="text-xs text-slate-300 font-medium block">
                    Suhu terasa: <strong className="text-white font-black">{weather ? `${weather.apparentTemp}°C` : '--'}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10 self-start sm:self-center">
              <div className="p-1">
                {getWeatherIcon(weather?.weatherCode)}
              </div>
              <div className="text-left border-l border-white/15 pl-4 space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-300">Indeks Udara</p>
                <p className="text-base font-black text-emerald-400">
                  AQI {weather?.aqi || '--'} <span className="text-xs font-bold text-slate-200">({weather?.aqiLabel || 'Baik'})</span>
                </p>
                <p className="text-[10px] text-slate-300">PM2.5: {weather?.pm2_5 || 0} µg/m³</p>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Key Environmental Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Angin & Hembusan */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest">Kecepatan Angin</span>
              <Wind size={15} className="text-emerald-500" />
            </div>
            <p className="text-base font-black text-slate-900">
              {weather?.windSpeed ?? '--'} <span className="text-xs font-medium text-slate-500">km/h</span>
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              Hembusan: <strong className="text-slate-800">{weather?.windGusts ?? '--'} km/h</strong>
            </p>
          </div>

          {/* Kelembaban Udara */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest">Kelembaban Relatif</span>
              <Droplets size={15} className="text-blue-500" />
            </div>
            <p className="text-base font-black text-slate-900">
              {weather?.humidity ?? '--'} <span className="text-xs font-medium text-slate-500">%</span>
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              {((weather?.humidity ?? 70) > 80) ? 'Lembab Tinggi' : 'Normal Sejuk'}
            </p>
          </div>

          {/* Indeks Sinar UV */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest">Indeks Sinar UV</span>
              <Sun size={15} className="text-amber-500" />
            </div>
            <p className="text-base font-black text-slate-900">
              {weather?.uvIndex ?? 5} <span className="text-xs font-medium text-slate-500">/ 11+</span>
            </p>
            <p className={`text-[10px] font-bold ${uvInfo.color} truncate`}>
              {uvInfo.label}
            </p>
          </div>

          {/* Kualitas Partikel Debu (PM2.5 & PM10) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest">Partikel Debu (PM2.5)</span>
              <Eye size={15} className="text-indigo-500" />
            </div>
            <p className="text-base font-black text-slate-900">
              {weather?.pm2_5 ?? '--'} <span className="text-xs font-medium text-slate-500">µg/m³</span>
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              PM10: <strong className="text-slate-800">{weather?.pm10 ?? '--'} µg/m³</strong>
            </p>
          </div>

          {/* Tekanan Barometrik */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest">Tekanan Barometer</span>
              <Gauge size={15} className="text-purple-500" />
            </div>
            <p className="text-base font-black text-slate-900">
              {weather?.surfacePressure ?? 1011} <span className="text-xs font-medium text-slate-500">hPa</span>
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              Stabilitas Lereng Bukit
            </p>
          </div>

          {/* Suhu Panas / Heat Index */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest">Suhu Terasa Kulit</span>
              <Flame size={15} className="text-rose-500" />
            </div>
            <p className="text-base font-black text-slate-900">
              {weather?.apparentTemp ?? '--'} <span className="text-xs font-medium text-slate-500">°C</span>
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              {((weather?.apparentTemp ?? 30) >= 35) ? 'Waspada Dehidrasi' : 'Toleransi Nyaman'}
            </p>
          </div>
        </div>

        {/* AQI Progress Scale Bar */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-black text-slate-800 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              Skala Indeks Kualitas Udara (US AQI)
            </span>
            <span className={`font-black text-xs px-2 py-0.5 rounded-md ${
              (weather?.aqi || 0) <= 50 ? 'bg-emerald-100 text-emerald-800' :
              (weather?.aqi || 0) <= 100 ? 'bg-yellow-100 text-yellow-800' :
              (weather?.aqi || 0) <= 150 ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'
            }`}>
              Nilai: {weather?.aqi || 0} - {weather?.aqiLabel || 'Bagus'}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 via-orange-500 to-rose-600 relative overflow-hidden shadow-inner" />

          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider pt-0.5">
            <span className="text-emerald-600">0-50 Baik</span>
            <span className="text-yellow-600">51-100 Sedang</span>
            <span className="text-orange-600">101-150 Sensitif</span>
            <span className="text-rose-600">151+ Berbahaya</span>
          </div>
        </div>

        {/* Protective Guidelines for Huntap Residents */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-600" />
            Panduan Tanggap Cuaca Hunian Tetap (Huntap Tondo 2)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-black text-slate-900 flex items-center gap-1.5">
                <span>💨</span> Angin Lembah & Perbukitan
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Kawasan bukit sering mengalami hembusan angin kencang mendadak. Pastikan atap seng kanopi, tandon air, dan barang halaman terikat kuat.
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-black text-slate-900 flex items-center gap-1.5">
                <span>☀️</span> Terik Siang & Hidrasi Warga
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Suhu udara kota Palu di siang hari cenderung menyengat. Disarankan minum minimal 2.5 liter air/hari dan kenakan topi/payung saat di luar.
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-black text-slate-900 flex items-center gap-1.5">
                <span>💧</span> Efisiensi & Penampungan Air
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Tutup rapat tandon air rumah tangga agar tidak menjadi sarang nyamuk, serta gunakan air secukupnya selama periode cuaca panas kering.
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-black text-slate-900 flex items-center gap-1.5">
                <span>😷</span> Debu & Masker Luar Ruangan
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Bila hembusan angin membawa partikel debu dari jalur jalan lingkar atau tanah galian, dianjurkan menggunakan masker pelindung pernapasan.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => {
              if (onRefresh) onRefresh();
              toast.success("Memperbarui data sensor cuaca...", { duration: 1500 });
            }}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Perbarui Data Realtime</span>
          </button>

          <button
            onClick={handleShareToWhatsApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 size={14} />
            <span>Bagikan ke Grup WhatsApp RT</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
