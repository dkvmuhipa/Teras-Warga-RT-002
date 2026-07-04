import React, { useState, useRef, useEffect } from 'react';
import { DollarSign, Box, Plus, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Filter, Search, Download, PieChart, Wallet, User, CreditCard, Upload, X, Eye, FileText, CheckCircle2, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { WasteBankManager } from './WasteBankManager';
import { ResidentIuranManager } from './resident/ResidentIuranManager';
import { PaymentModal, EditPaymentModal } from './resident/ResidentModals';
import { House, CashFlow, PaymentStatus } from '../../types';
import { getIndonesianMonthYear, generateMonthOptions } from '../../src/utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  addTransactionToDb, updateTransactionInDb, deleteTransactionFromDb, logAction, 
  handleFirestoreError, OperationType, uploadImageToStorage,
  deleteIuranPaymentFromDb, updateIuranPaymentInDb, addIuranPaymentToDb
} from '../../services/databaseService';
import { toast } from 'sonner';
import { generateCashFlowReportPDF, generateIuranReceiptPDF } from '../../services/pdfService';
import { generateCashFlowExcel } from '../../services/excelService';
import { useConfirm } from '../../context/ConfirmContext';
import { useFinancial } from '../../context/FinancialContext';

interface FinanceManagerProps {
  cashFlow: CashFlow[];
  pdfConfig: any;
  houses: House[];
  iuranPayments: any[];
  initialSubTab?: 'cashflow' | 'wastebank' | 'iuran';
}

export const FinanceManager: React.FC<FinanceManagerProps> = ({ 
  cashFlow, pdfConfig, houses, iuranPayments, initialSubTab = 'cashflow'
}) => {
  const confirm = useConfirm();
  const { getArrearsForHouse } = useFinancial();
  const [activeSubTab, setActiveSubTab] = useState<'cashflow' | 'wastebank' | 'iuran'>(initialSubTab);
  
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [selectedMonth, setSelectedMonth] = useState(getIndonesianMonthYear(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Income');
  const [category, setCategory] = useState('Iuran');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerReceiver, setPayerReceiver] = useState('');
  const [method, setMethod] = useState<'Tunai' | 'Transfer' | 'Lainnya'>('Tunai');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  // States for ResidentIuranManager integration
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [payType, setPayType] = useState<'Air' | 'Sampah' | 'Both'>('Air');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [payerName, setPayerName] = useState('');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedHouseForPay, setSelectedHouseForPay] = useState<House | null>(null);
  const [targetMonths, setTargetMonths] = useState<string[]>([]);

  // States for Financial Context values if needed
  const [payMonth, setPayMonth] = useState(getIndonesianMonthYear(new Date()));

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
    setDesc(''); 
    setAmount(''); 
    setType('Income'); 
    setCategory('Iuran'); 
    setDate(new Date().toISOString().split('T')[0]);
    setPayerReceiver('');
    setMethod('Tunai');
    setReferenceNumber('');
    setEvidenceUrl('');
    setEditingId(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImageToStorage(file, `finance/evidence_${Date.now()}`);
      setEvidenceUrl(url);
      toast.success('Bukti transaksi berhasil diunggah');
    } catch (error) {
      toast.error('Gagal mengunggah bukti transaksi');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Omit<CashFlow, 'id'> = {
      description: desc,
      amount: parseInt(amount),
      type,
      category,
      date,
      payerReceiver,
      method,
      referenceNumber,
      evidenceUrl
    };

    try {
      if (editingId) {
        await updateTransactionInDb(editingId, data);
        await logAction('Update Transaksi', `Update transaksi ${type}: ${desc} sejumlah Rp ${amount}`);
        toast.success('Transaksi berhasil diperbarui!');
      } else {
        await addTransactionToDb(data);
        await logAction('Tambah Transaksi', `Tambah transaksi ${type}: ${desc} sejumlah Rp ${amount}`);
        toast.success('Transaksi berhasil dicatat!');
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, "cashFlow");
      toast.error('Gagal menyimpan transaksi.');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Transaksi',
      message: 'Apakah Anda yakin ingin menghapus data transaksi ini? Catatan keuangan akan memperbarui saldo secara otomatis.',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteTransactionFromDb(id);
        await logAction('Hapus Transaksi', `Hapus transaksi ID: ${id}`);
        toast.success('Transaksi berhasil dihapus.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `cashFlow/${id}`);
        toast.error('Gagal menghapus transaksi.');
      }
    }
  };

  const openEdit = (cf: CashFlow) => {
    setEditingId(cf.id); 
    setDesc(cf.description); 
    setAmount(cf.amount.toString()); 
    setType(cf.type); 
    setCategory(cf.category);
    setDate(cf.date || new Date().toISOString().split('T')[0]);
    setPayerReceiver(cf.payerReceiver || '');
    setMethod(cf.method || 'Tunai');
    setReferenceNumber(cf.referenceNumber || '');
    setEvidenceUrl(cf.evidenceUrl || '');
    setIsModalOpen(true);
  };

  const handleOpenPayModal = (house: House) => {
    setSelectedHouseForPay(house);
    setPayerName(house.headOfFamily || '');
    
    // Pre-select arrears if any, otherwise select current month
    const arrears = getArrearsForHouse(house);
    if (arrears.length > 0) {
      setTargetMonths([arrears[0]]);
    } else {
      setTargetMonths([getIndonesianMonthYear(new Date())]);
    }
    
    setPayAmount('');
    setPayNotes('');
    setPayDate(new Date().toISOString().split('T')[0]);
    setIsPayModalOpen(true);
    toast.info(`Membuka pembayaran untuk Blok ${house.block}-${house.number}`);
  };

  const handleSaveIuranPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouseForPay || targetMonths.length === 0) return;

    const isConfirmed = await confirm({
      title: 'Konfirmasi Pembayaran',
      message: `Simpan pembayaran iuran untuk ${selectedHouseForPay.block}-${selectedHouseForPay.number} senilai total Rp ${parseInt(payAmount).toLocaleString()}?`,
      confirmLabel: 'Simpan',
      cancelLabel: 'Batal'
    });

    if (!isConfirmed) return;

    try {
      const amountPerMonth = parseInt(payAmount) / targetMonths.length;
      
      for (const month of targetMonths) {
        const paymentData = {
          houseId: selectedHouseForPay.id,
          block: selectedHouseForPay.block,
          number: selectedHouseForPay.number,
          headOfFamily: selectedHouseForPay.headOfFamily,
          month,
          amount: amountPerMonth,
          date: payDate,
          type: payType,
          notes: payNotes,
          payerName: payerName || selectedHouseForPay.headOfFamily,
          recordedBy: 'Admin (System)',
          createdAt: new Date().toISOString()
        };

        await addIuranPaymentToDb(paymentData);
      }

      await logAction('Bayar Iuran', `Pembayaran iuran ${payType} untuk ${selectedHouseForPay.block}-${selectedHouseForPay.number} senilai total Rp ${payAmount} (${targetMonths.length} bulan)`);
      toast.success('Pembayaran berhasil dicatat!');
      setIsPayModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mencatat pembayaran');
    }
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
      {/* Sub-tabs Selection */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar shadow-inner border border-slate-200/50">
        {[
          { id: 'cashflow', icon: DollarSign, label: 'Kas Utama' },
          { id: 'wastebank', icon: Box, label: 'Bank Sampah' },
          { id: 'iuran', icon: CreditCard, label: 'Iuran Warga' },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)} 
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl transition-all whitespace-nowrap active:scale-95 ${
              activeSubTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60 font-black' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 font-bold'
            }`}
          >
            <tab.icon size={16} className={activeSubTab === tab.id ? 'text-indigo-600' : 'text-slate-400'} />
            <span className="text-[10px] uppercase tracking-[0.1em]">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeSubTab === 'cashflow' ? (
        <>
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
              {generateMonthOptions(0, 60).map((m: string) => (
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
          <button 
            onClick={() => generateCashFlowExcel(cashFlow, selectedMonth)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-xs transition-all shadow-sm"
          >
            <Download size={16} /> <span className="hidden sm:inline">Laporan Excel</span><span className="sm:hidden">Excel</span>
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
            <table className="w-full text-sm text-left min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.15em] border-b border-slate-100">
                  <th className="px-6 sm:px-8 py-4 sm:py-5">Tanggal</th>
                  <th className="px-6 sm:px-8 py-4 sm:py-5">Keterangan & Pihak</th>
                  <th className="px-6 sm:px-8 py-4 sm:py-5 hidden sm:table-cell">Kategori & Metode</th>
                  <th className="px-6 sm:px-8 py-4 sm:py-5 text-right">Nominal</th>
                  <th className="px-6 sm:px-8 py-4 sm:py-5 text-center">Bukti</th>
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
                          {new Date(cf.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 sm:px-8 py-4 sm:py-5">
                      <div>
                        <p className="font-black text-slate-800 text-sm sm:text-base line-clamp-1">{cf.description}</p>
                        {cf.payerReceiver && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-400">
                            <User size={10} /> {cf.payerReceiver}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 sm:px-8 py-4 sm:py-5 hidden sm:table-cell">
                      <div className="space-y-1.5">
                        <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 block w-fit">
                          {cf.category}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <CreditCard size={10} /> {cf.method || 'Tunai'}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 sm:px-8 py-4 sm:py-5 text-right font-mono font-black text-sm sm:text-lg ${
                      cf.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      <div className="flex flex-col items-end">
                        <span>{cf.type === 'Income' ? '+' : '-'} Rp {cf.amount.toLocaleString()}</span>
                        <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest mt-1 ${
                          cf.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {cf.type === 'Income' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {cf.type === 'Income' ? 'Pemasukan' : 'Pengeluaran'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 sm:px-8 py-4 sm:py-5 text-center">
                      {cf.evidenceUrl ? (
                        <button 
                          onClick={() => setSelectedEvidence(cf.evidenceUrl!)}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors mx-auto flex items-center justify-center"
                        >
                          <Eye size={16} />
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 italic">No Evidence</span>
                      )}
                    </td>
                    <td className="px-6 sm:px-8 py-4 sm:py-5 text-center">
                       <div className="flex justify-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(cf)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                            <Plus size={14} className="rotate-45" />
                          </button>
                          <button onClick={() => handleDelete(cf.id)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                            <Trash2 size={14} />
                          </button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Transaksi" : "Catat Transaksi Baru"} maxWidth="max-w-3xl">
         <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400">Keterangan Transaksi</label>
                   <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Contoh: Pembelian Lampu Jalan..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400">Nominal (Rp)</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400">Tipe</label>
                      <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={type} onChange={e => setType(e.target.value as any)}>
                         <option value="Income">Pemasukan (+)</option>
                         <option value="Expense">Pengeluaran (-)</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400">Tanggal</label>
                    <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400">Metode</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={method} onChange={e => setMethod(e.target.value as any)}>
                      <option value="Tunai">Tunai</option>
                      <option value="Transfer">Transfer</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400">Pihak (Penerima/Penyetor)</label>
                   <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={payerReceiver} onChange={e => setPayerReceiver(e.target.value)} placeholder="Nama warga / Toko..." />
                   </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400">Kategori</label>
                   <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={category} onChange={e => setCategory(e.target.value)} list="cat-suggestions" placeholder="Pilih atau ketik..." />
                   <datalist id="cat-suggestions">
                      <option value="Iuran Warga"/>
                      <option value="Sumbangan"/>
                      <option value="Pembangunan"/>
                      <option value="Operasional"/>
                      <option value="Sosial"/>
                      <option value="Listrik & Air"/>
                      <option value="Keamanan"/>
                      <option value="Kebersihan"/>
                   </datalist>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400">Bukti Transaksi (Foto/Nota)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      evidenceUrl ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    {isUploading ? (
                      <RefreshCw className="animate-spin text-indigo-600" size={24} />
                    ) : evidenceUrl ? (
                      <>
                        <CheckCircle2 className="text-emerald-600" size={24} />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Bukti Terunggah</span>
                      </>
                    ) : (
                      <>
                        <Upload className="text-slate-400" size={24} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Klik untuk Unggah</span>
                      </>
                    )}
                  </div>
                  {evidenceUrl && (
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setEvidenceUrl(''); }}
                      className="mt-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                    >
                      Hapus Bukti
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 py-4 rounded-2xl" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" className="flex-[2] py-4 rounded-2xl shadow-lg shadow-indigo-200" disabled={isUploading}>
                {editingId ? 'Simpan Perubahan' : 'Catat Transaksi'}
              </Button>
            </div>
         </form>
      </Modal>

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        payHouse={selectedHouseForPay}
        payType={payType}
        setPayType={setPayType}
        payAmount={payAmount}
        setPayAmount={setPayAmount}
        payDate={payDate}
        setPayDate={setPayDate}
        targetMonths={targetMonths}
        setTargetMonths={setTargetMonths}
        payNotes={payNotes}
        setPayNotes={setPayNotes}
        payerName={payerName}
        setPayerName={setPayerName}
        handleSavePayment={handleSaveIuranPayment}
        getIndonesianMonthYear={getIndonesianMonthYear}
      />

      {/* Edit Payment Modal */}
      <Modal isOpen={isEditPaymentModalOpen} onClose={() => setIsEditPaymentModalOpen(false)} title="Edit Catatan Iuran" maxWidth="max-w-md">
        {editingPayment && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const updatedData = {
                type: payType,
                amount: parseInt(payAmount),
                date: payDate,
                notes: payNotes,
                payerName: payerName
              };
              await updateIuranPaymentInDb(editingPayment.id, updatedData);
              toast.success('Berhasil diperbarui');
              setIsEditPaymentModalOpen(false);
            } catch (error) {
              toast.error('Gagal memperbarui');
            }
          }} className="space-y-6">
            <div className="p-4 bg-slate-100 rounded-2xl">
               <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Detail Transaksi</p>
               <p className="font-bold text-slate-800">{editingPayment.headOfFamily} (Blok {editingPayment.block}-{editingPayment.number})</p>
               <p className="text-[10px] font-black text-indigo-600 mt-1 uppercase tracking-widest">{editingPayment.month}</p>
            </div>
            
            <div className="space-y-4">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Jenis</label>
                  <select value={payType} onChange={(e: any) => setPayType(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold">
                    <option value="Both">Air & Sampah</option>
                    <option value="Air">Hanya Air</option>
                    <option value="Sampah">Hanya Sampah</option>
                  </select>
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nominal</label>
                  <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-bold" />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nama Pembayar</label>
                  <input value={payerName} onChange={e => setPayerName(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-bold" />
               </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 py-4 rounded-2xl" onClick={() => setIsEditPaymentModalOpen(false)}>Batal</Button>
              <Button type="submit" className="flex-[2] py-4 rounded-2xl shadow-lg shadow-indigo-600/20 bg-indigo-600 text-white">Simpan</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Evidence Preview Modal */}
      <Modal isOpen={!!selectedEvidence} onClose={() => setSelectedEvidence(null)} title="Bukti Transaksi">
        <div className="p-2">
          <img src={selectedEvidence!} alt="Bukti Transaksi" className="w-full rounded-2xl shadow-lg" referrerPolicy="no-referrer" />
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setSelectedEvidence(null)}>Tutup</Button>
          </div>
        </div>
      </Modal>
      </>
      ) : activeSubTab === 'wastebank' ? (
        <WasteBankManager houses={houses} />
      ) : (
        <ResidentIuranManager 
          houses={houses}
          searchTerm={searchTerm}
          generateIuranReceiptPDF={generateIuranReceiptPDF}
          pdfConfig={pdfConfig}
          deleteIuranPaymentFromDb={deleteIuranPaymentFromDb}
          setEditingPayment={setEditingPayment}
          setPayType={setPayType}
          setPayAmount={setPayAmount}
          setPayDate={setPayDate}
          setPayNotes={setPayNotes}
          setPayerName={setPayerName}
          setIsEditPaymentModalOpen={setIsEditPaymentModalOpen}
          openPayModal={handleOpenPayModal}
          onSendWhatsApp={(house, msg) => {
            const phone = house.phone || '';
            if (phone) {
              const cleanedPhone = phone.replace(/\D/g, '').replace(/^0/, '62');
              window.open(`https://wa.me/${cleanedPhone}?text=${encodeURIComponent(msg || '')}`, '_blank');
            } else {
              toast.error('Nomor WhatsApp tidak tersedia');
            }
          }}
        />
      )}
    </motion.div>
  );
};
