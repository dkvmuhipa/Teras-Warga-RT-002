import React, { useState } from 'react';
import { FileText, AlertCircle, CheckCircle2, Plus, Trash2, Calendar, User, DollarSign, ArrowRight, Search, Filter, MoreVertical, Download, X, List, RefreshCw } from 'lucide-react';
import { Bill, House, BillItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { addBillToDb, updateBillInDb, deleteBillFromDb, generateMonthlyBills } from '../../services/databaseService';
import { toast } from 'sonner';

interface BillManagerProps {
  bills: Bill[];
  houses: House[];
}

export const BillManager: React.FC<BillManagerProps> = ({ bills, houses }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('All');
  
  // Form State
  const [selectedHouseId, setSelectedHouseId] = useState('');
  const [billMonth, setBillMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(20);
    return date.toISOString().slice(0, 10);
  });
  const [billItems, setBillItems] = useState<Omit<BillItem, 'id'>[]>([
    { name: 'Iuran Keamanan', amount: 25000, manager: 'Koord. Keamanan', status: 'Unpaid' },
    { name: 'Iuran Kebersihan', amount: 15000, manager: 'Petugas Kebersihan', status: 'Unpaid' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const isLate = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    return now > due && now.getDate() > 20;
  };

  const handleAddItem = () => {
    setBillItems([...billItems, { name: '', amount: 0, manager: '', status: 'Unpaid' }]);
  };

  const handleRemoveItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof Omit<BillItem, 'id'>, value: any) => {
    const newItems = [...billItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setBillItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouseId) return;

    const total = billItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const newBill: Omit<Bill, 'id'> = {
      houseId: selectedHouseId,
      month: billMonth,
      dueDate,
      total,
      items: billItems.map((item, idx) => ({ ...item, id: `item-${Date.now()}-${idx}` })) as BillItem[]
    };

    try {
      await addBillToDb(newBill);
      setIsModalOpen(false);
      toast.success("Tagihan berhasil dibuat");
      // Reset form
      setSelectedHouseId('');
      setBillItems([
        { name: 'Iuran Keamanan', amount: 25000, manager: 'Koord. Keamanan', status: 'Unpaid' },
        { name: 'Iuran Kebersihan', amount: 15000, manager: 'Petugas Kebersihan', status: 'Unpaid' }
      ]);
    } catch (error) {
      console.error("Error adding bill:", error);
      toast.error("Gagal menambahkan tagihan.");
    }
  };

  const handleGenerateMonthlyBills = async () => {
    if (!confirm("Generate tagihan otomatis untuk semua rumah yang terisi?")) return;
    
    setIsGenerating(true);
    const month = new Date().toISOString().slice(0, 7);
    const dueDate = new Date();
    dueDate.setDate(20);
    const dueDateStr = dueDate.toISOString().slice(0, 10);
    
    const defaultItems = [
      { name: 'Iuran Keamanan', amount: 25000, manager: 'Koord. Keamanan' },
      { name: 'Iuran Kebersihan', amount: 15000, manager: 'Petugas Kebersihan' }
    ];

    try {
      const success = await generateMonthlyBills(month, dueDateStr, defaultItems);
      if (success) {
        toast.success(`Berhasil generate tagihan untuk periode ${month}`);
      } else {
        toast.error("Gagal generate tagihan otomatis");
      }
    } catch (error) {
      console.error("Error generating bills:", error);
      toast.error("Terjadi kesalahan saat generate tagihan");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteBill = async (id: string) => {
    if (confirm("Hapus tagihan ini?")) {
      await deleteBillFromDb(id);
      toast.success("Tagihan dihapus");
    }
  };

  const toggleItemStatus = async (bill: Bill, itemId: string) => {
    const updatedItems = bill.items.map(item => 
      item.id === itemId ? { ...item, status: item.status === 'Paid' ? 'Unpaid' : 'Paid' as any } : item
    );
    await updateBillInDb(bill.id, { items: updatedItems });
  };

  const filteredBills = bills.filter(bill => {
    const house = houses.find(h => h.id === bill.houseId);
    const houseLabel = house ? `${house.block}/${house.number} ${house.headOfFamily}` : bill.houseId;
    const matchesSearch = houseLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMonth = filterMonth === 'All' || bill.month === filterMonth;
    return matchesSearch && matchesMonth;
  });

  const months = Array.from(new Set(bills.map(b => b.month))).sort().reverse();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="font-black text-3xl text-slate-900 tracking-tight">Manajemen Iuran Itemized</h2>
          <p className="text-slate-500 font-medium mt-1">Kelola tagihan warga secara transparan dan terperinci.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleGenerateMonthlyBills}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Calendar size={20} />}
            Generate Tagihan Bulanan
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Plus size={20} /> Buat Tagihan Baru
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><FileText size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</p>
            <h4 className="text-2xl font-black text-slate-900">{bills.length}</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terbayar Penuh</p>
            <h4 className="text-2xl font-black text-slate-900">
              {bills.filter(b => b.items.every(i => i.status === 'Paid')).length}
            </h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><AlertCircle size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Menunggak/Terlambat</p>
            <h4 className="text-2xl font-black text-slate-900">
              {bills.filter(b => b.items.some(i => i.status === 'Unpaid') && isLate(b.dueDate)).length}
            </h4>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan blok, nomor rumah, atau nama..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="px-4 py-3 rounded-2xl border border-slate-100 text-sm font-bold bg-slate-50 text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="All">Semua Bulan</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Bills List */}
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredBills.length > 0 ? (
            filteredBills.map((bill) => {
              const house = houses.find(h => h.id === bill.houseId);
              const late = isLate(bill.dueDate);
              const allPaid = bill.items.every(i => i.status === 'Paid');
              
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={bill.id} 
                  className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500"
                >
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-3xl ${allPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          <FileText size={28} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-xl text-slate-900">
                              Rumah {house ? `${house.block}/${house.number}` : bill.houseId}
                            </h4>
                            {late && !allPaid && <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full">Terlambat</span>}
                            {allPaid && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">Lunas</span>}
                          </div>
                          <p className="text-sm text-slate-500 font-bold mt-0.5">{house?.headOfFamily || 'Warga'} • Periode {bill.month}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batas Waktu</p>
                          <p className="text-sm font-bold text-slate-700">{new Date(bill.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteBill(bill.id)}
                          className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bill.items.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => toggleItemStatus(bill, item.id)}
                          className={`p-5 rounded-[2rem] border cursor-pointer transition-all duration-300 group/item ${
                            item.status === 'Paid' 
                              ? 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50' 
                              : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className={`font-black text-sm ${item.status === 'Paid' ? 'text-emerald-700' : 'text-slate-800'}`}>{item.name}</span>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Oleh: {item.manager}</p>
                            </div>
                            <div className={`p-2 rounded-xl transition-colors ${item.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-300 group-hover/item:text-indigo-500'}`}>
                              {item.status === 'Paid' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
                            </div>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-[10px] font-bold text-slate-400">Rp</span>
                            <span className={`text-lg font-black ${item.status === 'Paid' ? 'text-emerald-600' : 'text-slate-900'}`}>{item.amount.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</p>
                          <p className="text-2xl font-black text-slate-900">Rp {bill.total.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
                        <div className="hidden md:block">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Terakhir</p>
                          <p className={`text-sm font-bold ${allPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {allPaid ? 'Semua item lunas' : `${bill.items.filter(i => i.status === 'Unpaid').length} item belum dibayar`}
                          </p>
                        </div>
                      </div>
                      <button className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                        <Download size={16} /> Unduh Invoice
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div key="no-bills-found" className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-800">Tidak ada tagihan ditemukan</h3>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto">Coba ubah kata kunci pencarian atau filter bulan untuk melihat data lainnya.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Bill Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div key="bill-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Buat Tagihan Itemized</h3>
                  <p className="text-sm text-slate-500 font-medium">Input rincian iuran untuk warga tertentu.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white text-slate-400 hover:text-slate-600 rounded-2xl border border-slate-100 transition-all"><X size={24}/></button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Rumah</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={selectedHouseId}
                      onChange={(e) => setSelectedHouseId(e.target.value)}
                    >
                      <option value="">Pilih Warga...</option>
                      {houses.filter(h => h.status === 'Occupied').map(h => (
                        <option key={h.id} value={h.id}>{h.block}/{h.number} - {h.headOfFamily}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bulan Tagihan</label>
                    <input 
                      type="month" 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={billMonth}
                      onChange={(e) => setBillMonth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jatuh Tempo</label>
                    <input 
                      type="date" 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-black text-slate-800 flex items-center gap-2"><List size={18} className="text-indigo-500"/> Rincian Item Iuran</h4>
                    <button 
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Plus size={14}/> Tambah Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {billItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 items-end animate-slide-up">
                        <div className="md:col-span-4 space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Item</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: Iuran Sampah"
                            required
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah (Rp)</label>
                          <input 
                            type="number" 
                            placeholder="0"
                            required
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                            value={item.amount}
                            onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-4 space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pengelola</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: Bpk. RT"
                            required
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                            value={item.manager}
                            onChange={(e) => handleItemChange(idx, 'manager', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-1 flex justify-center pb-1">
                          <button 
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={billItems.length === 1}
                            className="p-2 text-slate-300 hover:text-rose-500 disabled:opacity-0 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Estimasi Total</p>
                    <p className="text-2xl font-black text-indigo-900">Rp {billItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Jumlah Item</p>
                    <p className="text-xl font-black text-indigo-900">{billItems.length} Item</p>
                  </div>
                </div>
              </form>

              <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 text-sm font-black text-slate-500 hover:text-slate-700 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSubmit}
                  className="px-10 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center gap-2"
                >
                  Simpan Tagihan <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
