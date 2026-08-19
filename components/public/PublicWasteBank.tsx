import React, { useState, useEffect } from 'react';
import { Package, History, DollarSign, TrendingUp, Info, ArrowRight, ArrowLeft, Wallet, Calendar, Clock, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { WasteDeposit, WasteBalance, WastePrice, House } from '../../types';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  subscribeToWasteDeposits, 
  subscribeToWastePrices,
  subscribeToWasteBalance,
  addWasteDepositToDb,
  handleFirestoreError,
  OperationType,
  validateResidentAccess
} from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface PublicWasteBankProps {
  houseId: string;
  houses: House[];
}

export const PublicWasteBank: React.FC<PublicWasteBankProps> = ({ houseId, houses }) => {
  const [deposits, setDeposits] = useState<WasteDeposit[]>([]);
  const [prices, setPrices] = useState<WastePrice[]>([]);
  const [balance, setBalance] = useState<WasteBalance | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'prices'>('overview');
  const [selectedHouseId, setSelectedHouseId] = useState(houseId);

  useEffect(() => {
    if (!selectedHouseId) return;
    const unsubDeposits = subscribeToWasteDeposits((all) => {
      setDeposits(all.filter(d => d.houseId === selectedHouseId));
    });
    const unsubPrices = subscribeToWastePrices(setPrices);
    const unsubBalance = subscribeToWasteBalance(selectedHouseId, setBalance);
    
    return () => {
      unsubDeposits();
      unsubPrices();
      unsubBalance();
    };
  }, [selectedHouseId]);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [tempHouseId, setTempHouseId] = useState('');
  const [pinError, setPinError] = useState(false);

  const [depositForm, setDepositForm] = useState({
    type: '',
    weight: 0
  });

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateResidentAccess(tempHouseId, pinInput);
    if (isValid) {
      handleSetHouse(tempHouseId);
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedPrice = prices.find(p => p.type === depositForm.type);
      if (!selectedPrice) return;

      await addWasteDepositToDb({
        houseId: selectedHouseId,
        type: depositForm.type,
        weight: depositForm.weight,
        pricePerUnit: selectedPrice.pricePerUnit,
        totalValue: depositForm.weight * selectedPrice.pricePerUnit,
        status: 'Pending',
        date: new Date().toISOString()
      });

      setIsDepositModalOpen(false);
      setDepositForm({ type: '', weight: 0 });
      toast.success('Setoran berhasil diajukan!', {
        description: 'Silakan serahkan sampah ke petugas untuk dikonfirmasi.'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "wasteDeposits");
      toast.error('Gagal mengajukan setoran.');
    }
  };

  const handleSetHouse = (id: string) => {
    setSelectedHouseId(id);
    localStorage.setItem('resident_house_id', id);
  };

  if (!selectedHouseId) {
    const sortedHouses = [...houses]
      .filter(h => h.status === 'Occupied')
      .sort((a, b) => {
        const getBlockPriority = (block: string) => {
          const b = block.toUpperCase();
          if (b >= 'C') return 0;
          return 1;
        };
        
        const pA = getBlockPriority(a.block);
        const pB = getBlockPriority(b.block);
        
        if (pA !== pB) return pA - pB;
        if (a.block !== b.block) return a.block.localeCompare(b.block, undefined, { numeric: true });
        return (a.number || '').localeCompare(b.number || '', undefined, { numeric: true });
      });

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 text-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-emerald-950/40 relative z-10 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
            <Package size={38} className="stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-mono font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            CYBER-ECO BANK SAMPAH RT 02
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight mb-2">Portal Tabungan Sampah</h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mb-8 leading-relaxed">
            Silakan pilih nomor rumah Anda untuk mengakses saldo, riwayat penimbangan, dan penukaran saldo sampah.
          </p>

          <div className="space-y-4">
            <select 
              className="w-full px-5 py-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs sm:text-sm font-mono font-black text-slate-200 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all shadow-inner"
              value={tempHouseId}
              onChange={(e) => {
                setTempHouseId(e.target.value);
                if (e.target.value) setIsPinModalOpen(true);
              }}
            >
              <option value="" className="bg-slate-900 text-slate-400">-- Pilih Nomor Rumah Warga --</option>
              {sortedHouses.map(h => (
                <option key={h.id} value={h.id} className="bg-slate-900 text-slate-200">
                  Blok {h.block}-{h.number} • {h.headOfFamily}
                </option>
              ))}
            </select>
            
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              🔒 Verifikasi aman & tersimpan otomatis di perangkat Anda
            </p>
          </div>

          {/* PIN Verification Modal */}
          <Modal isOpen={isPinModalOpen} onClose={() => {
            setIsPinModalOpen(false);
            setTempHouseId('');
            setPinInput('');
          }} title="Verifikasi PIN Akses">
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-100">Masukkan PIN Otorisasi</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Akses untuk rumah <span className="font-mono font-black text-emerald-400">Blok {houses.find(h => h.id === tempHouseId)?.block}-{houses.find(h => h.id === tempHouseId)?.number}</span>
                </p>
              </div>

              <div>
                <input 
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  className={`w-full px-6 py-4 bg-slate-950 border ${pinError ? 'border-rose-500 ring-4 ring-rose-500/20' : 'border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20'} rounded-2xl text-center text-2xl font-mono font-black tracking-[0.8em] text-emerald-400 outline-none transition-all`}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder="••••••"
                />
                {pinError && (
                  <p className="text-center text-rose-400 text-[10px] font-mono font-bold uppercase tracking-widest mt-2 animate-bounce">
                    ⚠️ PIN yang Anda masukkan tidak valid
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-wider shadow-lg shadow-emerald-950">
                Verifikasi & Buka Tabungan
              </Button>
            </form>
          </Modal>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const totalWeight = deposits
    .filter(d => d.status === 'Confirmed')
    .reduce((acc, curr) => acc + curr.weight, 0);

  const getHouseLabel = (id: string) => {
    const house = houses.find(h => h.id === id);
    return house ? `${house.block}-${house.number}` : id;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 mb-24 space-y-8">
      {/* Cyber Hero Banner Header */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] border border-slate-800 p-6 md:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[9px] font-mono font-black uppercase tracking-widest">
                PORTAL RESIDEN
              </span>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[9px] font-mono font-black uppercase tracking-widest">
                BLOK {getHouseLabel(selectedHouseId)}
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">Bank Sampah Digital RT 02</h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1 max-w-xl">
              Tukarkan sampah anorganik menjadi saldo bernilai ekonomi. Pantau tabungan, harga rincian, dan riwayat setoran real-time.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => {
                setSelectedHouseId('');
                localStorage.removeItem('resident_house_id');
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-950/80 hover:bg-slate-950 text-slate-300 hover:text-white border border-slate-800 rounded-2xl text-xs font-mono font-black uppercase tracking-wider transition-all"
            >
              <ArrowLeft size={14} /> Ganti Akses Rumah
            </button>
            <Button onClick={() => setIsDepositModalOpen(true)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/50 py-3.5 px-6 rounded-2xl font-black uppercase tracking-wider text-xs">
              <Package size={18} className="mr-2" /> Setorkan Sampah
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Tab Selector */}
      <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-3xl border border-slate-800 shadow-xl overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Ringkasan Tabungan', icon: Wallet },
          { id: 'history', label: 'Riwayat Setoran', icon: History },
          { id: 'prices', label: 'Katalog Harga Sampah', icon: DollarSign }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-mono font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary Balance Hero Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 border border-emerald-500/30 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
                
                <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl backdrop-blur-md">
                        <Wallet size={26} />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400 block">SALDO AKTIF SAAT INI</span>
                        <span className="text-xs text-slate-300 font-medium">Bisa dicarikan atau dibelanjakan</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-xl text-[9px] font-mono font-black uppercase tracking-widest">
                      TERVERIFIKASI
                    </span>
                  </div>

                  <div>
                    <h3 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-2">
                      Rp {(balance?.totalBalance || 0).toLocaleString()}
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      Pembaruan terakhir: {balance ? new Date(balance.lastUpdated).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] text-white shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL TERKUMPUL</p>
                    <p className="text-2xl font-black text-emerald-400">{totalWeight.toFixed(1)} kg</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-1">Sampah terkonfirmasi</p>
                  </div>
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                    <Package size={28} />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] text-white shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL AKTIVITAS</p>
                    <p className="text-2xl font-black text-indigo-400">{deposits.length} Transaksi</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-1">Sesi penyetoran</p>
                  </div>
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                    <TrendingUp size={28} />
                  </div>
                </div>
              </div>
            </div>

            {/* Benefit Instructions Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl">
              <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-4">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
                  <Info size={22} />
                </div>
                <div>
                  <h4 className="font-black text-slate-100 text-base sm:text-lg tracking-tight">Opsi Penukaran & Manfaat Saldo</h4>
                  <p className="text-xs text-slate-400 font-medium">Manfaatkan hasil tabungan sampah Anda untuk kebutuhan fasilitas warga</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { title: 'Pembayaran Iuran RT', desc: 'Potong tagihan iuran bulanan (Sampah & Kebersihan) secara otomatis dari saldo.', icon: DollarSign },
                  { title: 'Voucher Belanja UMKM', desc: 'Gunakan saldo untuk membeli sembako & produk UMKM di Pasar Warga RT 02.', icon: Package },
                  { title: 'Pencairan Tunai', desc: 'Tarik tunai saldo langsung melalui pengurus / Bendahara RT 02.', icon: Wallet }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-2 hover:border-emerald-500/40 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                        <item.icon size={18} />
                      </div>
                      <p className="text-xs font-mono font-black text-slate-200 uppercase">{item.title}</p>
                    </div>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div 
            key="history"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {deposits.length > 0 ? (
              deposits.map((deposit) => (
                <motion.div 
                  key={deposit.id} 
                  variants={itemVariants}
                  className="bg-slate-900 text-white p-5 sm:p-6 rounded-[2rem] border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl border ${
                      deposit.status === 'Confirmed' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                    }`}>
                      <Package size={26} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-slate-100 text-base">{deposit.type}</h4>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-mono font-black uppercase tracking-widest border ${
                          deposit.status === 'Confirmed' 
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}>
                          {deposit.status === 'Confirmed' ? '✓ TERKONFIRMASI' : '⏳ MENUNGGU DITIMBANG'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-emerald-400" />
                          {new Date(deposit.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <TrendingUp size={12} className="text-indigo-400" />
                          {deposit.weight} kg
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0 w-full sm:w-auto">
                    <p className="text-xl font-mono font-black text-emerald-400 mb-0.5">
                      + Rp {deposit.totalValue.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      @ Rp {deposit.pricePerUnit.toLocaleString()}/kg
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center bg-slate-900 rounded-[2.5rem] border border-slate-800 text-white">
                <div className="w-20 h-20 bg-slate-800/60 rounded-3xl flex items-center justify-center text-slate-500 mx-auto mb-4 border border-slate-700/50">
                  <History size={40} />
                </div>
                <h4 className="text-lg font-bold text-slate-200 mb-1">Belum Ada Riwayat Setoran</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Setorkan sampah anorganik Anda ke petugas Bank Sampah RT 02 untuk mulai mencatat riwayat.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'prices' && (
          <motion.div 
            key="prices"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {prices.map((price) => (
                <motion.div 
                  key={price.id} 
                  variants={itemVariants}
                  className="bg-slate-900 text-white p-6 rounded-[2rem] border border-slate-800 shadow-xl flex items-center justify-between hover:border-emerald-500/40 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl group-hover:scale-110 transition-transform">
                      <DollarSign size={22} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-100 text-base">{price.type}</h4>
                      <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">Satuan: {price.unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-mono font-black text-emerald-400">Rp {price.pricePerUnit.toLocaleString()}</p>
                    <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Per {price.unit}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-6 bg-slate-900 border border-amber-500/30 rounded-[2rem] flex items-start gap-4 text-white">
              <AlertCircle className="text-amber-400 mt-1 shrink-0" size={22} />
              <div>
                <h4 className="text-sm font-mono font-black text-amber-300 uppercase mb-1">Syarat & Ketentuan Penimbangan</h4>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Harga sampah disesuaikan dengan fluktuasi harga pasar pengepul resmi. Harap pilah sampah dalam kondisi relatif bersih dan tidak bercampur dengan sampah organik basah.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Ajukan Setoran Sampah */}
      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Setorkan Sampah Anorganik">
        <form onSubmit={handleDepositSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-2">Pilih Jenis Sampah</label>
            <select 
              required
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
              value={depositForm.type}
              onChange={e => setDepositForm({...depositForm, type: e.target.value})}
            >
              <option value="">-- Pilih Kategori --</option>
              {prices.map(p => (
                <option key={p.id} value={p.type}>{p.type} (Rp {p.pricePerUnit.toLocaleString()}/{p.unit})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-2">Estimasi Berat (kg)</label>
            <input 
              type="number" 
              step="0.1"
              required
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
              value={depositForm.weight || ''}
              onChange={e => setDepositForm({...depositForm, weight: parseFloat(e.target.value) || 0})}
              placeholder="0.0"
            />
          </div>

          <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest">Estimasi Nilai Hasil</span>
              <span className="text-lg font-mono font-black text-emerald-300">
                Rp {((prices.find(p => p.type === depositForm.type)?.pricePerUnit || 0) * depositForm.weight).toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic">* Nilai tepat akan diverifikasi ulang saat penimbangan fisik oleh petugas.</p>
          </div>

          <Button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-wider shadow-lg shadow-emerald-950 mt-2">
            Ajukan Setoran Sekarang
          </Button>
        </form>
      </Modal>
    </div>
  );
};
