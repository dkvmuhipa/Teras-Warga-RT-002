import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, ShieldAlert, Volume2, VolumeX, MapPin } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';

export function PanicButton() {
  const [alert, setAlert] = useState<{ message: string; sender: string; timestamp: string } | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize Socket.io
    socketRef.current = io();

    socketRef.current.on('emergency:alert', (data) => {
      setAlert(data);
      if (!isMuted) {
        playSiren();
      }
    });

    // Audio for siren
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audioRef.current.loop = true;

    return () => {
      socketRef.current?.disconnect();
      stopSiren();
    };
  }, []);

  const playSiren = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  };

  const stopSiren = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const startHolding = () => {
    setIsHolding(true);
    setHoldProgress(0);
    const startTime = Date.now();
    const duration = 2000; // 2 seconds hold

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setHoldProgress(progress);

      if (elapsed >= duration) {
        triggerPanic();
        cancelHolding();
      }
    }, 50);
  };

  const cancelHolding = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
    }
  };

  const triggerPanic = () => {
    socketRef.current?.emit('emergency:triggered', {
      message: 'DARURAT! Bantuan dibutuhkan segera di lokasi ini!',
      sender: 'Warga RT 002',
      timestamp: new Date().toISOString(),
    });
    
    // Vibrate if mobile
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500]);
    }
  };

  const closeAlert = () => {
    setAlert(null);
    stopSiren();
  };

  return (
    <>
      {/* Panic Trigger Button */}
      <div className="fixed bottom-24 left-4 md:bottom-8 md:left-8 z-50 flex flex-col items-center gap-2">
        <AnimatePresence>
          {isHolding && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-2 shadow-xl border border-white/10"
            >
              Tahan 2 Detik...
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onMouseDown={startHolding}
          onMouseUp={cancelHolding}
          onMouseLeave={cancelHolding}
          onTouchStart={startHolding}
          onTouchEnd={cancelHolding}
          className="relative group"
        >
          {/* Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-white/10"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * holdProgress) / 100}
              className="text-rose-500 transition-all duration-75"
            />
          </svg>

          <div className={`
            relative bg-rose-600 text-white p-4 md:p-5 rounded-full shadow-2xl 
            transition-all duration-300 flex items-center justify-center border-4 border-white/20
            ${isHolding ? 'scale-90 bg-rose-700' : 'hover:scale-110 hover:bg-rose-700'}
          `}>
            <div className={`absolute inset-0 bg-rose-600 rounded-full animate-ping opacity-20 ${isHolding ? 'hidden' : ''}`}></div>
            <AlertTriangle size={28} className="relative z-10" />
          </div>
          
          <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
            Panic Button
          </span>
        </button>
      </div>

      {/* Emergency Alert Overlay */}
      <AnimatePresence>
        {alert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-rose-950/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-white rounded-[3rem] shadow-[0_0_100px_rgba(225,29,72,0.5)] overflow-hidden border-4 border-rose-500"
            >
              <div className="bg-rose-600 p-8 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent animate-pulse"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="bg-white text-rose-600 p-4 rounded-3xl mb-6 shadow-xl animate-bounce">
                    <ShieldAlert size={48} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">Peringatan Bahaya!</h2>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                    Sinyal Darurat Aktif
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Pesan</p>
                      <p className="text-lg font-bold text-slate-800 leading-tight">{alert.message}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pengirim</p>
                      <p className="font-bold text-slate-800">{alert.sender}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Waktu</p>
                      <p className="font-bold text-slate-800">{new Date(alert.timestamp).toLocaleTimeString('id-ID')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isMuted ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-600'}`}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    {isMuted ? 'Suara Mati' : 'Matikan Suara'}
                  </button>
                  <button 
                    onClick={closeAlert}
                    className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Tutup & Selesai
                  </button>
                </div>
                
                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Segera hubungi petugas keamanan atau pengurus RT jika diperlukan.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
