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
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white border border-slate-200/80 rounded-[2.5rem] p-8 sm:p-10 shadow-xl shadow-slate-200/50 text-center"
        >
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-emerald-100">
            <Package size={32} />
          </div>

          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100/80 mb-3 inline-block">
            Bank Sampah RT 02
          </span>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Pilih Nomor Rumah</h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mb-8 leading-relaxed">
            Silakan pilih nomor rumah Anda untuk melihat saldo tabungan, riwayat setoran, dan katalog harga.
          </p>

          <div className="space-y-4">
            <select 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
              value={tempHouseId}
              onChange={(e) => {
                setTempHouseId(e.target.value);
                if (e.target.value) setIsPinModalOpen(true);
              }}
            >
              <option value="" className="text-slate-400">Pilih Nomor Rumah Warga...</option>
              {sortedHouses.map(h => (
                <option key={h.id} value={h.id}>
                  Blok {h.block}-{h.number} • {h.headOfFamily}
                </option>
              ))}
            </select>
            
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Akses akan otomatis tersimpan aman di browser Anda
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
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                  <Shield size={28} />
                </div>
                <h3 className="text-lg font-black text-slate-900">Masukkan PIN Rumah</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Otorisasi untuk <span className="font-black text-emerald-600">Blok {houses.find(h => h.id === tempHouseId)?.block}-{houses.find(h => h.id === tempHouseId)?.number}</span>
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
                  className={`w-full px-6 py-4 bg-slate-50 border ${pinError ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'} rounded-2xl text-center text-2xl font-black tracking-[0.8em] text-slate-800 outline-none transition-all`}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder="••••••"
                />
                {pinError && (
                  <p className="text-center text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-2">
                    PIN yang Anda masukkan tidak tepat
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-wider rounded-2xl shadow-lg shadow-emerald-600/20">
                Verifikasi & Lanjutkan
              </Button>
            </form>
          </Modal>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
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
    <div className="max-w-6xl mx-auto px-4 py-8 mb-24 space-y-8">
      {/* Header Banner - Clean Minimalist */}
      <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">
              Bank Sampah RT 02
            </span>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest">
              Blok {getHouseLabel(selectedHouseId)}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Tabungan Sampah Warga</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Ubah sampah anorganik menjadi bernilai ekonomi untuk kebersihan & iuran warga.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => {
              setSelectedHouseId('');
              localStorage.removeItem('resident_house_id');
            }}
            className="flex-1 md:flex-none px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} /> Ganti Rumah
          </button>
          <Button onClick={() => setIsDepositModalOpen(true)} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 py-3 px-5 rounded-2xl font-black uppercase tracking-wider text-xs">
            <Package size={16} className="mr-2" /> Setorkan Sampah
          </Button>
        </div>
      </div>

      {/* Modern Minimalist Navigation Pills */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 w-fit">
        {[
          { id: 'overview', label: 'Ringkasan', icon: Wallet },
          { id: 'history', label: 'Riwayat Setoran', icon: History },
          { id: 'prices', label: 'Daftar Harga', icon: DollarSign }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80' 
              : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon size={15} />
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
              {/* Primary Balance Minimal Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-600/10 flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                      <Wallet size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">SALDO AKTIF</span>
                      <p className="text-xs text-white/80 font-medium">Tabungan Sampah Anda</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-white">
                    Tersedia
                  </span>
                </div>

                <div>
                  <h3 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
                    Rp {(balance?.totalBalance || 0).toLocaleString()}
                  </h3>
                  <p className="text-xs text-white/70 font-medium">
                    Pembaruan terakhir: {balance ? new Date(balance.lastUpdated).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                </div>
              </div>

              {/* Minimal Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="bg-white border border-slate-200/80 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL TERKUMPUL</p>
                    <p className="text-2xl font-black text-slate-900">{totalWeight.toFixed(1)} <span className="text-xs font-bold text-slate-400">kg</span></p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                    <Package size={22} />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL SETORAN</p>
                    <p className="text-2xl font-black text-slate-900">{deposits.length} <span className="text-xs font-bold text-slate-400">Kali</span></p>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                    <TrendingUp size={22} />
                  </div>
                </div>
              </div>
            </div>

            {/* Clean Instructions Card */}
            <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">Manfaat & Penggunaan Saldo</h4>
                  <p className="text-xs text-slate-500 font-medium">Saldo tabungan sampah dapat digunakan secara praktis untuk:</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { title: 'Pembayaran Iuran RT', desc: 'Potong otomatis dari tagihan kebersihan bulanan warga.', icon: DollarSign },
                  { title: 'Belanja UMKM Warga', desc: 'Gunakan saldo untuk bertransaksi di Pasar Warga RT 02.', icon: Package },
                  { title: 'Pencairan Tunai', desc: 'Ambil langsung secara tunai melalui Pengurus / Bendahara RT.', icon: Wallet }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 bg-slate-50/60 border border-slate-200/60 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <item.icon size={16} />
                      <p className="text-xs font-black uppercase tracking-wider">{item.title}</p>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
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
            className="space-y-3"
          >
            {deposits.length > 0 ? (
              deposits.map((deposit) => (
                <motion.div 
                  key={deposit.id} 
                  variants={itemVariants}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3.5 rounded-2xl border ${
                      deposit.status === 'Confirmed' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      <Package size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-black text-slate-900 text-sm">{deposit.type}</h4>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                          deposit.status === 'Confirmed' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {deposit.status === 'Confirmed' ? 'Selesai' : 'Menunggu Ditingbang'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(deposit.date).toLocaleDateString('id-ID')}</span>
                        <span className="flex items-center gap-1"><TrendingUp size={12} /> {deposit.weight} kg</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 w-full sm:w-auto">
                    <p className="text-base font-black text-emerald-600 mb-0.5">
                      + Rp {deposit.totalValue.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      @ Rp {deposit.pricePerUnit.toLocaleString()}/kg
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-16 text-center bg-white rounded-[2.5rem] border border-slate-200/80">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
                  <History size={32} />
                </div>
                <h4 className="text-base font-black text-slate-800 mb-1">Belum Ada Riwayat Setoran</h4>
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
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {prices.map((price) => (
                <motion.div 
                  key={price.id} 
                  variants={itemVariants}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{price.type}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Satuan: {price.unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">Rp {price.pricePerUnit.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Per {price.unit}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-5 bg-amber-50/60 border border-amber-200/60 rounded-2xl flex items-start gap-3">
              <AlertCircle className="text-amber-500 mt-0.5 shrink-0" size={20} />
              <div>
                <h4 className="text-xs font-black text-amber-800 uppercase mb-0.5">Syarat Penimbangan Sampah</h4>
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Harga sampah mengikuti patokan pasar pengepul. Sampah yang disetorkan harus dalam kondisi bersih dan telah terpilah sesuai jenisnya.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Ajukan Setoran Sampah */}
      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Setorkan Sampah Anorganik">
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Pilih Jenis Sampah</label>
            <select 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
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
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Estimasi Berat (kg)</label>
            <input 
              type="number" 
              step="0.1"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
              value={depositForm.weight || ''}
              onChange={e => setDepositForm({...depositForm, weight: parseFloat(e.target.value) || 0})}
              placeholder="0.0"
            />
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Estimasi Hasil</span>
              <span className="text-lg font-black text-emerald-700">
                Rp {((prices.find(p => p.type === depositForm.type)?.pricePerUnit || 0) * depositForm.weight).toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-emerald-600 font-medium italic">* Nilai tepat akan ditentukan saat penimbangan fisik oleh petugas.</p>
          </div>

          <Button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 mt-2">
            Ajukan Setoran Sekarang
          </Button>
        </form>
      </Modal>
    </div>
  );
};
