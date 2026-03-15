import React, { useState } from 'react';
import { User, Phone, Calendar, Clock, Send, CheckCircle, ArrowLeft, Camera, ShieldAlert } from 'lucide-react';
import { Button } from './ui/Button';
import { addGuestReportToDb, uploadImageToStorage } from '../services/databaseService';
import { House } from '../types';

interface GuestReportFormProps {
  onClose: () => void;
  houses: House[];
}

export const GuestReportForm: React.FC<GuestReportFormProps> = ({ onClose, houses }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    residentHouseId: '',
    guestName: '',
    relationship: '',
    stayDuration: '',
    arrivalDate: new Date().toISOString().split('T')[0],
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const selectedHouse = houses.find(h => h.id === formData.residentHouseId);
      let ktpUrl = '';

      if (ktpFile) {
        ktpUrl = await uploadImageToStorage(ktpFile, `guests/ktp_${Date.now()}_${ktpFile.name}`);
      }

      await addGuestReportToDb({
        ...formData,
        residentName: selectedHouse?.headOfFamily || 'Warga',
        ktpUrl,
        status: 'Active',
        createdAt: new Date().toISOString()
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      alert('Gagal mengirim laporan tamu. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-4">Laporan Diterima!</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Terima kasih telah melaporkan tamu Anda. Data ini membantu menjaga keamanan lingkungan kita bersama.
        </p>
        <Button onClick={onClose} className="w-full py-4 bg-slate-800 hover:bg-slate-900">
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-2xl mx-auto border border-slate-100">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={16} className="text-rose-500" />
            <h2 className="text-2xl font-black text-slate-800">Wajib Lapor Tamu</h2>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ketentuan 1x24 Jam RT 02</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rumah Yang Dikunjungi</label>
          <select 
            required
            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            value={formData.residentHouseId}
            onChange={e => setFormData({...formData, residentHouseId: e.target.value})}
          >
            <option value="">Pilih Rumah Anda</option>
            {houses.map(h => (
              <option key={h.id} value={h.id}>Blok {h.block} No. {h.number} - {h.headOfFamily}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Tamu</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="text"
                placeholder="Nama Lengkap Tamu"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                value={formData.guestName}
                onChange={e => setFormData({...formData, guestName: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hubungan</label>
            <input 
              required
              type="text"
              placeholder="Contoh: Saudara, Teman"
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              value={formData.relationship}
              onChange={e => setFormData({...formData, relationship: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Kedatangan</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="date"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                value={formData.arrivalDate}
                onChange={e => setFormData({...formData, arrivalDate: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lama Menginap (Hari)</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="text"
                placeholder="Contoh: 3 Hari"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                value={formData.stayDuration}
                onChange={e => setFormData({...formData, stayDuration: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor HP Tamu / Penjamin</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              required
              type="tel"
              placeholder="0812xxxx"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto KTP Tamu</label>
          <div className={`
            relative h-40 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer overflow-hidden
            ${ktpFile ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'}
          `}>
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={e => setKtpFile(e.target.files?.[0] || null)}
            />
            {ktpFile ? (
              <div className="text-center p-4">
                <CheckCircle className="mx-auto mb-2 text-indigo-600" size={32} />
                <p className="text-xs font-black text-indigo-600 truncate max-w-[200px]">{ktpFile.name}</p>
              </div>
            ) : (
              <>
                <Camera className="text-slate-300" size={40} />
                <p className="text-xs font-black text-slate-400">Ambil Foto KTP Tamu</p>
              </>
            )}
          </div>
        </div>

        <div className="pt-6">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-100 flex items-center justify-center gap-3"
          >
            {isLoading ? 'Mengirim...' : (
              <>
                <Send size={18} />
                Kirim Laporan Tamu
              </>
            )}
          </Button>
          <p className="text-[10px] text-center text-slate-400 font-bold mt-4 italic">
            * Laporan ini akan diteruskan ke Pengurus RT dan Petugas Keamanan.
          </p>
        </div>
      </form>
    </div>
  );
};
