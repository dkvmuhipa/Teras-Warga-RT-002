import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, Search, ArrowLeft, Calendar, User, Scale, Ruler, Activity, 
  Thermometer, Info, ShieldCheck, TrendingUp, Droplets, Zap, Beaker,
  CheckSquare, Waves, Recycle, Sparkles, Check, Phone, ArrowRight, AlertTriangle
} from 'lucide-react';
import { HealthRecord } from '../../types';
import { subscribeToHealthRecords } from '../../services/databaseService';
import { auth } from '../../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const PublicHealth: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeMainTab, setActiveMainTab] = useState<'posyandu' | 'stbm'>(tabParam === 'stbm' ? 'stbm' : 'posyandu');

  useEffect(() => {
    if (tabParam === 'stbm') {
      setActiveMainTab('stbm');
    }
  }, [tabParam]);

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundRecords, setFoundRecords] = useState<HealthRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState<HealthRecord['category'] | 'All'>('All');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setRecords([]);
      return;
    }
    const unsubscribe = subscribeToHealthRecords(setRecords);
    return () => unsubscribe();
  }, [isAdmin]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsSearching(true);
    const filtered = records.filter(r => {
      const matchesSearch = searchQuery.trim() === '' || 
        r.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.houseId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === 'All' || r.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFoundRecords(filtered);
  };

  useEffect(() => {
    if (isSearching || activeCategory !== 'All') {
      handleSearch();
    }
  }, [activeCategory, records]);

  const stats = {
    total: records.length,
    bayi: records.filter(r => r.category === 'Bayi' || r.category === 'Balita').length,
    remaja: records.filter(r => r.category === 'Remaja').length,
    dewasa: records.filter(r => r.category === 'Dewasa').length,
    lansia: records.filter(r => r.category === 'Lansia').length,
    ibuHamil: records.filter(r => r.category === 'Ibu Hamil').length
  };

  // Prepare chart data for a specific resident if searched
  const chartData = useMemo(() => {
    if (!searchQuery || foundRecords.length < 2) return null;
    
    // Group by resident name to show their progress
    const name = foundRecords[0].residentName;
    const residentRecords = records
      .filter(r => r.residentName === name)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(r => ({
        date: new Date(r.date).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
        weight: r.weight,
        height: r.height,
        headCircumference: r.headCircumference,
        bloodSugar: r.bloodSugar,
        cholesterol: r.cholesterol,
        uricAcid: r.uricAcid
      }));
    
    return residentRecords;
  }, [foundRecords, records, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FDFDFF] pb-32">
      {/* Immersive Header */}
      <div className="relative bg-slate-950 pt-12 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/20 via-slate-950/90 to-slate-950" />
        
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="flex items-center justify-between mb-12">
            <Link to="/" className="group flex items-center gap-3 text-white/60 hover:text-white transition-all">
              <div className="p-2 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10">
                <ArrowLeft size={20} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Kembali</span>
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Sistem Terintegrasi</span>
            </div>
          </div>

          <div className="max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] mb-6"
            >
              {activeMainTab === 'stbm' ? (
                <>Sanitasi <br/><span className="text-emerald-400 italic font-serif">5 Pilar STBM</span></>
              ) : (
                <>Posyandu <br/><span className="text-emerald-400 italic font-serif">Digital</span></>
              )}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg font-medium leading-relaxed max-w-md"
            >
              {activeMainTab === 'stbm'
                ? 'Standar Sanitasi Total Berbasis Masyarakat Kemenkes RI di Huntap Tondo 2. Pemukiman Sehat 100% ODF Bebas BABS.'
                : 'Akses rekam medis keluarga Anda secara mandiri, transparan, dan aman dalam satu genggaman.'}
            </motion.p>

            {/* Main Tabs: Posyandu vs STBM */}
            <div className="flex flex-wrap items-center gap-2.5 p-1.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 w-fit mt-6">
              <button
                onClick={() => {
                  setActiveMainTab('posyandu');
                  setSearchParams({});
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeMainTab === 'posyandu'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Heart size={15} className={activeMainTab === 'posyandu' ? 'text-rose-500' : ''} />
                <span>Posyandu Digital</span>
              </button>

              <button
                onClick={() => {
                  setActiveMainTab('stbm');
                  setSearchParams({ tab: 'stbm' });
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeMainTab === 'stbm'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <CheckSquare size={15} className={activeMainTab === 'stbm' ? 'text-slate-950' : ''} />
                <span>5 Pilar STBM & ODF</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-200 border border-emerald-400/40 font-black">
                  100% ODF
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-20 space-y-12">
        {activeMainTab === 'stbm' ? (
          /* STBM 5 PILAR SECTION */
          <div className="space-y-8">
            {/* Executive ODF Banner */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 rounded-[3rem] p-8 md:p-12 text-white border border-emerald-500/30 shadow-2xl shadow-emerald-950/30 relative overflow-hidden"
            >
              <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      Sertifikasi ODF Kemenkes RI
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-slate-300 border border-white/10">
                      129 Huntap PUPR
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                    Huntap Tondo 2: Kawasan Percontohan 100% ODF
                  </h2>
                  <p className="text-sm md:text-base text-slate-300 font-medium max-w-2xl leading-relaxed">
                    Setiap unit hunian tetap (Huntap) di RT 002 / RW 020 Kelurahan Tondo telah dilengkapi tangki septik biotank pabrikan standar Kementerian PUPR dan terintegrasi dengan 5 Pilar Sanitasi Total Berbasis Masyarakat.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
                  <Link
                    to="/resident?tab=stbm"
                    className="px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Cek Kavling Saya</span>
                    <ArrowRight size={15} />
                  </Link>
                  <a
                    href="https://api.whatsapp.com/send?phone=6285961194621&text=Halo%20Pengurus%20RT%20002%2C%20saya%20ingin%20konsultasi%20pemeliharaan%20sanitasi%20STBM%20Huntap%20Tondo%202"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider border border-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Phone size={15} className="text-emerald-400" />
                    <span>Kontak Kader Posyandu</span>
                  </a>
                </div>
              </div>

              {/* 4 Pilar Metrik Lingkungan */}
              <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status Bebas BABS</span>
                  <span className="text-xl md:text-2xl font-black text-emerald-400 mt-1 block">100% ODF</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Nihil Buang Air Terbuka</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Jamban Sehat Biotank</span>
                  <span className="text-xl md:text-2xl font-black text-cyan-300 mt-1 block">129 Unit</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Standar Kedap PUPR</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Akses Air Minum</span>
                  <span className="text-xl md:text-2xl font-black text-teal-300 mt-1 block">PDAM Palu</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Meter Mandiri Digital</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Pengelolaan Sampah</span>
                  <span className="text-xl md:text-2xl font-black text-emerald-300 mt-1 block">TPS3R Aktif</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Retribusi Terjadwal</span>
                </div>
              </div>
            </motion.div>

            {/* Detailed 5 Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Pilar 1 */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-200/60">
                      Pilar 1 STBM
                    </span>
                    <span className="flex items-center gap-1 text-xs font-black text-emerald-600">
                      <Check size={16} /> 100% ODF
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Stop Buang Air Besar Sembarangan (BABS)</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Setiap rumah tangga menggunakan jamban leher angsa dengan penampungan biotank septik kedap air standar pabrikan yang tidak mencemari air tanah pemukiman.
                  </p>
                </div>
                <div className="p-3.5 bg-emerald-50/70 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2.5 border border-emerald-100">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <span>Jamban Kloset Leher Angsa + Biotank</span>
                </div>
              </div>

              {/* Pilar 2 */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-blue-200/60">
                      Pilar 2 STBM
                    </span>
                    <span className="flex items-center gap-1 text-xs font-black text-blue-600">
                      <Check size={16} /> Aktif
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Cuci Tangan Pakai Sabun (CTPS)</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Pemberdayaan kebiasaan cuci tangan menggunakan sabun pada air mengalir di 5 waktu kritis: sebelum makan, sebelum menyusui/menyiapkan pangan, setelah buang air, dan setelah memegang hewan.
                  </p>
                </div>
                <div className="p-3.5 bg-blue-50/70 rounded-2xl text-xs font-bold text-blue-800 flex items-center gap-2.5 border border-blue-100">
                  <Droplets size={18} className="text-blue-600 shrink-0" />
                  <span>Sarana CTPS Air Mengalir + Sabun</span>
                </div>
              </div>

              {/* Pilar 3 */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-200/60">
                      Pilar 3 STBM
                    </span>
                    <span className="flex items-center gap-1 text-xs font-black text-amber-600">
                      <Check size={16} /> Higienis
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Pengelolaan Air Minum & Pangan Rumah Tangga</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Air minum selalu dimasak sampai mendidih atau menggunakan filter air terstandar, serta makanan keluarga disimpan di wadah tertutup bebas dari kontaminasi lalat.
                  </p>
                </div>
                <div className="p-3.5 bg-amber-50/70 rounded-2xl text-xs font-bold text-amber-800 flex items-center gap-2.5 border border-amber-100">
                  <ShieldCheck size={18} className="text-amber-600 shrink-0" />
                  <span>Air Masak Mendidih & Wadah Tertutup</span>
                </div>
              </div>

              {/* Pilar 4 */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-teal-200/60">
                      Pilar 4 STBM
                    </span>
                    <span className="flex items-center gap-1 text-xs font-black text-teal-600">
                      <Check size={16} /> TPS3R
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Pengelolaan Sampah Rumah Tangga (TPS3R)</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Penerapan pilah sampah dari rumah (organik, anorganik, residu), larangan membakar sampah, dan pemanfaatan bank sampah digital RT 002.
                  </p>
                </div>
                <div className="p-3.5 bg-teal-50/70 rounded-2xl text-xs font-bold text-teal-800 flex items-center gap-2.5 border border-teal-100">
                  <Recycle size={18} className="text-teal-600 shrink-0" />
                  <span>Pilah Sampah + Pengangkutan Terjadwal</span>
                </div>
              </div>

              {/* Pilar 5 */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-violet-200/60">
                      Pilar 5 STBM
                    </span>
                    <span className="flex items-center gap-1 text-xs font-black text-violet-600">
                      <Check size={16} /> Terkoneksi
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Pengelolaan Limbah Cair Rumah Tangga (SPALDT)</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Pembuangan air limbah non-kakus (greywater) melalui pipa tertutup langsung ke saluran drainase induk Huntap tanpa adanya genangan berbau atau jentik nyamuk.
                  </p>
                </div>
                <div className="p-3.5 bg-violet-50/70 rounded-2xl text-xs font-bold text-violet-800 flex items-center gap-2.5 border border-violet-100">
                  <Waves size={18} className="text-violet-600 shrink-0" />
                  <span>Saluran Tertutup Tanpa Genangan</span>
                </div>
              </div>

              {/* Edukasi Biotank PUPR */}
              <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                    Petunjuk Teknis
                  </span>
                  <h3 className="text-lg font-black text-white">Pemeliharaan Biotank Huntap</h3>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Biotank mengandalkan bakteri pengurai alami. Jangan memasukkan deterjen keras berlebihan, bahan kimia keras, minyak goreng, atau pembalut ke dalam kloset.
                  </p>
                </div>
                <div className="p-3.5 bg-white/10 rounded-2xl text-xs font-bold text-slate-200 flex items-center gap-2.5">
                  <Sparkles size={18} className="text-amber-400 shrink-0" />
                  <span>Rawat Fasilitas Hunian Pasca Bencana</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* POSYANDU DIGITAL SECTION */
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total', value: stats.total, icon: Activity, color: 'text-slate-600', bg: 'bg-slate-50' },
                { label: 'Bayi/Balita', value: stats.bayi, icon: Heart, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Remaja', value: stats.remaja, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Dewasa', value: stats.dewasa, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Ibu Hamil', value: stats.ibuHamil, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'Lansia', value: stats.lansia, icon: User, color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/40"
                >
                  <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 shadow-inner`}>
                    <stat.icon size={20} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                </motion.div>
              ))}
            </div>

        {/* Search & Filter Section */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
          
          <div className="relative z-10 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Pencarian Data</h3>
                  <p className="text-sm text-slate-500 font-medium">Gunakan Nama Lengkap atau Blok Rumah untuk menemukan riwayat kesehatan.</p>
                </div>
                <form onSubmit={handleSearch} className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={22} />
                  <input 
                    type="text" 
                    placeholder="Contoh: Budi Santoso atau C10-08..." 
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-base font-bold focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg">
                    Cari
                  </button>
                </form>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {['All', 'Bayi', 'Balita', 'Remaja', 'Dewasa', 'Ibu Hamil', 'Lansia'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat as any)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeCategory === cat 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                >
                  {cat === 'All' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section (Only if searching specific resident) */}
        {chartData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/30"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tren Kesehatan</h3>
                <p className="text-sm text-slate-500 font-medium">Visualisasi perkembangan kesehatan {foundRecords[0].residentName}</p>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 900, marginBottom: '0.5rem' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '2rem', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                  <Line type="monotone" dataKey="weight" name="Berat (kg)" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="height" name="Tinggi (cm)" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  {foundRecords[0].category === 'Lansia' && (
                    <>
                      <Line type="monotone" dataKey="bloodSugar" name="Gula Darah" stroke="#f59e0b" strokeWidth={4} dot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
                      <Line type="monotone" dataKey="cholesterol" name="Kolesterol" stroke="#ef4444" strokeWidth={4} dot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Results Grid */}
        <div className="space-y-8">
          {isSearching && (
            <div className="flex items-center justify-between px-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Hasil Temuan ({foundRecords.length})</h3>
              <button 
                onClick={() => { setIsSearching(false); setFoundRecords([]); setSearchQuery(''); setActiveCategory('All'); }} 
                className="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-widest"
              >
                Reset Pencarian
              </button>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {foundRecords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {foundRecords.map((record, idx) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden group hover:-translate-y-2 transition-all duration-500"
                  >
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-8">
                        <div className={`p-4 rounded-3xl shadow-inner ${
                          record.category === 'Bayi' || record.category === 'Balita' ? 'bg-blue-50 text-blue-600' :
                          record.category === 'Remaja' ? 'bg-indigo-50 text-indigo-600' :
                          record.category === 'Dewasa' ? 'bg-emerald-50 text-emerald-600' :
                          record.category === 'Ibu Hamil' ? 'bg-rose-50 text-rose-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          <Activity size={24} />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                            {record.category}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <Calendar size={12} className="text-emerald-500" />
                            {new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      <div className="mb-8">
                        <h4 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors tracking-tight">{record.residentName}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Blok Kediaman {record.houseId}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        {[
                          { label: 'Berat', value: record.weight, unit: 'kg', icon: Scale, color: 'text-blue-500' },
                          { label: 'Tinggi', value: record.height, unit: 'cm', icon: Ruler, color: 'text-emerald-500' },
                          { label: 'Tensi', value: record.bloodPressure, unit: '', icon: Activity, color: 'text-rose-500' },
                          { label: 'Suhu', value: record.temperature, unit: '°C', icon: Thermometer, color: 'text-amber-500' },
                          { label: 'Lingkar Kepala', value: record.headCircumference, unit: 'cm', icon: Beaker, color: 'text-indigo-500' },
                          { label: 'Gula Darah', value: record.bloodSugar, unit: 'mg/dL', icon: Droplets, color: 'text-orange-500' },
                          { label: 'Kolesterol', value: record.cholesterol, unit: 'mg/dL', icon: Beaker, color: 'text-red-500' },
                          { label: 'Asam Urat', value: record.uricAcid, unit: 'mg/dL', icon: Zap, color: 'text-yellow-500' },
                        ].filter(item => item.value).map((item, i) => (
                          <div key={i} className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <item.icon size={12} className={item.color} /> {item.label}
                            </p>
                            <p className="text-lg font-black text-slate-800">{item.value} <span className="text-[10px] text-slate-400 font-bold">{item.unit}</span></p>
                          </div>
                        ))}
                      </div>

                      {record.immunizationType && (
                        <div className="mb-8 p-5 bg-blue-50/50 rounded-[2rem] border border-blue-100">
                          <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Riwayat Imunisasi</p>
                          <p className="text-sm font-bold text-slate-700">{record.immunizationType}</p>
                        </div>
                      )}

                      {record.notes && (
                        <div className="mb-8 p-5 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Info size={40} className="text-emerald-600" />
                          </div>
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Analisis Petugas</p>
                          <p className="text-sm font-medium text-slate-600 leading-relaxed italic relative z-10">"{record.notes}"</p>
                        </div>
                      )}

                      <div className="pt-6 border-t border-slate-50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Petugas Pemeriksa</p>
                          <p className="text-xs font-bold text-slate-700">{record.officerName}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : isSearching ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-xl shadow-slate-200/20"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-8">
                  <Search size={48} />
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Data Tidak Ditemukan</h4>
                <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm">Mohon pastikan ejaan nama atau nomor blok rumah sudah sesuai dengan data RT.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: 'Monitoring Rutin', desc: 'Pantau tumbuh kembang anak dan kesehatan lansia setiap bulan secara akurat.', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { title: 'Privasi Terjamin', desc: 'Data kesehatan Anda bersifat rahasia dan hanya dapat diakses melalui pencarian warga.', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { title: 'Analisis Digital', desc: 'Dapatkan catatan dan saran kesehatan langsung dari petugas Posyandu RT 02.', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10 text-center group hover:bg-slate-950 transition-all duration-500"
                  >
                    <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform`}>
                      <item.icon size={32} />
                    </div>
                    <h4 className="font-black text-slate-900 text-lg mb-4 group-hover:text-white transition-colors tracking-tight">{item.title}</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed group-hover:text-slate-400 transition-colors">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </>
    )}
      </div>
    </div>
  );
};
