import React, { useState } from 'react';
import { DollarSign, Plus, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Filter, Search, Download, PieChart, Wallet } from 'lucide-react';
import { CashFlow } from '../../types';
import { getIndonesianMonthYear, generateMonthOptions } from '../../src/utils/dateUtils';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { addTransactionToDb, updateTransactionInDb, deleteTransactionFromDb } from '../../services/databaseService';
import { toast } from 'sonner';
import { generateCashFlowReportPDF } from '../../services/pdfService';

interface FinanceManagerProps {
  cashFlow: CashFlow[];
  pdfConfig: any;
}

export const FinanceManager: React.FC<FinanceManagerProps> = ({ cashFlow, pdfConfig }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [selectedMonth, setSelectedMonth] = useState(getIndonesianMonthYear(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Income');
  const [category, setCategory] = useState('Iuran');

  // Stats Calculation
  const totalIncome = cashFlow.filter(cf => cf.type === 'Income').reduce((acc, cf) => acc + cf.amount, 0);
  const totalExpense = cashFlow.filter(cf => cf.type === 'Expense').reduce((acc, cf) => acc + cf.amount, 0);
  const balance = totalIncome - totalExpense;

  // Chart Data Preparation (Monthly)
  const chartData = React.useMemo(() => {
    const data: Record<string, { name: string; Income: number; Expense: number }> = {};
    
    cashFlow.forEach(cf => {
      const date = new Date(cf.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const name = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      
      if (!data[key]) data[key] = { name, Income: 0, Expense: 0 };
      if (cf.type === 'Income') data[key].Income += cf.amount;
      else data[key].Expense += cf.amount;
    });

    return Object.values(data).sort((a, b) => {
       // Simple sort logic or rely on input order if sorted
       return 0; 
    }).slice(-6); // Last 6 months
  }, [cashFlow]);

  // Filtered Data
  const filteredCashFlow = cashFlow.filter(cf => {
    const matchSearch = cf.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        cf.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'All' || cf.type === filterType;
    return matchSearch && matchType;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const resetForm = () => {
    setDesc(''); setAmount(''); setType('Income'); setCategory('Iuran'); setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      description: desc,
      amount: parseInt(amount),
      type,
      category,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      if (editingId) {
        await updateTransactionInDb(editingId, data);
        toast.success('Transaksi berhasil diperbarui!');
      } else {
        await addTransactionToDb(data);
        toast.success('Transaksi berhasil dicatat!');
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan transaksi.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus transaksi ini?')) {
      try {
        await deleteTransactionFromDb(id);
        toast.success('Transaksi berhasil dihapus.');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus transaksi.');
      }
    }
  };

  const openEdit = (cf: CashFlow) => {
    setEditingId(cf.id); setDesc(cf.description); setAmount(cf.amount.toString()); setType(cf.type); setCategory(cf.category);
    setIsModalOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="w-full lg:w-auto">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Keuangan & Kas</h2>
          <p className="text-sm md:text-slate-500 font-medium mt-1">Kelola transparansi pemasukan dan pengeluaran RT 02.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-2 px-3 bg-white border border-slate-200 rounded-xl shadow-sm flex-1 sm:flex-none">
            <Calendar size={14} className="text-slate-400" />
            <select 
              className="bg-transparent py-2.5 text-[10px] font-black text-slate-600 uppercase tracking-widest outline-none cursor-pointer w-full" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)}
            >
              {generateMonthOptions(0, 12).map((m: string) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => generateCashFlowReportPDF(cashFlow, selectedMonth, pdfConfig)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-xs transition-all shadow-sm"
          >
            <Download size={16} /> <span className="hidden sm:inline">Laporan PDF</span><span className="sm:hidden">PDF</span>
          </button>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all">
            <Plus size={16} /> <span className="hidden sm:inline">Catat Transaksi</span><span className="sm:hidden">Catat</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-indigo-600 to-violet-700 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-lg shadow-indigo-600/20 flex items-center gap-3 sm:gap-5 group hover:scale-[1.02] transition-transform relative overflow-hidden sm:col-span-2 lg:col-span-1"
        >
          <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="p-2.5 sm:p-4 bg-white/20 text-white rounded-xl sm:rounded-2xl backdrop-blur-sm border border-white/20">
            <Wallet size={18} className="sm:w-6 sm:h-6" />
          </div>
          <div className="relative z-10 text-white">
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">Total Saldo</p>
            <h3 className="text-lg sm:text-3xl font-black">Rp {balance.toLocaleString()}</h3>
          </div>
        </motion.div>

        {[
          { label: 'Total Pemasukan', value: totalIncome, icon: ArrowUpRight, color: 'emerald' },
          { label: 'Total Pengeluaran', value: totalExpense, icon: ArrowDownRight, color: 'rose' }
        ].map((stat) => (
          <motion.div 
            key={stat.label}
            variants={itemVariants}
            className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-5 group hover:shadow-xl hover:shadow-slate-200/50 transition-all"
          >
            <div className={`p-2.5 sm:p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform`}>
              <stat.icon size={18} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-base sm:text-2xl font-black text-slate-900">Rp {stat.value.toLocaleString()}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <motion.div variants={itemVariants} className="bg-white p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2"><TrendingUp size={20} className="text-indigo-600"/> Analitik Arus Kas</h3>
          <div className="flex gap-3">
             <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Income</span>
             <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Expense</span>
          </div>
        </div>
        <div className="h-[250px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}} tickFormatter={(val) => `Rp${val/1000}k`} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
              />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Table Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Cari transaksi..." 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex-1 sm:flex-none">
               <Filter size={14} className="text-slate-400"/>
               <select className="bg-transparent border-none text-[10px] font-black text-slate-600 uppercase tracking-widest outline-none cursor-pointer w-full" value={filterType} onChange={(e:any) => setFilterType(e.target.value)}>
                 <option value="All">Semua Tipe</option>
                 <option value="Income">Pemasukan</option>
                 <option value="Expense">Pengeluaran</option>
               </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.15em] border-b border-slate-100">
                  <th className="px-6 sm:px-8 py-4 sm:py-5">Tanggal</th>
                  <th className="px-6 sm:px-8 py-4 sm:py-5">Keterangan</th>
                  <th className="px-6 sm:px-8 py-4 sm:py-5 hidden sm:table-cell">Kategori</th>
                  <th className="px-6 sm:px-8 py-4 sm:py-5 text-right">Nominal</th>
                  <th className="px-6 sm:px-8 py-4 sm:py-5 text-center">Tipe</th>
                  <th className="px-6 sm:px-8 py-4 sm:py-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCashFlow.map((cf) => (
                  <motion.tr 
                    key={cf.id} 
                    layout
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 sm:px-8 py-4 sm:py-5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-slate-100 text-slate-400 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                        </div>
                        <span className="font-bold text-slate-500 text-xs sm:text-sm whitespace-nowrap">
                          {new Date(cf.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 sm:px-8 py-4 sm:py-5">
                      <p className="font-black text-slate-800 text-sm sm:text-base line-clamp-1">{cf.description}</p>
                    </td>
                    <td className="px-6 sm:px-8 py-4 sm:py-5 hidden sm:table-cell">
                      <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">
                        {cf.category}
                      </span>
                    </td>
                    <td className={`px-6 sm:px-8 py-4 sm:py-5 text-right font-mono font-black text-sm sm:text-lg ${
                      cf.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {cf.type === 'Income' ? '+' : '-'} Rp {cf.amount.toLocaleString()}
                    </td>
                    <td className="px-6 sm:px-8 py-4 sm:py-5 text-center">
                      {cf.type === 'Income' ? (
                        <div className="flex items-center justify-center gap-1 text-emerald-600 bg-emerald-50 px-2 sm:px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 w-fit mx-auto">
                          <TrendingUp size={12} /> <span className="hidden sm:inline">Pemasukan</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-rose-600 bg-rose-50 px-2 sm:px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100 w-fit mx-auto">
                          <TrendingDown size={12} /> <span className="hidden sm:inline">Pengeluaran</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 sm:px-8 py-4 sm:py-5 text-center">
                       <div className="flex justify-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(cf)} className="text-slate-400 hover:text-indigo-600 font-bold text-[10px] sm:text-xs">Edit</button>
                          <button onClick={() => handleDelete(cf.id)} className="text-slate-400 hover:text-rose-600 font-bold text-[10px] sm:text-xs">Hapus</button>
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCashFlow.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                <DollarSign size={40} />
              </div>
              <p className="text-slate-400 font-bold">Data transaksi tidak ditemukan.</p>
            </div>
          )}
        </div>
      </motion.div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Transaksi" : "Catat Transaksi Baru"}>
         <form onSubmit={handleSave} className="space-y-4">
            <div>
               <label className="block text-xs font-bold mb-1.5 text-slate-700">Keterangan</label>
               <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={desc} onChange={e => setDesc(e.target.value)} required placeholder="Contoh: Iuran Sampah..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700">Nominal (Rp)</label>
                  <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={amount} onChange={e => setAmount(e.target.value)} required />
               </div>
               <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700">Tipe</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={type} onChange={e => setType(e.target.value as any)}>
                     <option value="Income">Pemasukan</option>
                     <option value="Expense">Pengeluaran</option>
                  </select>
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold mb-1.5 text-slate-700">Kategori</label>
               <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={category} onChange={e => setCategory(e.target.value)} list="cat-suggestions" />
               <datalist id="cat-suggestions">
                  <option value="Iuran Warga"/>
                  <option value="Sumbangan"/>
                  <option value="Pembangunan"/>
                  <option value="Operasional"/>
                  <option value="Sosial"/>
               </datalist>
            </div>
            <Button type="submit" className="w-full py-3 mt-2">{editingId ? 'Simpan Perubahan' : 'Simpan Transaksi'}</Button>
         </form>
      </Modal>
    </motion.div>
  );
};
