import React, { useState } from 'react';
import { Phone, AlertTriangle } from 'lucide-react';

export const PanicButton: React.FC = () => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handlePanic = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
          const message = `TOLONG! Ada keadaan darurat di RT 002! Lokasi saya: ${mapLink}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
          setIsConfirming(false);
        },
        () => {
          // Fallback if location fails
          window.open(`https://wa.me/?text=${encodeURIComponent('TOLONG! Ada keadaan darurat di RT 002!')}`, '_blank');
          setIsConfirming(false);
        }
      );
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent('TOLONG! Ada keadaan darurat di RT 002!')}`, '_blank');
      setIsConfirming(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsConfirming(true)}
        className="fixed bottom-36 right-4 md:bottom-10 md:left-10 md:right-auto z-[45] group flex items-center gap-2 animate-bounce-slow"
      >
        <div className="bg-red-600 text-white p-3 md:p-3.5 rounded-full shadow-xl shadow-red-500/40 hover:bg-red-700 hover:scale-110 transition-all ring-4 ring-red-100">
          <Phone size={24} fill="currentColor" />
        </div>
        <span className="bg-white text-red-600 border border-red-100 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-x-4 md:-translate-x-0 group-hover:translate-x-0 whitespace-nowrap hidden sm:block">
          Tombol Darurat
        </span>
      </button>

      {isConfirming && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center">
            <AlertTriangle size={48} className="text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-800 mb-2">Konfirmasi Darurat</h3>
            <p className="text-slate-600 mb-6">Apakah Anda yakin ingin mengirim pesan darurat beserta lokasi Anda ke pengurus RT?</p>
            <div className="flex gap-3">
              <button onClick={() => setIsConfirming(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Batal</button>
              <button onClick={handlePanic} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">Ya, Kirim</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
