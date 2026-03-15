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
  addWasteDepositToDb
} from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';

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

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const house = houses.find(h => h.id === tempHouseId);
    if (house && house.accessCode === pinInput) {
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
      alert('Setoran berhasil diajukan! Silakan serahkan sampah ke petugas untuk dikonfirmasi.');
    } catch (error) {
      console.error(error);
      alert('Gagal mengajukan setoran.');
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
      });

    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Package size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Tabungan Sampah</h2>
        <p className="text-slate-500 font-medium mb-8">Silakan pilih nomor rumah Anda untuk melihat saldo dan riwayat tabungan sampah.</p>
        <div className="space-y-4">
          <select 
            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
            value={tempHouseId}
            onChange={(e) => {
              setTempHouseId(e.target.value);
              if (e.target.value) setIsPinModalOpen(true);
            }}
          >
            <option value="">Pilih Nomor Rumah...</option>
            {sortedHouses.map(h => (
              <option key={h.id} value={h.id}>{h.block}-{h.number} - {h.headOfFamily}</option>
            ))}
          </select>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Anda akan tersimpan di perangkat ini.</p>
        </div>

        {/* PIN Verification Modal */}
        <Modal isOpen={isPinModalOpen} onClose={() => {
          setIsPinModalOpen(false);
          setTempHouseId('');
          setPinInput('');
        }} title="Verifikasi PIN Akses">
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-800">Masukkan PIN Rumah</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Masukkan kode akses untuk rumah <span className="font-bold text-emerald-600">{houses.find(h => h.id === tempHouseId)?.block}-{houses.find(h => h.id === tempHouseId)?.number}</span>
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
                className={`w-full px-6 py-4 bg-slate-50 border ${pinError ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'} rounded-2xl text-center text-2xl font-black tracking-[1em] outline-none transition-all`}
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                placeholder="••••••"
              />
              {pinError && (
                <p className="text-center text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-2">PIN yang Anda masukkan salah</p>
              )}
            </div>

            <Button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100">
              Verifikasi & Lanjutkan
            </Button>
          </form>
        </Modal>
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
    <div className="max-w-7xl mx-auto px-4 py-8 mb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Bank Sampah RT 02</h2>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
              Blok {getHouseLabel(selectedHouseId)}
            </span>
            <button 
              onClick={() => {
                setSelectedHouseId('');
                localStorage.removeItem('resident_house_id');
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
            >
              <ArrowLeft size={12} /> Ganti Rumah
            </button>
          </div>
          <p className="text-slate-500 font-medium">Ubah sampah menjadi berkah. Pantau tabungan sampah Anda di sini.</p>
        </div>
        <Button onClick={() => setIsDepositModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100">
          <Package size={18} className="mr-2" /> Setorkan Sampah
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white p-1.5 border border-slate-200 rounded-3xl shadow-sm mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Ringkasan', icon: Wallet },
          { id: 'history', label: 'Riwayat', icon: History },
          { id: 'prices', label: 'Daftar Harga', icon: DollarSign }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-8 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none shadow-2xl shadow-emerald-200 relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                      <Wallet size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest opacity-80">Total Saldo Tabungan</span>
                  </div>
                  <h3 className="text-5xl font-black mb-2">Rp {(balance?.totalBalance || 0).toLocaleString()}</h3>
                  <p className="text-sm font-medium opacity-70">Pembaruan terakhir: {balance ? new Date(balance.lastUpdated).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 bg-white border-slate-100 shadow-sm">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4">
                    <Package size={20} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sampah</p>
                  <p className="text-xl font-black text-slate-800">{totalWeight.toFixed(1)} kg</p>
                </Card>
                <Card className="p-6 bg-white border-slate-100 shadow-sm">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-4">
                    <TrendingUp size={20} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Setoran</p>
                  <p className="text-xl font-black text-slate-800">{deposits.length} Kali</p>
                </Card>
              </div>
            </div>

            <Card className="p-6 bg-slate-50 border-slate-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800">Cara Mencairkan Saldo</h4>
                  <p className="text-xs text-slate-500 font-medium">Saldo tabungan sampah Anda dapat digunakan untuk:</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Bayar Iuran', desc: 'Potong langsung tagihan iuran bulanan RT.', icon: DollarSign },
                  { title: 'Belanja UMKM', desc: 'Gunakan sebagai voucher di pasar warga.', icon: Package },
                  { title: 'Tarik Tunai', desc: 'Hubungi Bendahara RT untuk penarikan.', icon: Wallet }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <item.icon size={16} className="text-emerald-600" />
                      <p className="text-sm font-black text-slate-800">{item.title}</p>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
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
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${deposit.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <Package size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-slate-800">{deposit.type}</h4>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                          deposit.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {deposit.status === 'Confirmed' ? 'Selesai' : 'Menunggu'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(deposit.date).toLocaleDateString('id-ID')}</span>
                        <span className="flex items-center gap-1"><TrendingUp size={12} /> {deposit.weight} kg</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-600 leading-none mb-1">+ Rp {deposit.totalValue.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">@ Rp {deposit.pricePerUnit.toLocaleString()}/kg</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                  <History size={40} />
                </div>
                <h4 className="text-lg font-black text-slate-800 mb-2">Belum Ada Riwayat</h4>
                <p className="text-slate-400 font-medium max-w-xs mx-auto">Mulai setorkan sampah anorganik Anda ke Bank Sampah RT untuk melihat riwayat di sini.</p>
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
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {prices.map((price) => (
              <motion.div 
                key={price.id} 
                variants={itemVariants}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800">{price.type}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Satuan: {price.unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-slate-800">Rp {price.pricePerUnit.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Per {price.unit}</p>
                </div>
              </motion.div>
            ))}
            <div className="md:col-span-2 p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
              <AlertCircle className="text-amber-500 mt-1" size={20} />
              <div>
                <h4 className="text-sm font-black text-amber-800 mb-1">Informasi Harga</h4>
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Harga di atas dapat berubah sewaktu-waktu mengikuti harga pasar pengepul. Pastikan sampah yang disetorkan dalam keadaan bersih dan sudah dipilah sesuai jenisnya.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Setorkan Sampah">
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Jenis Sampah</label>
            <select 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
              value={depositForm.type}
              onChange={e => setDepositForm({...depositForm, type: e.target.value})}
            >
              <option value="">Pilih Jenis...</option>
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
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
              value={depositForm.weight}
              onChange={e => setDepositForm({...depositForm, weight: parseFloat(e.target.value)})}
              placeholder="0.0"
            />
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Estimasi Nilai</span>
              <span className="text-lg font-black text-emerald-700">
                Rp {((prices.find(p => p.type === depositForm.type)?.pricePerUnit || 0) * depositForm.weight).toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-emerald-600 font-medium italic">* Nilai akhir akan ditentukan setelah penimbangan oleh petugas.</p>
          </div>
          <Button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 mt-4">
            Ajukan Setoran
          </Button>
        </form>
      </Modal>
    </div>
  );
};
