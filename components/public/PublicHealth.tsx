import React, { useState, useEffect } from 'react';
import { Heart, Search, ArrowLeft, Calendar, User, Scale, Ruler, Activity, Thermometer, Info, ShieldCheck } from 'lucide-react';
import { HealthRecord } from '../../types';
import { subscribeToHealthRecords } from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export const PublicHealth: React.FC = () => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundRecords, setFoundRecords] = useState<HealthRecord[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToHealthRecords(setRecords);
    return () => unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const filtered = records.filter(r => 
      r.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.houseId.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFoundRecords(filtered);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="p-2 -ml-2 text-slate-400 hover:text-emerald-600 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-lg font-black text-slate-800 tracking-tight">Monitoring Kesehatan</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Heart size={160} />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-2">Posyandu Digital</h2>
            <p className="text-emerald-100 font-medium max-w-md">Pantau perkembangan kesehatan keluarga Anda melalui catatan digital Posyandu RT 002.</p>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Search size={16} className="text-emerald-500" /> Cari Data Kesehatan
          </h3>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Masukkan Nama Lengkap atau Blok Rumah..." 
              className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-100">
              Cari Data
            </button>
          </form>
          <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-blue-700 leading-relaxed">
              Data yang ditampilkan adalah riwayat pemeriksaan kesehatan di Posyandu RT 002. Jika ada ketidaksesuaian data, silakan hubungi pengurus atau petugas Posyandu.
            </p>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {isSearching && (
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Hasil Pencarian ({foundRecords.length})</h3>
              <button onClick={() => { setIsSearching(false); setFoundRecords([]); setSearchQuery(''); }} className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest">Hapus</button>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {foundRecords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {foundRecords.map((record) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl shadow-sm ${
                          record.category === 'Bayi' || record.category === 'Balita' ? 'bg-blue-50 text-blue-600' :
                          record.category === 'Ibu Hamil' ? 'bg-rose-50 text-rose-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          <Heart size={20} />
                        </div>
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                          {record.category}
                        </span>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-lg font-black text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors">{record.residentName}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Blok {record.houseId}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {record.weight && (
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <Scale size={10} /> Berat
                            </p>
                            <p className="text-sm font-black text-slate-700">{record.weight} kg</p>
                          </div>
                        )}
                        {record.height && (
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <Ruler size={10} /> Tinggi
                            </p>
                            <p className="text-sm font-black text-slate-700">{record.height} cm</p>
                          </div>
                        )}
                        {record.bloodPressure && (
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <Activity size={10} /> Tensi
                            </p>
                            <p className="text-sm font-black text-slate-700">{record.bloodPressure}</p>
                          </div>
                        )}
                        {record.temperature && (
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <Thermometer size={10} /> Suhu
                            </p>
                            <p className="text-sm font-black text-slate-700">{record.temperature} °C</p>
                          </div>
                        )}
                      </div>

                      {record.notes && (
                        <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Catatan Petugas</p>
                          <p className="text-xs font-bold text-slate-600 leading-relaxed italic">"{record.notes}"</p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <Calendar size={12} className="text-emerald-500" />
                          {new Date(record.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <User size={12} className="text-emerald-500" />
                          {record.officerName}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : isSearching ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <Search size={32} />
                </div>
                <h4 className="text-lg font-black text-slate-800 mb-2">Data Tidak Ditemukan</h4>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">Pastikan nama atau blok rumah yang Anda masukkan sudah benar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto"><User size={24} /></div>
                  <h4 className="font-black text-slate-800 text-sm">Cek Berkala</h4>
                  <p className="text-[10px] text-slate-400 font-bold">Pantau tumbuh kembang anak dan kesehatan lansia setiap bulan.</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto"><ShieldCheck size={24} /></div>
                  <h4 className="font-black text-slate-800 text-sm">Data Aman</h4>
                  <p className="text-[10px] text-slate-400 font-bold">Seluruh data kesehatan tersimpan aman dan hanya dapat diakses warga.</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center space-y-3">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto"><Activity size={24} /></div>
                  <h4 className="font-black text-slate-800 text-sm">Grafik Sehat</h4>
                  <p className="text-[10px] text-slate-400 font-bold">Segera hadir fitur grafik perkembangan kesehatan otomatis.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
