import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export function PanicButton() {
  const [alert, setAlert] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io();

    socketRef.current.on('emergency:alert', (data) => {
      setAlert(`DARURAT: ${data.message} dari ${data.sender}`);
      setTimeout(() => setAlert(null), 10000); // Auto close after 10s
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const handlePanic = () => {
    if (window.confirm('Apakah Anda yakin ingin mengirim peringatan darurat?')) {
      socketRef.current?.emit('emergency:triggered', {
        message: 'Bantuan dibutuhkan segera!',
        sender: 'Warga',
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <>
      <button
        onClick={handlePanic}
        className="fixed bottom-24 left-4 md:bottom-8 md:left-8 bg-rose-600 text-white p-3 md:p-4 rounded-full shadow-2xl hover:bg-rose-700 transition-all z-50 flex items-center justify-center group border-4 border-white/20"
        title="Tombol Darurat (Panic Button)"
      >
        <div className="absolute inset-0 bg-rose-600 rounded-full animate-ping opacity-20 group-hover:opacity-40 scale-75"></div>
        <AlertTriangle size={24} className="relative z-10 md:w-8 md:h-8" />
        <span className="absolute left-full ml-3 px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Panic Button
        </span>
      </button>

      {alert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-rose-600 text-white p-4 rounded-2xl shadow-2xl z-[60] animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-4 border-2 border-white/30 backdrop-blur-sm">
          <div className="bg-white text-rose-600 p-2 rounded-xl shrink-0 animate-pulse">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[10px] uppercase tracking-widest opacity-80 mb-0.5">Peringatan Darurat</p>
            <p className="font-bold text-sm truncate">{alert}</p>
          </div>
          <button 
            onClick={() => setAlert(null)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
};
