import React, { useState, useEffect } from 'react';
import { Car, Shield, Plus, Search, Filter, Trash2, CheckCircle, AlertCircle, QrCode, User, Home, FileText, Check, X } from 'lucide-react';
import { House, ResidentVehicle } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { toast } from 'sonner';
import { 
  subscribeToResidentVehicles, 
  addResidentVehicleToDb, 
  updateResidentVehicleInDb, 
  deleteResidentVehicleFromDb 
} from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';
import { useConfirm } from '../../context/ConfirmContext';

interface VehicleManagerProps {
  houses: House[];
}

export const VehicleManager: React.FC<VehicleManagerProps> = ({ houses }) => {
  const confirm = useConfirm();
  const [vehicles, setVehicles] = useState<ResidentVehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<ResidentVehicle | null>(null);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);

  const [form, setForm] = useState({
    houseId: '',
    plateNumber: '',
    vehicleType: 'Mobil' as 'Mobil' | 'Motor' | 'Sepeda Listrik' | 'Lainnya',
    brandModel: '',
    color: '',
    ownerName: '',
    stickerNumber: ''
  });

  useEffect(() => {
    const unsub = subscribeToResidentVehicles(setVehicles);
    return () => unsub();
  }, []);

  const handleHouseChange = (houseId: string) => {
    const house = houses.find(h => h.id === houseId);
    setForm(prev => ({
      ...prev,
      houseId,
      ownerName: house ? house.headOfFamily : ''
    }));
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.houseId || !form.plateNumber) {
      toast.error('Silakan lengkapi nomor rumah & plat nomor.');
      return;
    }

    try {
      const generatedSticker = form.stickerNumber || `STK-RT02-${Math.floor(1000 + Math.random() * 9000)}`;
      await addResidentVehicleToDb({
        ...form,
        plateNumber: form.plateNumber.toUpperCase().trim(),
        stickerNumber: generatedSticker,
        status: 'Terverifikasi'
      });

      setIsAddModalOpen(false);
      setForm({
        houseId: '',
        plateNumber: '',
        vehicleType: 'Mobil',
        brandModel: '',
        color: '',
        ownerName: '',
        stickerNumber: ''
      });
      toast.success('Data kendaraan & E-Stiker berhasil diterbitkan!');
    } catch (error) {
      toast.error('Gagal menambahkan kendaraan.');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'Terverifikasi' | 'Menunggu' | 'Ditolak') => {
    try {
      await updateResidentVehicleInDb(id, { status: newStatus });
      toast.success(`Status stiker diperbarui ke ${newStatus}`);
    } catch (error) {
      toast.error('Gagal memperbarui status.');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Kendaraan',
      message: 'Apakah Anda yakin ingin menghapus data stiker kendaraan ini?',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteResidentVehicleFromDb(id);
        toast.success('Data kendaraan dihapus.');
      } catch (error) {
        toast.error('Gagal menghapus data.');
      }
    }
  };

  const getHouseLabel = (id: string) => {
    const house = houses.find(h => h.id === id);
    return house ? `${house.block}-${house.number}` : id;
  };

  const filteredVehicles = vehicles.filter(v => {
    const houseLabel = getHouseLabel(v.houseId);
    const search = searchQuery.toLowerCase();
    const matchesSearch = v.plateNumber.toLowerCase().includes(search) || 
                          v.ownerName.toLowerCase().includes(search) ||
                          houseLabel.toLowerCase().includes(search) ||
                          v.brandModel.toLowerCase().includes(search) ||
                          (v.stickerNumber || '').toLowerCase().includes(search);
    const matchesType = typeFilter === 'All' || v.vehicleType === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalMobil = vehicles.filter(v => v.vehicleType === 'Mobil').length;
  const totalMotor = vehicles.filter(v => v.vehicleType === 'Motor').length;

  return (
    <div className="space-y-6">
      {/* Header Banner - Apple Minimalist */}
      <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-mono font-black uppercase tracking-widest mb-2 inline-block">
            🛡️ KEAMANAN & REGISTRASI SATPAM
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Registrasi Kendaraan & E-Stiker</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Data kendaraan warga resmi RT 02 untuk akses masuk gerbang pos satpam & stiker fisik/digital.
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 text-xs py-3.5 px-6 rounded-2xl font-black uppercase tracking-wider">
          <Plus size={16} className="mr-2" /> Daftarkan Kendaraan
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-0.5">TOTAL TERDAFTAR</p>
            <p className="text-2xl font-black text-slate-900">{vehicles.length} <span className="text-xs font-bold text-slate-400">Unit</span></p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Shield size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-0.5">MOBIL WARGA</p>
            <p className="text-2xl font-black text-slate-900">{totalMobil} <span className="text-xs font-bold text-slate-400">Mobil</span></p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Car size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-0.5">MOTOR WARGA</p>
            <p className="text-2xl font-black text-slate-900">{totalMotor} <span className="text-xs font-bold text-slate-400">Motor</span></p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Car size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Quick Plate Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Ketik Plat Nomor (contoh: B 1234 ABC), Nama Pemilik, atau Blok..." 
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm font-mono"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 border border-slate-200/60 rounded-2xl overflow-x-auto no-scrollbar">
          {(['All', 'Mobil', 'Motor', 'Sepeda Listrik'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                typeFilter === type 
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80' 
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {type === 'All' ? 'Semua Jenis' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-200/80">
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Plat Nomor & Stiker</th>
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Pemilik & Rumah</th>
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Merk / Model</th>
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Status Akses</th>
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 bg-slate-900 text-white rounded-xl font-mono font-black text-sm tracking-wider shadow-sm border border-slate-800">
                        {vehicle.plateNumber}
                      </div>
                      <div>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-mono font-black uppercase tracking-widest border border-emerald-100 block w-fit mb-0.5">
                          {vehicle.stickerNumber || 'STK-RT02'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{vehicle.vehicleType}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-900 leading-none mb-1">{vehicle.ownerName || '-'}</p>
                    <p className="text-[10px] font-mono text-emerald-600 font-bold">Blok {getHouseLabel(vehicle.houseId)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{vehicle.brandModel || '-'}</p>
                    <p className="text-[10px] font-bold text-slate-400">Warna: {vehicle.color || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-xl text-[9px] font-mono font-black uppercase tracking-widest border ${
                      vehicle.status === 'Terverifikasi' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      ✓ {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setIsStickerModalOpen(true);
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Lihat E-Stiker Digital"
                      >
                        <QrCode size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(vehicle.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Hapus Data Kendaraan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
                      <Car size={32} />
                    </div>
                    <p className="text-slate-400 font-bold text-sm">Tidak ada data kendaraan terdaftar.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Vehicle */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Daftarkan Kendaraan Warga">
        <form onSubmit={handleSaveVehicle} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Pilih Rumah / Warga</label>
            <select 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
              value={form.houseId}
              onChange={e => handleHouseChange(e.target.value)}
            >
              <option value="">-- Pilih Rumah Warga --</option>
              {houses.filter(h => h.status === 'Occupied').map(h => (
                <option key={h.id} value={h.id}>Blok {h.block}-{h.number} • {h.headOfFamily}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Plat Nomor Kendaraan</label>
              <input 
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black uppercase text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.plateNumber}
                onChange={e => setForm({...form, plateNumber: e.target.value})}
                placeholder="B 1234 ABC"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Jenis Kendaraan</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.vehicleType}
                onChange={e => setForm({...form, vehicleType: e.target.value as any})}
              >
                <option value="Mobil">Mobil</option>
                <option value="Motor">Motor</option>
                <option value="Sepeda Listrik">Sepeda Listrik</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Merk & Model</label>
              <input 
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.brandModel}
                onChange={e => setForm({...form, brandModel: e.target.value})}
                placeholder="Toyota Avanza"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Warna Kendaraan</label>
              <input 
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.color}
                onChange={e => setForm({...form, color: e.target.value})}
                placeholder="Hitam Metalik"
              />
            </div>
          </div>

          <Button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 mt-2">
            Terbitkan E-Stiker Akses
          </Button>
        </form>
      </Modal>

      {/* Modal Digital Sticker Preview */}
      <Modal isOpen={isStickerModalOpen} onClose={() => setIsStickerModalOpen(false)} title="Kartu E-Stiker Akses Kendaraan">
        {selectedVehicle && (
          <div className="space-y-6 text-center py-2">
            {/* Printable ID Card Container */}
            <div id="printable-stiker-card" className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-[2rem] p-6 border-2 border-emerald-500/40 shadow-2xl relative overflow-hidden text-left mx-auto max-w-sm">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest">E-STIKER RESMI RT 02</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{selectedVehicle.stickerNumber}</span>
              </div>

              {/* Plat Nomor Box */}
              <div className="bg-slate-950 border-2 border-slate-700/80 p-4 rounded-2xl mb-4 text-center shadow-inner">
                <p className="text-3xl font-mono font-black text-amber-400 tracking-widest uppercase drop-shadow">
                  {selectedVehicle.plateNumber}
                </p>
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mt-1">VERIFIKASI AKSES GERBANG SATPAM</p>
              </div>

              {/* Detail Kendaraan & Pemilik */}
              <div className="space-y-2 text-xs bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Pemilik:</span>
                  <span className="font-bold text-white">{selectedVehicle.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Rumah / Blok:</span>
                  <span className="font-bold text-emerald-400">Blok {getHouseLabel(selectedVehicle.houseId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Jenis / Model:</span>
                  <span className="font-bold text-white">{selectedVehicle.vehicleType} • {selectedVehicle.brandModel || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Warna:</span>
                  <span className="font-bold text-white">{selectedVehicle.color || '-'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[9px] font-mono text-slate-400">
                <span>TERAS WARGA RT 02</span>
                <span className="text-emerald-400 font-bold">✓ STIKER AKTIF</span>
              </div>
            </div>

            <Button 
              onClick={() => {
                const printContent = document.getElementById('printable-stiker-card');
                if (printContent) {
                  const win = window.open('', '_blank');
                  if (win) {
                    win.document.write(`
                      <html>
                        <head>
                          <title>Cetak E-Stiker - ${selectedVehicle.plateNumber}</title>
                          <script src="https://cdn.tailwindcss.com"></script>
                          <style>
                            body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8fafc; }
                            @media print {
                              body { background: white; padding: 0; }
                            }
                          </style>
                        </head>
                        <body>
                          ${printContent.outerHTML}
                          <script>
                            setTimeout(() => {
                              window.print();
                              window.close();
                            }, 500);
                          </script>
                        </body>
                      </html>
                    `);
                    win.document.close();
                  }
                }
              }} 
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20"
            >
              🖨️ Cetak Kartu Akses Satpam (Print Preview)
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
