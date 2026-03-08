import React, { useState } from 'react';
import { DollarSign, Plus, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Filter, Search, Download, PieChart, Wallet } from 'lucide-react';
import { CashFlow } from '../../types';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { addTransactionToDb, updateTransactionInDb, deleteTransactionFromDb } from '../../services/databaseService';

interface FinanceManagerProps {
  cashFlow: CashFlow[];
}

export const FinanceManager: React.FC<FinanceManagerProps> = ({ cashFlow }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
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

    if (editingId) await updateTransactionInDb(editingId, data);
    else await addTransactionToDb(data);
    
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus transaksi ini?')) await deleteTransactionFromDb(id);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Keuangan & Kas</h2>
          <p className="text-slate-500 font-medium mt-1">Kelola transparansi pemasukan dan pengeluaran RT 002.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 font-bold text-sm transition-all shadow-sm">
            <Download size={18} /> Laporan
          </button>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all">
            <Plus size={18} /> Catat Transaksi
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[2rem] shadow-lg shadow-indigo-600/20 flex items-center gap-5 group hover:scale-[1.02] transition-transform relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="p-4 bg-white/20 text-white rounded-2xl backdrop-blur-sm border border-white/20">
            <Wallet size={24} />
          </div>
          <div className="relative z-10 text-white">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Saldo</p>
            <h3 className="text-3xl font-black">Rp {balance.toLocaleString()}</h3>
          </div>
        </motion.div>

        {[
          { label: 'Total Pemasukan', value: totalIncome, icon: ArrowUpRight, color: 'emerald' },
          { label: 'Total Pengeluaran', value: totalExpense, icon: ArrowDownRight, color: 'rose' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-xl hover:shadow-slate-200/50 transition-all"
          >
            <div className={`p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900">Rp {stat.value.toLocaleString()}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><TrendingUp size={20} className="text-indigo-600"/> Analitik Arus Kas</h3>
          <div className="flex gap-2">
             <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Income</span>
             <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Expense</span>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600, fill: '#94a3b8'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600, fill: '#94a3b8'}} tickFormatter={(val) => `Rp${val/1000}k`} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
              />
              <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={30} />
              <Bar dataKey="Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Table Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari transaksi..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
               <Filter size={14} className="text-slate-400"/>
               <select className="bg-transparent border-none text-xs font-black text-slate-600 uppercase tracking-widest outline-none cursor-pointer" value={filterType} onChange={(e:any) => setFilterType(e.target.value)}>
                 <option value="All">Semua Tipe</option>
                 <option value="Income">Pemasukan</option>
                 <option value="Expense">Pengeluaran</option>
               </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.15em] border-b border-slate-100">
                  <th className="px-8 py-5">Tanggal</th>
                  <th className="px-8 py-5">Keterangan</th>
                  <th className="px-8 py-5">Kategori</th>
                  <th className="px-8 py-5 text-right">Nominal</th>
                  <th className="px-8 py-5 text-center">Tipe</th>
                  <th className="px-8 py-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCashFlow.map((cf) => (
                  <motion.tr 
                    key={cf.id} 
                    layout
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 text-slate-400 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <Calendar size={14} />
                        </div>
                        <span className="font-bold text-slate-500">
                          {new Date(cf.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-black text-slate-800 text-base">{cf.description}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">
                        {cf.category}
                      </span>
                    </td>
                    <td className={`px-8 py-5 text-right font-mono font-black text-lg ${
                      cf.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {cf.type === 'Income' ? '+' : '-'} Rp {cf.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-center">
                      {cf.type === 'Income' ? (
                        <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 w-fit mx-auto">
                          <TrendingUp size={14} /> Pemasukan
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 text-rose-600 bg-rose-50 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100 w-fit mx-auto">
                          <TrendingDown size={14} /> Pengeluaran
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-center">
                       <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(cf)} className="text-slate-400 hover:text-indigo-600 font-bold text-xs">Edit</button>
                          <button onClick={() => handleDelete(cf.id)} className="text-slate-400 hover:text-rose-600 font-bold text-xs">Hapus</button>
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
