import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Droplets, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { House } from '../../../types';
import { Button } from '../../ui/Button';
import { formatHouseId } from '../../../services/databaseService';
import { useTenant } from '../../../context/TenantContext';

interface HouseBillCheckerProps {
  houses: House[];
  summaries: any;
  financialSettings: any;
}

export const HouseBillChecker: React.FC<HouseBillCheckerProps> = ({
  houses,
  summaries,
  financialSettings
}) => {
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const [statusSearchId, setStatusSearchId] = useState('');

  const blocks = currentTenant.blocks && currentTenant.blocks.length > 0 
    ? currentTenant.blocks 
    : ['C5', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'];

  const handleCheckStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusSearchId.trim()) {
      toast.info('Masukkan nomor rumah terlebih dahulu');
      return;
    }

    const normalized = formatHouseId(statusSearchId.trim());
    const house = houses.find(
      h => h.id.toLowerCase() === normalized.toLowerCase() || 
           h.id.toLowerCase() === statusSearchId.toLowerCase().trim()
    );

    if (house) {
      navigate(`/info?search=${encodeURIComponent(house.id)}`);
    } else {
      toast.error('No. Rumah tidak ditemukan', {
        description: `Pastikan format sesuai blok ${currentTenant.name} (Contoh: ${blocks[0]}-01)`
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Kas & Iuran Info Card */}
      <div className="md:col-span-1 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-5 sm:p-6 md:p-8 rounded-3xl md:rounded-[3rem] text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <Droplets size={140} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Keuangan Warga</p>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase tracking-wider">
              Transparan
            </span>
          </div>
          <h3 className="text-2xl font-black mb-4 tracking-tight">Iuran & Kas {currentTenant.rt ? `RT ${currentTenant.rt}` : 'Lingkungan'}</h3>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                  <Droplets size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200">Fasilitas Air Bersih</span>
                  <p className="text-[10px] text-slate-400">Sistem Meter Mandiri</p>
                </div>
              </div>
              <span className="text-xs font-black text-white">
                {financialSettings.airFee > 0 ? `Rp ${financialSettings.airFee.toLocaleString('id-ID')}` : 'PDAM (Mandiri)'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                  <ShoppingCart size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200">Retribusi Sampah TPS3R</span>
                  <p className="text-[10px] text-slate-400">Berjenjang Sesuai Kategori</p>
                </div>
              </div>
              <span className="text-xs font-black text-white">
                {financialSettings.sampahFee ? `Rp ${financialSettings.sampahFee.toLocaleString('id-ID')}` : 'Rp 20.000'}
              </span>
            </div>
            
            {/* Info Transparansi Tambahan */}
            <div className="pt-3 mt-3 border-t border-white/10 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dana Air Terkumpul</span>
                <span className="font-black text-blue-400">Rp {(summaries.air?.totalCollected || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dana Sampah Terkumpul</span>
                <span className="font-black text-emerald-400">Rp {(summaries.sampah?.totalCollected || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total Iuran Terkumpul</span>
                <span className="text-base font-black text-emerald-300">Rp {(summaries.totalCollected || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => navigate('/services?tab=iuran')}
            variant="secondary" 
            className="w-full py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-lg cursor-pointer hover:bg-white transition-all"
          >
            Bayar Iuran Sekarang
          </Button>
        </div>
      </div>

      {/* Cek Tagihan Form Card */}
      <div className="md:col-span-2 bg-white/80 backdrop-blur-md p-5 sm:p-6 md:p-8 rounded-3xl md:rounded-[3rem] border border-slate-100 shadow-xl shadow-indigo-500/5 flex flex-col justify-between group">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">Status Pembayaran</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cek Tagihan Rumah</h3>
          </div>
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <CheckCircle2 size={24} />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 w-full">
            <p className="text-sm text-slate-500 font-medium mb-4 leading-relaxed">
              Masukkan nomor rumah Anda untuk melihat rincian tagihan iuran air dan sampah yang belum terbayar.
            </p>
            
            <div className="flex items-center gap-1.5 flex-wrap mb-4">
              <span className="text-[10px] font-bold text-slate-400">Pilih Cepat Blok:</span>
              {blocks.map(blockPrefix => (
                <button
                  key={blockPrefix}
                  type="button"
                  onClick={() => setStatusSearchId(`${blockPrefix}-`)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border border-slate-200/60 active:scale-95 shadow-2xs"
                >
                  Blok {blockPrefix}
                </button>
              ))}
            </div>

            <form onSubmit={handleCheckStatus} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <label htmlFor="house-number-input" className="sr-only">Nomor Rumah</label>
              <input 
                id="house-number-input"
                type="text" 
                placeholder={`No. Rumah (Contoh: ${blocks[0] || 'C10'}-08)`}
                className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-xs"
                value={statusSearchId}
                onChange={e => setStatusSearchId(e.target.value)}
              />
              <Button type="submit" className="px-7 rounded-2xl cursor-pointer shadow-md">
                Cek
              </Button>
            </form>
          </div>
          
          <div className="hidden md:block w-px h-32 bg-slate-100 mx-4" />
          
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="p-6 bg-slate-50 rounded-[2rem] text-center border border-slate-100 group-hover:bg-indigo-50 transition-colors flex flex-col justify-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Rumah</p>
              <p className="text-2xl font-black text-slate-800">{houses.length}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                {houses.filter(h => h.status === 'Occupied' || h.status === 'Business').length} Rumah Terisi
              </p>
            </div>
            <div className="p-6 bg-slate-50 rounded-[2rem] text-center border border-slate-100 group-hover:bg-emerald-50 transition-colors">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lunas Iuran</p>
              <div className="flex flex-col items-center">
                <p className="text-2xl font-black text-emerald-600">
                  {summaries.fullyPaidHousesCount || 0}
                </p>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Lunas Keduanya</p>
              </div>
              
              <div className="mt-3 pt-3 border-t border-slate-200/50 grid grid-cols-2 gap-1">
                <div className="text-center">
                  <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Air</p>
                  <p className="text-[10px] font-black text-blue-600">
                    {Math.max(0, houses.filter(h => h.status === 'Occupied').length - (summaries.air?.unpaidCount || 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Sampah</p>
                  <p className="text-[10px] font-black text-emerald-600">
                    {Math.max(0, houses.filter(h => h.status === 'Occupied').length - (summaries.sampah?.unpaidCount || 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
