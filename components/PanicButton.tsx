import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
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
        className="fixed bottom-24 left-6 md:bottom-8 md:right-8 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all z-50 flex items-center justify-center group"
      >
        <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
        <AlertTriangle size={32} className="relative z-10" />
      </button>

      {alert && (
        <div className="fixed top-4 left-4 right-4 md:top-24 md:left-1/2 md:transform md:-translate-x-1/2 bg-red-600 text-white p-4 rounded-2xl shadow-2xl z-[60] animate-bounce flex items-center gap-3 border-2 border-white/20">
          <div className="bg-white/20 p-2 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <p className="font-black text-xs uppercase tracking-widest mb-0.5">Peringatan Darurat</p>
            <p className="font-bold text-sm">{alert}</p>
          </div>
        </div>
      )}
    </>
  );
};
