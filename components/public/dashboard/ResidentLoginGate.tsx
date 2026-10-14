import React, { useState } from 'react';
import { 
  Shield, 
  QrCode, 
  FileEdit, 
  History, 
  AlertTriangle, 
  User, 
  Info, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ChevronRight 
} from 'lucide-react';
import { House } from '../../../types';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

interface ResidentLoginGateProps {
  houses: House[];
  tempHouseId: string;
  setTempHouseId: (id: string) => void;
  isPinModalOpen: boolean;
  setIsPinModalOpen: (open: boolean) => void;
  pinInput: string;
  setPinInput: (pin: string | ((prev: string) => string)) => void;
  pinError: boolean;
  handlePinSubmit: (e: React.FormEvent) => void;
  rememberSession: boolean;
  setRememberSession: (remember: boolean) => void;
}

export const ResidentLoginGate: React.FC<ResidentLoginGateProps> = ({
  houses,
  tempHouseId,
  setTempHouseId,
  isPinModalOpen,
  setIsPinModalOpen,
  pinInput,
  setPinInput,
  pinError,
  handlePinSubmit,
  rememberSession,
  setRememberSession,
}) => {
  const [showPin, setShowPin] = useState(false);

  const sortedHouses = [...houses]
    .filter(h => h.status === 'Occupied')
    .sort((a, b) => {
      if (a.block !== b.block) return a.block.localeCompare(b.block, undefined, { numeric: true });
      return (a.number || '').localeCompare(b.number || '', undefined, { numeric: true });
    });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-6 md:p-12 relative overflow-hidden">
        {/* Atmospheric Background glow */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-100/40 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-emerald-50/30 blur-[100px] rounded-full pointer-events-none" />
        
        {/* Left illustration/info column */}
        <div className="md:col-span-7 space-y-6 md:pr-6 relative z-10 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 shadow-sm">
            <Shield size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Warga Hub Portal Mandiri</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Akses Portal Mandiri <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800">Warga RT 02</span>
          </h2>
          
          <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-lg">
            Selamat datang di sistem siber layanan mandiri warga. Gunakan kode PIN unik hunian Anda untuk memantau iuran bulanan, mengurus surat pengantar resmi kelurahan secara instan, mencetak E-ID, serta menyampaikan laporan masalah lingkungan secara langsung.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {[
              { title: "E-ID Card Digital", desc: "Verifikasi barcode identitas RT secara instan", icon: QrCode, color: "text-indigo-600 bg-indigo-50 border-indigo-100/50" },
              { title: "Update KK Mandiri", desc: "Ubah data penghuni & keluarga kapan saja", icon: FileEdit, color: "text-emerald-600 bg-emerald-50 border-emerald-100/50" },
              { title: "Log Tamu Keamanan", desc: "Pantau & atur kedatangan tamu bermalam", icon: History, color: "text-amber-600 bg-amber-50 border-amber-100/50" },
              { title: "Laporan & Aduan", desc: "Sampaikan keluhan fasilitas secara digital", icon: AlertTriangle, color: "text-rose-600 bg-rose-50 border-rose-100/50" }
            ].map((feat, idx) => (
              <div key={idx} className="flex gap-3 text-left p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className={`p-2.5 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center border ${feat.color}`}>
                  <feat.icon size={16} />
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-800">{feat.title}</h5>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-snug">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Login form column */}
        <div className="md:col-span-5 bg-slate-50/60 p-6 md:p-8 rounded-3xl border border-slate-100 flex flex-col justify-center relative z-10">
          <div className="w-16 h-16 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100/80 mb-6">
            <User size={32} />
          </div>
          
          <h3 className="text-xl font-black text-slate-800 mb-1 text-left">Pilih Rumah Anda</h3>
          <p className="text-xs text-slate-400 font-semibold mb-6 text-left">Silakan tentukan identitas hunian aktif Anda di bawah ini:</p>

          <div className="space-y-4">
            <select 
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer hover:border-indigo-200"
              value={tempHouseId}
              onChange={(e) => {
                setTempHouseId(e.target.value);
                if (e.target.value) setIsPinModalOpen(true);
              }}
            >
              <option value="">Pilih Hunian Kelurahan...</option>
              {sortedHouses.map(h => (
                <option key={h.id} value={h.id}>Blok {h.block}-{h.number} ({h.headOfFamily})</option>
              ))}
            </select>
            
            <div className="flex items-center gap-1.5 pl-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
              <Info size={12} className="text-slate-400 shrink-0" />
              <span>Gunakan PIN 6-digit rahasia rumah Anda</span>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isPinModalOpen} onClose={() => {
        setIsPinModalOpen(false);
        setTempHouseId('');
        setPinInput('');
      }} title="Verifikasi PIN Akses">
        <form onSubmit={handlePinSubmit} className="space-y-6 p-2">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-800">Masukkan PIN Rumah</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Akses masuk aman untuk warga <span className="font-bold text-indigo-600">Blok {houses.find(h => h.id === tempHouseId)?.block}-{houses.find(h => h.id === tempHouseId)?.number}</span>
            </p>
          </div>

          {/* Hidden Input for Keyboard Typing */}
          <input 
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            autoFocus
            className="sr-only"
            id="pin-hidden-input"
            value={pinInput}
            onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
          />

          {/* Premium PIN Slot Visual Indicators */}
          <div 
            onClick={() => document.getElementById('pin-hidden-input')?.focus()}
            className="flex justify-center gap-3 my-4 cursor-pointer"
            title="Klik untuk mengetik"
          >
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const hasValue = pinInput.length > idx;
              return (
                <div 
                  key={idx} 
                  className={`w-11 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all ${
                    pinError 
                      ? 'border-rose-500 bg-rose-50 text-rose-600 animate-pulse' 
                      : hasValue 
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-md shadow-indigo-100/50 scale-105' 
                        : 'border-slate-200 bg-white text-slate-300'
                  }`}
                >
                  {hasValue ? (showPin ? pinInput[idx] : '•') : ''}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center px-4">
            <button 
              type="button" 
              onClick={() => setShowPin(!showPin)}
              className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors"
            >
              {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}</span>
            </button>
            <button
              type="button"
              onClick={() => setPinInput('')}
              className="text-xs font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest cursor-pointer transition-colors"
            >
              Hapus Semua
            </button>
          </div>

          {pinError && (
            <p className="text-xs text-rose-500 font-bold text-center animate-bounce">PIN Salah! Periksa sandi unik hunian Anda kembali.</p>
          )}

          {/* Interactive Tactile Keypad */}
          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (pinInput.length < 6) setPinInput(prev => prev + num);
                }}
                className="w-16 h-16 bg-slate-50 hover:bg-slate-100 active:scale-95 text-lg font-black text-slate-800 rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-slate-100 hover:border-slate-200"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              className="w-16 h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-2xl flex items-center justify-center"
              disabled
            >
              {/* Blank Spacer */}
            </button>
            <button
              type="button"
              onClick={() => {
                if (pinInput.length < 6) setPinInput(prev => prev + '0');
              }}
              className="w-16 h-16 bg-slate-50 hover:bg-slate-100 active:scale-95 text-lg font-black text-slate-800 rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-slate-100 hover:border-slate-200"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPinInput(prev => prev.slice(0, -1))}
              className="w-16 h-16 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-slate-100 hover:border-slate-200 hover:text-rose-500 hover:bg-rose-50"
              title="Hapus satu angka"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          {/* Remember Session Option */}
          <label className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl cursor-pointer select-none text-left hover:bg-slate-100/60 transition-colors">
            <input 
              type="checkbox" 
              checked={rememberSession}
              onChange={(e) => setRememberSession(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
            <span className="text-[11px] font-semibold text-slate-700 leading-snug">
              Ingat sesi di perangkat ini
              <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                Jangan dicentang jika menggunakan perangkat publik/bersama. Data akan otomatis terhapus saat Anda keluar sesi atau menutup browser.
              </span>
            </span>
          </label>

          <Button type="submit" className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer font-black text-xs uppercase tracking-widest">
            Verifikasi & Masuk <ChevronRight size={16} />
          </Button>
        </form>
      </Modal>
    </div>
  );
};
