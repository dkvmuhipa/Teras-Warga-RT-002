import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function PanicButton() {
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
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all z-50 flex items-center justify-center"
      >
        <AlertTriangle size={32} />
      </button>

      {alert && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white p-4 rounded-xl shadow-2xl z-50 animate-pulse">
          {alert}
        </div>
      )}
    </>
  );
};
