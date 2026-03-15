import React, { useState, useMemo } from 'react';
import { PopulationReport, PopulationChangeLog, House } from '../../types';
import { generatePopulationReportPDF } from '../../services/pdfService';
import { addPopulationLogToDb, deletePopulationLogFromDb } from '../../services/databaseService';
import { 
  Plus, FileText, Trash2, TrendingUp, TrendingDown, 
  Users, Baby, Accessibility, Heart, User, 
  Calendar, ArrowRight, Activity, Clock, Filter,
  BarChart3, PieChart as PieChartIcon, List, LayoutGrid, Download
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, Legend 
} from 'recharts';

interface PopulationReportManagerProps {
  reports: PopulationReport[];
  onAddReport: (report: Omit<PopulationReport, 'id' | 'createdAt'>) => void;
  onDeleteReport: (id: string) => void;
  populationLogs: PopulationChangeLog[];
  setPopulationLogs: (logs: PopulationChangeLog[]) => void;
  houses: House[];
}

export const PopulationReportManager: React.FC<PopulationReportManagerProps> = ({ 
  reports, onAddReport, onDeleteReport, populationLogs, setPopulationLogs, houses 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [formData, setFormData] = useState<Omit<PopulationReport, 'id' | 'createdAt'>>({
    month: new Date().toISOString().slice(0, 7),
    year: new Date().getFullYear(),
    initialPopulation: 0,
    birthCount: 0,
    deathCount: 0,
    newcomerCount: 0,
    movedOutCount: 0,
    maleCount: 0,
    femaleCount: 0,
    seasonalCount: 0,
    seasonalMaleCount: 0,
    seasonalFemaleCount: 0,
    pregnantCount: 0,
    babyCount: 0,
    toddlerCount: 0,
    teenagerCount: 0,
    adultCount: 0,
    elderlyCount: 0,
    widowCount: 0,
  });

  const [logFormData, setLogFormData] = useState({
    type: 'Newcomer' as PopulationChangeLog['type'],
    name: '',
    phone: '',
    houseId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    details: {
      previousAddress: '',
      reasonForMoving: '',
      familyCount: 1,
      familyMembers: [] as {name: string, relationship: string, nik?: string}[],
      residenceType: 'Tetap' as 'Tetap' | 'Kontrak' | 'Kost',
      vulnerability: [] as string[],
      newAddress: '',
      fatherName: '',
      motherName: '',
      gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
      causeOfDeath: '',
      placeOfDeath: ''
    }
  });

  const handleGenerateFromLog = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const logsThisMonth = populationLogs.filter(log => log.date.startsWith(currentMonth));
    
    const birthCount = logsThisMonth.filter(l => l.type === 'Birth').length;
    const deathCount = logsThisMonth.filter(l => l.type === 'Death').length;
    const newcomerCount = logsThisMonth.filter(l => l.type === 'Newcomer').length;
    const movedOutCount = logsThisMonth.filter(l => l.type === 'MovedOut').length;

    let currentPregnant = 0;
    let currentBaby = 0;
    let currentToddler = 0;
    let currentTeenager = 0;
    let currentAdult = 0;
    let currentElderly = 0;
    let currentWidow = 0;
    let currentTotal = 0;

    houses.forEach(house => {
      if (house.status === 'Occupied') {
        currentTotal += house.occupants || 0;
        currentPregnant += house.pregnantCount || 0;
        currentBaby += house.babyCount || 0;
        currentToddler += house.toddlerCount || 0;
        currentTeenager += house.teenagerCount || 0;
        currentAdult += house.adultCount || 0;
        currentElderly += house.elderlyCount || 0;
        currentWidow += house.widowCount || 0;
      }
    });

    setFormData(prev => ({
      ...prev,
      month: currentMonth,
      birthCount,
      deathCount,
      newcomerCount,
      movedOutCount,
      pregnantCount: currentPregnant,
      babyCount: currentBaby,
      toddlerCount: currentToddler,
      teenagerCount: currentTeenager,
      adultCount: currentAdult,
      elderlyCount: currentElderly,
      widowCount: currentWidow,
    }));
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddReport(formData);
    setIsModalOpen(false);
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const logData = {
      ...logFormData,
      id: Date.now().toString(),
      details: logFormData.type === 'Newcomer' ? {
        previousAddress: logFormData.details.previousAddress,
        reasonForMoving: logFormData.details.reasonForMoving,
        familyCount: logFormData.details.familyCount,
        familyMembers: logFormData.details.familyCount > 1 ? logFormData.details.familyMembers : undefined,
        residenceType: logFormData.details.residenceType,
        vulnerability: logFormData.details.vulnerability
      } : logFormData.type === 'MovedOut' ? {
        newAddress: logFormData.details.newAddress,
        reasonForMoving: logFormData.details.reasonForMoving
      } : logFormData.type === 'Birth' ? {
        fatherName: logFormData.details.fatherName,
        motherName: logFormData.details.motherName,
        gender: logFormData.details.gender
      } : {
        causeOfDeath: logFormData.details.causeOfDeath,
        placeOfDeath: logFormData.details.placeOfDeath
      }
    };
    
    await addPopulationLogToDb(logData);
    setIsLogModalOpen(false);
    // Reset log form
    setLogFormData({
      type: 'Newcomer',
      name: '',
      phone: '',
      houseId: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      details: {
        previousAddress: '',
        reasonForMoving: '',
        familyCount: 1,
        familyMembers: [],
        residenceType: 'Tetap',
        vulnerability: [],
        newAddress: '',
        fatherName: '',
        motherName: '',
        gender: 'Laki-laki',
        causeOfDeath: '',
        placeOfDeath: ''
      }
    });
  };

  const handleDeleteLog = async (id: string) => {
    if (window.confirm('Hapus log mutasi ini?')) {
      await deletePopulationLogFromDb(id);
    }
  };

  const chartData = useMemo(() => {
    return [...reports].sort((a, b) => a.month.localeCompare(b.month)).map(r => ({
      name: r.month,
      total: r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0),
      mutasi: r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0)
    })).slice(-6);
  }, [reports]);

  const latestReport = reports[reports.length - 1];
  const totalPopulation = latestReport ? (latestReport.initialPopulation + latestReport.birthCount + latestReport.newcomerCount - latestReport.movedOutCount - (latestReport.deathCount || 0)) : 0;

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
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Laporan Kependudukan</h2>
          <p className="text-slate-500 font-medium mt-1">Analisis pertumbuhan dan mutasi penduduk RT 02.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsLogModalOpen(true)} 
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={18} /> Tambah Log Mutasi
          </button>
          <button 
            onClick={handleGenerateFromLog} 
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <FileText size={18} className="text-emerald-600" /> Generate Log
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus size={18} /> Tambah Laporan
          </button>
        </div>
      </div>

      {/* Quick Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={20} /></div>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Total Penduduk</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{totalPopulation} <span className="text-xs font-bold text-slate-400">Jiwa</span></h3>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
            <TrendingUp size={14} /> <span>Update Terakhir</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Heart size={20} /></div>
            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Kelompok Rentan</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">
            {(latestReport?.pregnantCount || 0) + (latestReport?.babyCount || 0) + (latestReport?.toddlerCount || 0) + (latestReport?.teenagerCount || 0) + (latestReport?.adultCount || 0) + (latestReport?.elderlyCount || 0) + (latestReport?.widowCount || 0)}
            <span className="text-xs font-bold text-slate-400"> Jiwa</span>
          </h3>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-500">
            <Activity size={14} /> <span>Prioritas Layanan</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Baby size={20} /></div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Kelahiran</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">+{latestReport?.birthCount || 0} <span className="text-xs font-bold text-slate-400">Bulan Ini</span></h3>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
            <TrendingUp size={14} /> <span>Pertumbuhan Positif</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><ArrowRight size={20} /></div>
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Mutasi Keluar</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">-{latestReport?.movedOutCount || 0} <span className="text-xs font-bold text-slate-400">Jiwa</span></h3>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-amber-600">
            <TrendingDown size={14} /> <span>Pindah Domisili</span>
          </div>
        </motion.div>
      </div>

      {/* Chart Section */}
      <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Tren Pertumbuhan Penduduk</h3>
            <p className="text-xs text-slate-500 font-medium">Visualisasi data 6 bulan terakhir</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-100"><BarChart3 size={20} className="text-slate-400" /></div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Reports Table Section */}
      <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Daftar Laporan Bulanan</h3>
            <p className="text-xs text-slate-500 font-medium">Rekapitulasi data kependudukan per periode</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button 
              onClick={() => setViewMode('table')} 
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              <List size={18}/>
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              <LayoutGrid size={18}/>
            </button>
          </div>
        </div>
        
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-slate-500 font-bold">
                <tr>
                  <th className="p-6 text-left">Periode</th>
                  <th className="p-6 text-right">Awal</th>
                  <th className="p-6 text-right">Lahir</th>
                  <th className="p-6 text-right">Meninggal</th>
                  <th className="p-6 text-right">Pendatang</th>
                  <th className="p-6 text-right">Pindah</th>
                  <th className="p-6 text-right">Akhir</th>
                  <th className="p-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports && reports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">
                          {r.month.split('-')[1]}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{r.month}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-right font-bold text-slate-600">{r.initialPopulation}</td>
                    <td className="p-6 text-right">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-xs">+{r.birthCount}</span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg font-bold text-xs">-{r.deathCount || 0}</span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs">+{r.newcomerCount}</span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg font-bold text-xs">-{r.movedOutCount}</span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-slate-900 text-base">
                          {r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0)}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Total Akhir</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => generatePopulationReportPDF(r)}
                          className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm("Apakah Anda yakin ingin menghapus laporan ini?")) {
                              onDeleteReport(r.id);
                            }
                          }} 
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map(r => (
              <div key={r.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center font-black text-indigo-600 border border-slate-100">
                      {r.month.split('-')[1]}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800">{r.month}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.year}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => generatePopulationReportPDF(r)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors" title="Download PDF"><Download size={16}/></button>
                    <button onClick={() => onDeleteReport(r.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Awal</p>
                    <p className="font-bold text-slate-800">{r.initialPopulation}</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Akhir</p>
                    <p className="font-black text-indigo-600">{r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between text-[10px] font-bold">
                  <span className="text-emerald-600">Lahir: +{r.birthCount}</span>
                  <span className="text-rose-600">Mati: -{r.deathCount || 0}</span>
                  <span className="text-blue-600">Masuk: +{r.newcomerCount}</span>
                  <span className="text-amber-600">Keluar: -{r.movedOutCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Mutation Log Section */}
      <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Activity size={20} /></div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Log Mutasi Penduduk</h3>
              <p className="text-xs text-slate-500 font-medium">Daftar kejadian kependudukan real-time</p>
            </div>
          </div>
          <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Lihat Semua Log</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 text-slate-500 font-bold">
              <tr>
                <th className="p-6 text-left">Waktu</th>
                <th className="p-6 text-left">Jenis Kejadian</th>
                <th className="p-6 text-left">Nama Warga</th>
                <th className="p-6 text-left">Lokasi</th>
                <th className="p-6 text-left">Keterangan</th>
                <th className="p-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {populationLogs && populationLogs.length > 0 ? populationLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      <span className="font-bold">{new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      log.type === 'Birth' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      log.type === 'Newcomer' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      log.type === 'MovedOut' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {log.type === 'Birth' ? 'Kelahiran' : log.type === 'Newcomer' ? 'Pendatang' : log.type === 'MovedOut' ? 'Pindah' : 'Kematian'}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><User size={14}/></div>
                      <p className="font-black text-slate-800">{(log as any).name || '-'}</p>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                      <Calendar size={14} className="text-slate-300" />
                      {log.houseId}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="space-y-2">
                      <p className="text-slate-500 font-medium italic">{log.description}</p>
                      {log.details && (
                        <div className="text-[10px] font-bold text-slate-500 bg-slate-100/50 p-3 rounded-xl border border-slate-200/50 grid grid-cols-1 gap-1">
                          {log.type === 'Newcomer' && (
                            <>
                              <div className="flex justify-between border-b border-slate-200/30 pb-1"><span>Asal:</span> <span className="text-blue-600">{log.details.previousAddress}</span></div>
                              <div className="flex justify-between border-b border-slate-200/30 pb-1"><span>Alasan:</span> <span className="text-blue-600">{log.details.reasonForMoving}</span></div>
                              <div className="flex justify-between"><span>Anggota:</span> <span className="text-blue-600">{log.details.familyCount} Orang</span></div>
                              {log.details.familyMembers && log.details.familyMembers.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-200/30">
                                  <p className="text-[9px] uppercase tracking-tighter text-slate-400 mb-1">Daftar Keluarga:</p>
                                  {log.details.familyMembers.map((m: any, i: number) => (
                                    <div key={i} className="flex justify-between text-[9px] gap-2">
                                      <span className="truncate">{m.name}</span>
                                      <span className="text-slate-400 shrink-0">({m.relationship})</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {log.details.residenceType && (
                                <div className="flex justify-between border-t border-slate-200/30 pt-1 mt-1">
                                  <span>Status:</span> <span className="text-emerald-600">{log.details.residenceType}</span>
                                </div>
                              )}
                              {log.details.vulnerability && log.details.vulnerability.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-slate-200/30">
                                  {log.details.vulnerability.map((v: string, i: number) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[8px] border border-rose-100">{v}</span>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                          {log.type === 'MovedOut' && (
                            <>
                              <div className="flex justify-between border-b border-slate-200/30 pb-1"><span>Tujuan:</span> <span className="text-amber-600">{log.details.newAddress}</span></div>
                              <div className="flex justify-between"><span>Alasan:</span> <span className="text-amber-600">{log.details.reasonForMoving}</span></div>
                            </>
                          )}
                          {log.type === 'Birth' && (
                            <>
                              <div className="flex justify-between border-b border-slate-200/30 pb-1"><span>Ayah:</span> <span className="text-emerald-600">{log.details.fatherName}</span></div>
                              <div className="flex justify-between border-b border-slate-200/30 pb-1"><span>Ibu:</span> <span className="text-emerald-600">{log.details.motherName}</span></div>
                              <div className="flex justify-between"><span>JK:</span> <span className="text-emerald-600">{log.details.gender}</span></div>
                            </>
                          )}
                          {log.type === 'Death' && (
                            <>
                              <div className="flex justify-between border-b border-slate-200/30 pb-1"><span>Penyebab:</span> <span className="text-rose-600">{log.details.causeOfDeath}</span></div>
                              <div className="flex justify-between"><span>Tempat:</span> <span className="text-rose-600">{log.details.placeOfDeath}</span></div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <button 
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Activity size={48} strokeWidth={1} className="opacity-20" />
                      <p className="text-sm font-bold italic">Belum ada log mutasi penduduk.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Laporan Bulanan">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} /> Periode Laporan
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Bulan (YYYY-MM)</label>
                <input 
                  type="text" 
                  value={formData.month} 
                  onChange={e => setFormData({...formData, month: e.target.value})} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Tahun</label>
                <input 
                  type="number" 
                  value={formData.year} 
                  onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                  required 
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} /> Angka Perubahan
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Penduduk Awal</label>
                <input 
                  type="number" 
                  value={formData.initialPopulation} 
                  onChange={e => setFormData({...formData, initialPopulation: parseInt(e.target.value)})} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Lahir</label>
                <input type="number" value={formData.birthCount} onChange={e => setFormData({...formData, birthCount: parseInt(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Meninggal</label>
                <input type="number" value={formData.deathCount} onChange={e => setFormData({...formData, deathCount: parseInt(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Pendatang</label>
                <input type="number" value={formData.newcomerCount} onChange={e => setFormData({...formData, newcomerCount: parseInt(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Pindah Keluar</label>
                <input type="number" value={formData.movedOutCount} onChange={e => setFormData({...formData, movedOutCount: parseInt(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" required />
              </div>
            </div>
          </div>

          <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100 space-y-4">
            <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
              <Heart size={14} /> Kelompok Rentan (Real-time)
            </h4>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: 'Hamil', key: 'pregnantCount' },
                { label: 'Bayi', key: 'babyCount' },
                { label: 'Balita', key: 'toddlerCount' },
                { label: 'Remaja', key: 'teenagerCount' },
                { label: 'Dewasa', key: 'adultCount' },
                { label: 'Lansia', key: 'elderlyCount' },
                { label: 'Janda', key: 'widowCount' }
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">{field.label}</label>
                  <input 
                    type="number" 
                    value={(formData as any)[field.key]} 
                    onChange={e => setFormData({...formData, [field.key]: parseInt(e.target.value) || 0})} 
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500/20 outline-none" 
                  />
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98]"
          >
            Simpan Laporan Bulanan
          </button>
        </form>
      </Modal>

      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Tambah Log Mutasi Warga" maxWidth="max-w-2xl">
        <form onSubmit={handleAddLog} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Jenis Mutasi</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'Newcomer', label: 'Masuk' },
                  { id: 'MovedOut', label: 'Pindah' },
                  { id: 'Birth', label: 'Lahir' },
                  { id: 'Death', label: 'Wafat' }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setLogFormData({ ...logFormData, type: type.id as any })}
                    className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${logFormData.type === type.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-200'}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Nama Warga</label>
              <input 
                type="text" 
                value={logFormData.name} 
                onChange={e => setLogFormData({ ...logFormData, name: e.target.value })} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Blok Rumah</label>
              <input 
                type="text" 
                value={logFormData.houseId} 
                onChange={e => setLogFormData({ ...logFormData, houseId: e.target.value.toUpperCase() })} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                placeholder="C7-02"
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">No. HP</label>
              <input 
                type="text" 
                value={logFormData.phone} 
                onChange={e => setLogFormData({ ...logFormData, phone: e.target.value })} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Tanggal</label>
              <input 
                type="date" 
                value={logFormData.date} 
                onChange={e => setLogFormData({ ...logFormData, date: e.target.value })} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                required 
              />
            </div>

            {/* Dynamic Fields */}
            {logFormData.type === 'Newcomer' && (
              <>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Alamat Asal</label>
                  <input 
                    type="text" 
                    value={logFormData.details.previousAddress} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, previousAddress: e.target.value } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Alasan Pindah</label>
                  <input 
                    type="text" 
                    value={logFormData.details.reasonForMoving} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, reasonForMoving: e.target.value } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Jumlah Anggota</label>
                  <input 
                    type="number" 
                    value={logFormData.details.familyCount} 
                    onChange={e => {
                      const count = parseInt(e.target.value) || 1;
                      const newMembers = count > 1 ? Array(count - 1).fill(null).map((_, i) => logFormData.details.familyMembers[i] || { name: '', relationship: '', nik: '' }) : [];
                      setLogFormData({ 
                        ...logFormData, 
                        details: { 
                          ...logFormData.details, 
                          familyCount: count,
                          familyMembers: newMembers
                        } 
                      });
                    }} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    required 
                    min="1"
                  />
                </div>
                {logFormData.details.familyCount > 1 && (
                  <div className="col-span-2 space-y-3 p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Biodata Anggota Keluarga Lainnya</p>
                    {logFormData.details.familyMembers.map((member, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-2 p-3 bg-white rounded-xl border border-slate-100">
                        <input 
                          placeholder="Nama Lengkap"
                          className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                          value={member.name}
                          onChange={e => {
                            const updated = [...logFormData.details.familyMembers];
                            updated[idx].name = e.target.value;
                            setLogFormData({ ...logFormData, details: { ...logFormData.details, familyMembers: updated } });
                          }}
                          required
                        />
                        <input 
                          placeholder="Hubungan"
                          className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                          value={member.relationship}
                          onChange={e => {
                            const updated = [...logFormData.details.familyMembers];
                            updated[idx].relationship = e.target.value;
                            setLogFormData({ ...logFormData, details: { ...logFormData.details, familyMembers: updated } });
                          }}
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Status Hunian</label>
                  <select 
                    value={logFormData.details.residenceType} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, residenceType: e.target.value as any } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                    <option value="Kost">Kost</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Kerentanan (Pilih yang sesuai)</label>
                  <div className="flex flex-wrap gap-2">
                    {['Ibu Hamil', 'Bayi', 'Balita', 'Lansia', 'Disabilitas', 'Janda/Duda'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          const current = logFormData.details.vulnerability || [];
                          const updated = current.includes(v) 
                            ? current.filter(item => item !== v) 
                            : [...current, v];
                          setLogFormData({ ...logFormData, details: { ...logFormData.details, vulnerability: updated } });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${
                          (logFormData.details.vulnerability || []).includes(v) 
                            ? 'bg-rose-500 text-white border-rose-500' 
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {logFormData.type === 'MovedOut' && (
              <>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Alamat Tujuan</label>
                  <input 
                    type="text" 
                    value={logFormData.details.newAddress} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, newAddress: e.target.value } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    required 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Alasan Pindah</label>
                  <input 
                    type="text" 
                    value={logFormData.details.reasonForMoving} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, reasonForMoving: e.target.value } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    required 
                  />
                </div>
              </>
            )}

            {logFormData.type === 'Birth' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Nama Ayah</label>
                  <input 
                    type="text" 
                    value={logFormData.details.fatherName} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, fatherName: e.target.value } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Nama Ibu</label>
                  <input 
                    type="text" 
                    value={logFormData.details.motherName} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, motherName: e.target.value } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    required 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Jenis Kelamin</label>
                  <div className="flex gap-2">
                    {['Laki-laki', 'Perempuan'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setLogFormData({ ...logFormData, details: { ...logFormData.details, gender: g as any } })}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${logFormData.details.gender === g ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {logFormData.type === 'Death' && (
              <>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Penyebab Kematian</label>
                  <input 
                    type="text" 
                    value={logFormData.details.causeOfDeath} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, causeOfDeath: e.target.value } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    required 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Tempat Kematian</label>
                  <input 
                    type="text" 
                    value={logFormData.details.placeOfDeath} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, placeOfDeath: e.target.value } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    required 
                  />
                </div>
              </>
            )}

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                {logFormData.type === 'Newcomer' ? 'Catatan Kedatangan' : 
                 logFormData.type === 'MovedOut' ? 'Catatan Kepindahan' : 
                 logFormData.type === 'Birth' ? 'Catatan Kelahiran' : 
                 'Catatan Kematian'}
              </label>
              <textarea 
                value={logFormData.description} 
                onChange={e => setLogFormData({ ...logFormData, description: e.target.value })} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all min-h-[80px] resize-none" 
                placeholder={
                  logFormData.type === 'Newcomer' ? 'Cth: Pindah karena tugas kerja...' : 
                  logFormData.type === 'MovedOut' ? 'Cth: Pindah ke luar kota...' : 
                  logFormData.type === 'Birth' ? 'Cth: Lahir normal di RS...' : 
                  'Cth: Meninggal karena sakit...'
                }
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-[0.98]"
          >
            Simpan Log Mutasi
          </button>
        </form>
      </Modal>
    </motion.div>
  );
};

