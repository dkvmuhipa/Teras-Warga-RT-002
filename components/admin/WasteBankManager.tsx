import React, { useState, useEffect } from 'react';
import { Trash2, Plus, CheckCircle, Search, Filter, History, DollarSign, Package, User, Home, Calendar, Clock, AlertTriangle, Shield } from 'lucide-react';
import { WasteDeposit, WastePrice, House } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { 
  subscribeToWasteDeposits, 
  addWasteDepositToDb, 
  updateWasteDepositStatus, 
  deleteWasteDepositFromDb,
  subscribeToWastePrices,
  updateWastePriceInDb
} from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';

interface WasteBankManagerProps {
  houses: House[];
}

export const WasteBankManager: React.FC<WasteBankManagerProps> = ({ houses }) => {
  const [deposits, setDeposits] = useState<WasteDeposit[]>([]);
  const [prices, setPrices] = useState<WastePrice[]>([]);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Confirmed'>('All');
  const [pinInput, setPinInput] = useState('');
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Form State
  const [form, setForm] = useState({
    houseId: '',
    residentName: '',
    type: 'Plastik' as WasteDeposit['type'],
    weight: 0,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const unsubDeposits = subscribeToWasteDeposits(setDeposits);
    const unsubPrices = subscribeToWastePrices(setPrices);
    return () => {
      unsubDeposits();
      unsubPrices();
    };
  }, []);

  const handleHouseChange = (houseId: string) => {
    const house = houses.find(h => h.id === houseId);
    setForm({
      ...form,
      houseId,
      residentName: house ? house.headOfFamily : ''
    });
    setIsPinVerified(false);
    setPinInput('');
  };

  const verifyPin = () => {
    const house = houses.find(h => h.id === form.houseId);
    if (house && house.accessCode === pinInput) {
      setIsPinVerified(true);
      setPinError(false);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleSaveDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPinVerified) {
      alert('Silakan verifikasi PIN rumah terlebih dahulu.');
      return;
    }
    try {
      const priceObj = prices.find(p => p.type === form.type);
      const pricePerUnit = priceObj ? priceObj.pricePerUnit : 0;
      const totalValue = form.weight * pricePerUnit;

      const depositData = {
        ...form,
        pricePerUnit,
        totalValue,
        status: 'Pending'
      };

      await addWasteDepositToDb(depositData);
      setIsDepositModalOpen(false);
      setIsPinVerified(false);
      setPinInput('');
      setForm({
        houseId: '',
        residentName: '',
        type: 'Plastik',
        weight: 0,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan setoran.');
    }
  };

  const handleConfirmDeposit = async (deposit: WasteDeposit) => {
    if (window.confirm(`Konfirmasi setoran ini? Saldo sebesar Rp ${deposit.totalValue.toLocaleString()} akan ditambahkan ke tabungan warga.`)) {
      try {
        await updateWasteDepositStatus(deposit.id, 'Confirmed', deposit.totalValue, deposit.houseId);
      } catch (error) {
        console.error(error);
        alert('Gagal mengonfirmasi setoran.');
      }
    }
  };

  const handleDeleteDeposit = async (id: string) => {
    if (window.confirm('Hapus data setoran ini?')) {
      await deleteWasteDepositFromDb(id);
    }
  };

  const handleUpdatePrice = async (id: string, newPrice: number) => {
    try {
      await updateWastePriceInDb(id, newPrice);
    } catch (error) {
      console.error(error);
      alert('Gagal memperbarui harga.');
    }
  };

  const getHouseLabel = (id: string) => {
    const house = houses.find(h => h.id === id);
    return house ? `${house.block}-${house.number}` : id;
  };

  const filteredDeposits = deposits.filter(d => {
    const houseLabel = getHouseLabel(d.houseId);
    const matchesSearch = d.residentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         houseLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalConfirmedValue = deposits
    .filter(d => d.status === 'Confirmed')
    .reduce((acc, curr) => acc + curr.totalValue, 0);

  const pendingCount = deposits.filter(d => d.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="w-full lg:w-auto">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Bank Sampah Digital</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Kelola tabungan sampah warga dan konversi menjadi saldo ekonomi.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <Button onClick={() => setIsPriceModalOpen(true)} variant="outline" className="flex-1 sm:flex-none border-slate-200 text-xs py-2">
            <DollarSign size={16} className="mr-1.5" /> <span className="hidden sm:inline">Atur Harga</span><span className="sm:hidden">Harga</span>
          </Button>
          <Button onClick={() => setIsDepositModalOpen(true)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 text-xs py-2">
            <Plus size={16} className="mr-1.5" /> <span className="hidden sm:inline">Input Setoran</span><span className="sm:hidden">Setor</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="p-5 md:p-6 bg-emerald-50 border-emerald-100 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl md:rounded-2xl text-emerald-600 shadow-sm">
              <Package size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Total Tabungan Terkonfirmasi</p>
              <p className="text-xl md:text-2xl font-black text-slate-800">Rp {totalConfirmedValue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 md:p-6 bg-amber-50 border-amber-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl md:rounded-2xl text-amber-600 shadow-sm">
              <Clock size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Menunggu Konfirmasi</p>
              <p className="text-xl md:text-2xl font-black text-slate-800">{pendingCount} <span className="text-xs font-bold opacity-60">Transaksi</span></p>
            </div>
          </div>
        </Card>
        <Card className="p-5 md:p-6 bg-indigo-50 border-indigo-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl md:rounded-2xl text-indigo-600 shadow-sm">
              <History size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">Total Transaksi</p>
              <p className="text-xl md:text-2xl font-black text-slate-800">{deposits.length} <span className="text-xs font-bold opacity-60">Data</span></p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama warga atau blok..." 
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white p-1 border border-slate-200 rounded-xl shadow-sm overflow-x-auto no-scrollbar">
          {(['All', 'Pending', 'Confirmed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterStatus === status 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status === 'All' ? 'Semua' : status === 'Pending' ? 'Menunggu' : 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] md:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Warga</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis & Berat</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nilai Ekonomi</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDeposits.map((deposit) => (
                <tr key={deposit.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black shadow-sm text-sm">
                        {deposit.residentName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-none mb-1">{deposit.residentName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Blok {getHouseLabel(deposit.houseId)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest">
                        {deposit.type}
                      </span>
                    </div>
                    <p className="text-sm font-black text-slate-700">{deposit.weight} kg</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-emerald-600">Rp {deposit.totalValue.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400">@ Rp {deposit.pricePerUnit.toLocaleString()}/kg</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      deposit.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {deposit.status === 'Confirmed' ? 'Selesai' : 'Menunggu'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {deposit.status === 'Pending' && (
                        <button 
                          onClick={() => handleConfirmDeposit(deposit)}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Konfirmasi & Tambah Saldo"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteDeposit(deposit.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title="Hapus Data"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDeposits.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                      <Package size={32} />
                    </div>
                    <p className="text-slate-400 font-bold">Tidak ada data setoran ditemukan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Input Deposit Modal */}
      <Modal isOpen={isDepositModalOpen} onClose={() => {
        setIsDepositModalOpen(false);
        setIsPinVerified(false);
        setPinInput('');
      }} title="Input Setoran Sampah">
        <form onSubmit={handleSaveDeposit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Pilih Rumah / Warga</label>
            <select 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
              value={form.houseId}
              onChange={e => handleHouseChange(e.target.value)}
            >
              <option value="">Pilih Rumah...</option>
              {[...houses]
                .filter(h => h.status === 'Occupied')
                .sort((a, b) => {
                  // Urut dari C5: Blok C, D, E... lalu A, B
                  const getBlockPriority = (block: string) => {
                    const b = block.toUpperCase();
                    if (b >= 'C') return 0;
                    return 1;
                  };
                  const pA = getBlockPriority(a.block);
                  const pB = getBlockPriority(b.block);
                  if (pA !== pB) return pA - pB;
                  if (a.block !== b.block) return a.block.localeCompare(b.block);
                  return parseInt(a.number) - parseInt(b.number);
                })
                .map(h => (
                  <option key={h.id} value={h.id}>{h.block}-{h.number} - {h.headOfFamily}</option>
                ))}
            </select>
          </div>

          {form.houseId && (
            <div className={`p-4 rounded-2xl border transition-all ${isPinVerified ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className={isPinVerified ? 'text-emerald-600' : 'text-slate-400'} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Verifikasi PIN Rumah</span>
                </div>
                {isPinVerified && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                    <CheckCircle size={12} /> Terverifikasi
                  </span>
                )}
              </div>
              
              {!isPinVerified ? (
                <div className="flex gap-2">
                  <input 
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="Masukkan PIN"
                    className={`flex-1 px-4 py-2 bg-white border ${pinError ? 'border-rose-500' : 'border-slate-200'} rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20`}
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    onClick={verifyPin}
                    className="bg-slate-800 hover:bg-slate-900 text-[10px] px-4"
                  >
                    Cek PIN
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-emerald-700 font-medium">PIN sesuai. Anda dapat melanjutkan pengisian data setoran.</p>
              )}
              {pinError && <p className="text-[9px] font-bold text-rose-500 mt-1.5 uppercase tracking-wider">PIN salah, silakan coba lagi</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Jenis Sampah</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value as WasteDeposit['type']})}
              >
                <option value="Plastik">Plastik</option>
                <option value="Kertas">Kertas</option>
                <option value="Logam">Logam</option>
                <option value="Minyak Jelantah">Minyak Jelantah</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Berat / Volume</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                  value={form.weight}
                  onChange={e => setForm({...form, weight: parseFloat(e.target.value)})}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">kg/ltr</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Tanggal Setoran</label>
            <input 
              type="date" 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
            />
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-700">Estimasi Nilai Ekonomi:</span>
              <span className="text-lg font-black text-emerald-700">
                Rp {((form.weight || 0) * (prices.find(p => p.type === form.type)?.pricePerUnit || 0)).toLocaleString()}
              </span>
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={!isPinVerified}
            className={`w-full py-4 shadow-xl mt-4 ${isPinVerified ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            Simpan Setoran
          </Button>
        </form>
      </Modal>

      {/* Manage Prices Modal */}
      <Modal isOpen={isPriceModalOpen} onClose={() => setIsPriceModalOpen(false)} title="Atur Harga Sampah">
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 mb-4">
            <AlertTriangle className="text-amber-500" size={20} />
            <p className="text-[10px] font-bold text-amber-700 leading-tight">
              Harga ini akan digunakan sebagai dasar perhitungan nilai ekonomi setoran baru. Perubahan harga tidak mempengaruhi setoran yang sudah tersimpan.
            </p>
          </div>
          <div className="space-y-3">
            {prices.map((price) => (
              <div key={price.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-black text-slate-800 leading-none mb-1">{price.type}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Per {price.unit}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400">Rp</span>
                  <input 
                    type="number" 
                    className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                    value={price.pricePerUnit}
                    onChange={e => handleUpdatePrice(price.id, parseInt(e.target.value))}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={() => setIsPriceModalOpen(false)} className="w-full py-4 mt-4">Selesai</Button>
        </div>
      </Modal>
    </div>
  );
};
