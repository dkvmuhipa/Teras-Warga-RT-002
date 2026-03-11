import React from 'react';
import { motion } from 'motion/react';
import { useWeather } from '../hooks/useWeather';
import { Wind, Droplets, Thermometer, Activity, Info, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const WeatherDetails = () => {
    const { weather, loading } = useWeather();

    if (loading || !weather) return null;

    const getHealthAdvice = (aqi: number) => {
        if (aqi <= 50) return "Kualitas udara sangat baik. Cocok untuk aktivitas luar ruangan dan olahraga.";
        if (aqi <= 100) return "Kualitas udara sedang. Kelompok sensitif sebaiknya mengurangi aktivitas fisik yang lama di luar ruangan.";
        if (aqi <= 150) return "Udara kurang sehat bagi kelompok sensitif. Gunakan masker jika berada di luar ruangan dalam waktu lama.";
        if (aqi <= 200) return "Udara tidak sehat. Kurangi aktivitas luar ruangan. Gunakan masker medis jika harus keluar.";
        return "Udara sangat berbahaya! Tetap di dalam ruangan dan gunakan pemurni udara jika ada.";
    };

    const getAqiStatusIcon = (aqi: number) => {
        if (aqi <= 50) return <CheckCircle2 className="text-emerald-500" size={24} />;
        if (aqi <= 100) return <Info className="text-yellow-500" size={24} />;
        if (aqi <= 150) return <AlertCircle className="text-orange-500" size={24} />;
        return <ShieldAlert className="text-rose-500" size={24} />;
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
            {/* Air Quality Detail Card */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">Environmental Intelligence</p>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Kualitas Udara & Kesehatan</h3>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            {getAqiStatusIcon(weather.aqi)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="space-y-6">
                            <div className="flex items-end gap-3">
                                <span className={`text-7xl font-black tracking-tighter ${weather.aqiColor}`}>{weather.aqi}</span>
                                <div className="pb-2">
                                    <p className={`text-sm font-black uppercase tracking-widest ${weather.aqiColor}`}>{weather.aqiLabel}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">US AQI Index</p>
                                </div>
                            </div>
                            
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                                    "{getHealthAdvice(weather.aqi)}"
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PM2.5</p>
                                <p className="text-xl font-black text-slate-800">{weather.pm2_5.toFixed(1)} <span className="text-[10px] text-slate-400">µg/m³</span></p>
                            </div>
                            <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PM10</p>
                                <p className="text-xl font-black text-slate-800">{weather.pm10.toFixed(1)} <span className="text-[10px] text-slate-400">µg/m³</span></p>
                            </div>
                            <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kelembaban</p>
                                <p className="text-xl font-black text-slate-800">{weather.humidity}%</p>
                            </div>
                            <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Angin</p>
                                <p className="text-xl font-black text-slate-800">{weather.windSpeed} <span className="text-[10px] text-slate-400">km/h</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Weather Alert / Tip Card */}
            <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                            <Activity size={24} />
                        </div>
                        <h4 className="text-xl font-black tracking-tight mb-3">Tips Hari Ini</h4>
                        <p className="text-sm font-medium text-indigo-100 leading-relaxed">
                            {weather.temp > 32 ? "Suhu cukup panas hari ini. Pastikan warga tetap terhidrasi dan kurangi aktivitas berat di bawah sinar matahari langsung." : 
                             weather.weatherCode >= 51 ? "Potensi hujan terdeteksi. Jangan lupa membawa payung dan pastikan saluran air di depan rumah tidak tersumbat." :
                             "Cuaca hari ini cukup bersahabat. Waktu yang tepat untuk berolahraga atau beraktivitas di taman Huntap."}
                        </p>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Update Terakhir</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Baru Saja</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
