import React, { useState } from 'react';
import { Wallet, ShieldCheck, ArrowUpRight, ArrowDownRight, Briefcase, Moon, Users, Home, Phone, CheckCircle, AlertTriangle, Target, Lightbulb, TrendingUp, Calendar, MapPin, Megaphone, Clock, Map as MapIcon } from 'lucide-react';
import { Official, CashFlow, RondaSchedule, RondaCheckLog, House, Announcement } from '../../types';
import { addRondaLog } from '../../services/databaseService';
import { Modal } from '../ui/Modal';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface PublicInfoProps {
  officials: Official[];
  cashFlow: CashFlow[];
  ronda: RondaSchedule[];
  rondaLogs: RondaCheckLog[];
  houses: House[];
  announcements: Announcement[];
}

export const PublicInfo: React.FC<PublicInfoProps> = ({ officials, cashFlow, ronda, rondaLogs, houses, announcements }) => {
    const totalIncome = cashFlow.filter(c => c.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = cashFlow.filter(c => c.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    const currentBalance = totalIncome - totalExpense;
    
    // Statistics
    const totalResidents = houses.reduce((acc, h) => acc + h.occupants, 0);
    const totalHouseholds = houses.filter(h => h.status === 'Occupied').length;
    const occupancyRate = Math.round((totalHouseholds / houses.length) * 100);

    const upcomingEvents = announcements
        .filter(a => a.type === 'Event' && new Date(a.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

    const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const roleHierarchy = ['Ketua RT', 'Sekretaris', 'Bendahara', 'Bendahara RW', 'Koord. Keamanan', 'Seksi'];
    const sortedOfficials = [...officials].sort((a, b) => { 
        const indexA = roleHierarchy.findIndex(r => a.role.includes(r)); 
        const indexB = roleHierarchy.findIndex(r => b.role.includes(r)); 
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB); 
    });

    const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
    const [checkLocation, setCheckLocation] = useState('');
    const [checkOfficer, setCheckOfficer] = useState('');
    
    const handleCheckSubmit = async (status: 'Aman' | 'Mencurigakan') => {
        if (!checkOfficer || !checkLocation) { alert("Nama petugas dan lokasi wajib diisi!"); return; }
        const newLog: any = {
            officerName: checkOfficer,
            location: checkLocation,
            status,
            timestamp: new Date().toISOString(),
            note: status === 'Aman' ? 'Kondisi aman terkendali.' : 'Perlu pemantauan lebih lanjut.'
        };
        await addRondaLog(newLog);
        alert(`Laporan patroli (${status}) tercatat!`);
        setIsCheckModalOpen(false);
        setCheckLocation('');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };
    
    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto px-4 py-8 mb-24 space-y-12"
        >
            {/* Hero Section */}
            <motion.div variants={itemVariants} className="relative rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl shadow-slate-900/20 min-h-[400px] flex items-center justify-center text-center px-6 py-12 group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900"></div>
                
                <div className="relative z-10 max-w-4xl mx-auto space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-widest uppercase backdrop-blur-md animate-pulse">
                        <ShieldCheck size={14} /> Transparansi & Akuntabilitas
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
                        Wajah Baru <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">RT 002</span>
                    </h1>
                    <p className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium drop-shadow-md">
                        Mewujudkan lingkungan yang aman, nyaman, dan harmonis melalui digitalisasi layanan dan keterbukaan informasi.
                    </p>
                    <div className="flex justify-center gap-4 pt-4">
                        <Link to="/services?tab=surat" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                            <Briefcase size={18} /> Layanan Warga
                        </Link>
                        <Link to="/peta" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold text-sm transition-all backdrop-blur-sm flex items-center gap-2">
                            <MapIcon size={18} /> Peta Wilayah
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Emergency Contacts & Events */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Emergency Contacts */}
                <motion.div variants={itemVariants} className="bg-rose-500 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-rose-500/20">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><AlertTriangle size={150}/></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl"><Phone size={24}/></div>
                            Kontak Darurat
                        </h2>
                        <div className="space-y-4">
                            <a href="tel:110" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white text-rose-600 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">P</div>
                                    <div><p className="font-bold text-lg">Polisi</p><p className="text-xs text-rose-100 opacity-80">Layanan Darurat</p></div>
                                </div>
                                <span className="text-2xl font-black tracking-widest">110</span>
                            </a>
                            <a href="tel:113" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white text-rose-600 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">D</div>
                                    <div><p className="font-bold text-lg">Damkar</p><p className="text-xs text-rose-100 opacity-80">Pemadam Kebakaran</p></div>
                                </div>
                                <span className="text-2xl font-black tracking-widest">113</span>
                            </a>
                            <a href="tel:118" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white text-rose-600 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">A</div>
                                    <div><p className="font-bold text-lg">Ambulans</p><p className="text-xs text-rose-100 opacity-80">Gawat Darurat Medis</p></div>
                                </div>
                                <span className="text-2xl font-black tracking-widest">118</span>
                            </a>
                            <div className="mt-6 pt-4 border-t border-white/20 text-center">
                                <p className="text-xs font-bold text-rose-100 mb-2 uppercase tracking-wider">Pos Keamanan RT 002</p>
                                <a href="tel:081234567890" className="text-xl font-black bg-white text-rose-600 px-4 py-2 rounded-xl inline-block shadow-lg hover:scale-105 transition-transform">0812-3456-7890</a>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Upcoming Events */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Calendar size={24}/></div>
                            Agenda Kegiatan
                        </h2>
                        <Link to="/" className="text-xs font-bold text-indigo-600 hover:underline uppercase tracking-wider">Lihat Semua</Link>
                    </div>
                    
                    {upcomingEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upcomingEvents.map((event) => (
                                <div key={event.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10">
                                        <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wide mb-3">
                                            {new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <h3 className="text-lg font-black text-slate-800 mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors">{event.title}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-2 mb-4">{event.content}</p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                            <Clock size={14} />
                                            <span>08:00 WIB</span>
                                            <span className="mx-1">•</span>
                                            <MapPin size={14} />
                                            <span>Balai Warga</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Tidak Ada Agenda</h3>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">Belum ada kegiatan atau acara yang dijadwalkan dalam waktu dekat.</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Vision & Mission */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                        <Target size={180} />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                            <Target size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-4">Visi Kami</h2>
                        <p className="text-slate-600 leading-relaxed">
                            "Menjadikan RT 002 sebagai lingkungan hunian yang mandiri, aman, dan guyub rukun berbasis teknologi informasi serta gotong royong."
                        </p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                        <Lightbulb size={180} />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                            <Lightbulb size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-4">Misi Utama</h2>
                        <ul className="space-y-3 text-slate-600">
                            <li className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                <span>Digitalisasi pelayanan administrasi warga.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                <span>Peningkatan keamanan lingkungan terpadu (Siskamling).</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                <span>Transparansi pengelolaan dana sosial dan pembangunan.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </motion.div>

            {/* Key Statistics */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><TrendingUp size={24}/></div>
                    <h2 className="text-2xl font-bold text-slate-800">Statistik Lingkungan</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Penduduk</p>
                        <h3 className="text-3xl font-black text-slate-800">{totalResidents}</h3>
                        <p className="text-xs text-slate-400 mt-1">Jiwa</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Kepala Keluarga</p>
                        <h3 className="text-3xl font-black text-slate-800">{totalHouseholds}</h3>
                        <p className="text-xs text-slate-400 mt-1">KK Terdaftar</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Unit Rumah</p>
                        <h3 className="text-3xl font-black text-slate-800">{houses.length}</h3>
                        <p className="text-xs text-slate-400 mt-1">Total Unit</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Okupansi</p>
                        <h3 className="text-3xl font-black text-emerald-600">{occupancyRate}%</h3>
                        <p className="text-xs text-slate-400 mt-1">Tingkat Hunian</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Financial Report */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={200}/></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <p className="text-slate-400 font-medium text-sm uppercase tracking-wider mb-1">Laporan Keuangan</p>
                                <h2 className="text-3xl font-black text-white">Kas RT 002</h2>
                            </div>
                            <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-500/30">
                                Update: {new Date().toLocaleDateString('id-ID', {month: 'long', year: 'numeric'})}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                                <p className="text-slate-400 text-xs font-bold uppercase mb-2">Saldo Saat Ini</p>
                                <h3 className="text-3xl font-black text-white">Rp {currentBalance.toLocaleString()}</h3>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                                    <div className="p-1 bg-emerald-500/20 rounded-full"><ArrowUpRight size={12}/></div>
                                    <p className="text-xs font-bold uppercase">Pemasukan</p>
                                </div>
                                <h3 className="text-2xl font-black text-white">Rp {totalIncome.toLocaleString()}</h3>
                            </div>
                            <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2 text-rose-400">
                                    <div className="p-1 bg-rose-500/20 rounded-full"><ArrowDownRight size={12}/></div>
                                    <p className="text-xs font-bold uppercase">Pengeluaran</p>
                                </div>
                                <h3 className="text-2xl font-black text-white">Rp {totalExpense.toLocaleString()}</h3>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Riwayat Transaksi Terakhir</h4>
                            <div className="space-y-3">
                                {cashFlow.slice(0, 3).map((flow) => (
                                    <div key={flow.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${flow.type === 'Income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                {flow.type === 'Income' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white">{flow.description}</p>
                                                <p className="text-xs text-slate-400">{new Date(flow.date).toLocaleDateString('id-ID')}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-sm ${flow.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {flow.type === 'Income' ? '+' : '-'} Rp {flow.amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Security Schedule */}
                <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-slate-400 font-medium text-xs uppercase tracking-wider mb-1">Jadwal Siskamling</p>
                            <h2 className="text-2xl font-black text-slate-800">Minggu Ini</h2>
                        </div>
                        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
                            <Moon size={24} />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                        {ronda.map((schedule, idx) => {
                            const isToday = schedule.day === new Date().toLocaleDateString('id-ID', {weekday:'long'});
                            return (
                                <div key={idx} className={`p-4 rounded-2xl border transition-all ${isToday ? 'bg-indigo-50 border-indigo-100 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className={`font-black text-sm ${isToday ? 'text-indigo-700' : 'text-slate-700'}`}>{schedule.day}</h4>
                                        {isToday && <span className="px-2 py-0.5 bg-indigo-200 text-indigo-700 text-[10px] font-bold rounded-full uppercase">Hari Ini</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {schedule.members.map((member, i) => (
                                            <span key={i} className={`text-xs px-2 py-1 rounded-lg font-medium ${isToday ? 'bg-white text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                                {member}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
            
            {/* Officials Section */}
            <motion.div variants={itemVariants} className="pt-8 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600"><Users size={24}/></div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Struktur Pengurus RT</h2>
                        <p className="text-sm text-slate-500">Periode Jabatan 2023 - 2026</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {sortedOfficials.map(o => (
                        <div key={o.id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                            <div className={`h-24 relative ${o.role.includes('Ketua') ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-slate-800'}`}>
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            </div>
                            <div className="px-6 pb-6 text-center -mt-12 relative">
                                <div className="inline-block p-1.5 bg-white rounded-full shadow-lg">
                                    <img src={o.photo||`https://ui-avatars.com/api/?name=${o.name}&background=random&size=128`} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 bg-slate-100" alt={o.name}/>
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg mt-3">{o.name}</h3>
                                <div className="mt-1 mb-4">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${o.role.includes('Ketua') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                        {o.role}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-2 text-left">
                                    <div className="bg-slate-50 p-2 rounded-xl">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Domisili</p>
                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1"><Home size={10}/> {o.houseId}</p>
                                    </div>
                                    <a href={`https://wa.me/${o.phone}`} target="_blank" rel="noreferrer" className="bg-green-50 hover:bg-green-100 p-2 rounded-xl transition-colors cursor-pointer">
                                        <p className="text-[10px] text-green-600 font-bold uppercase">Kontak</p>
                                        <p className="text-xs font-bold text-green-700 flex items-center gap-1"><Phone size={10}/> WhatsApp</p>
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        
            <Modal isOpen={isCheckModalOpen} onClose={() => setIsCheckModalOpen(false)} title="Laporan Patroli Digital">
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                        <p className="text-xs font-bold text-slate-500 uppercase">Waktu Check-In</p>
                        <p className="text-xl font-black text-slate-800 font-mono mt-1">{new Date().toLocaleTimeString()}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-700">Nama Petugas</label>
                        <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" placeholder="Nama Anda" value={checkOfficer} onChange={e => setCheckOfficer(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-700">Lokasi / Titik Pantau</label>
                        <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={checkLocation} onChange={e => setCheckLocation(e.target.value)}>
                            <option value="">-- Pilih Lokasi --</option>
                            <option value="Gerbang Utama">Gerbang Utama</option>
                            <option value="Pos Satpam">Pos Satpam</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button onClick={() => handleCheckSubmit('Aman')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex flex-col items-center justify-center gap-1">
                            <CheckCircle size={24}/>
                            <span>AMAN</span>
                        </button>
                        <button onClick={() => handleCheckSubmit('Mencurigakan')} className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-200 transition-all active:scale-95 flex flex-col items-center justify-center gap-1">
                            <AlertTriangle size={24}/>
                            <span>MENCURIGAKAN</span>
                        </button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
};
