import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, ShieldAlert, Volume2, VolumeX, MapPin, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendPanicAlert, subscribeToActivePanicAlerts, updatePanicAlertStatus } from '../services/databaseService';
import { toast } from 'sonner';
import { PanicAlert, House } from '../types';

export function PanicButton({ houses = [] }: { houses?: House[] }) {
  const [alert, setAlert] = useState<{ message: string; sender: string; timestamp: string; location?: { lat: number; lng: number } } | string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<PanicAlert[]>([]);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Audio for siren - Using a War/Air Raid Siren for more intensity
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audioRef.current.loop = true;

    // Subscribe to active alerts
    const unsubscribe = subscribeToActivePanicAlerts((data) => {
      setActiveAlerts(data as PanicAlert[]);
      
      // If there's a new alert from someone else, show it
      const myHouseId = localStorage.getItem('resident_house_id');
      const latestAlert = data[data.length - 1];
      if (latestAlert && latestAlert.houseId !== myHouseId && latestAlert.status === 'Active') {
        setAlert({
          message: `Warga ${latestAlert.residentName} (Blok ${latestAlert.location}) butuh bantuan!`,
          sender: latestAlert.residentName,
          timestamp: latestAlert.timestamp
        });
        playSiren();
      }
    });

    return () => {
      stopSiren();
      unsubscribe();
    };
  }, []);

  const myActiveAlert = activeAlerts.find(a => a.houseId === localStorage.getItem('resident_house_id'));

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
    // Try to get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendPanicSignal({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          sendPanicSignal();
        },
        { timeout: 5000 }
      );
    } else {
      sendPanicSignal();
    }
  };

  const sendPanicSignal = async (location?: { lat: number; lng: number }) => {
    const houseId = localStorage.getItem('resident_house_id') || 'Unknown';
    const house = houses.find(h => h.id === houseId);
    
    const residentName = house ? house.headOfFamily : (localStorage.getItem('resident_name') || 'Warga');
    const locationStr = house ? `Blok ${house.block}-${house.number}` : (localStorage.getItem('resident_location') || houseId);

    // Determine location coords for the map
    const BLOCK_COORDS: Record<string, { x: number, y: number }> = {
      'C5': { x: 12.5, y: 50 },
      'C7': { x: 37.5, y: 25 },
      'C8': { x: 37.5, y: 75 },
      'C9': { x: 62.5, y: 25 },
      'C10': { x: 62.5, y: 75 },
      'C11': { x: 87.5, y: 25 },
      'C12': { x: 87.5, y: 75 },
    };
    
    const locationCoords = house ? BLOCK_COORDS[house.block] : undefined;

    try {
      const result = await sendPanicAlert(houseId, residentName, locationStr, locationCoords);
      
      if (result === true) {
        // Vibrate if mobile
        if (navigator.vibrate) {
          navigator.vibrate([500, 200, 500, 200, 500]);
        }

        // Show confirmation to sender
        setIsSent(true);
        playSiren(); // Play siren for the sender too
        toast.success("Sinyal Darurat Terkirim!", {
          description: "Petugas keamanan telah diberitahu.",
          duration: 5000
        });
        setTimeout(() => setIsSent(false), 5000);
      } else {
        // If result is an error message or false
        const errorMessage = typeof result === 'string' ? result : "Gagal mengirim sinyal darurat. Coba lagi.";
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Panic alert error:", error);
      toast.error(`Terjadi kesalahan sistem: ${error.message || 'Error tidak diketahui'}`);
    }
  };

  const closeAlert = () => {
    setAlert(null);
    stopSiren();
  };

  const handleCancelAlert = async () => {
    if (myActiveAlert) {
      await updatePanicAlertStatus(myActiveAlert.id, 'Cancelled');
      toast.success("Sinyal Darurat Dibatalkan");
    }
  };

  return (
    <>
      {/* Panic Trigger Button */}
      <div className="fixed bottom-24 left-4 md:bottom-8 md:left-8 z-50 flex flex-col items-center gap-2">
        <AnimatePresence>
          {myActiveAlert && (
            <motion.div 
              key={`active-alert-${myActiveAlert.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-col items-center gap-2 mb-2"
            >
              <div className={`
                px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl border
                ${myActiveAlert.status === 'Active' ? 'bg-rose-600 text-white border-rose-400/20 animate-pulse' : 
                  myActiveAlert.status === 'Responding' ? 'bg-amber-500 text-white border-amber-400/20' : 
                  'bg-emerald-600 text-white border-emerald-400/20'}
              `}>
                {myActiveAlert.status === 'Active' ? 'Mencari Bantuan...' : 
                 myActiveAlert.status === 'Responding' ? `Petugas ${myActiveAlert.responderName || ''} Menuju Lokasi` : 
                 'Bantuan Tiba'}
              </div>
              
              {myActiveAlert.status === 'Active' && (
                <button 
                  onClick={handleCancelAlert}
                  className="bg-slate-900/80 hover:bg-slate-900 text-white text-[9px] font-bold uppercase tracking-tighter px-3 py-1 rounded-full backdrop-blur-sm transition-all"
                >
                  Batalkan Sinyal
                </button>
              )}
            </motion.div>
          )}
          
          {isHolding && (
            <motion.div 
              key="hold-indicator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-2 shadow-xl border border-white/10"
            >
              Tahan 2 Detik...
            </motion.div>
          )}
          {isSent && (
            <motion.div 
              key="sent-indicator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-2 shadow-xl border border-emerald-400/20"
            >
              Sinyal Terkirim!
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
            ${isSent ? 'bg-emerald-600 border-emerald-400/50' : ''}
          `}>
            <div className={`absolute inset-0 bg-rose-600 rounded-full animate-ping opacity-20 ${isHolding || isSent ? 'hidden' : ''}`}></div>
            {isSent ? <CheckCircle size={28} className="relative z-10" /> : <AlertTriangle size={28} className="relative z-10" />}
          </div>
          
          <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
            {isSent ? 'Sinyal Terkirim' : 'Panic Button'}
          </span>
        </button>
      </div>

      {/* Emergency Alert Overlay */}
      <AnimatePresence>
        {alert && (
          <motion.div 
            key="emergency-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-rose-950/90 backdrop-blur-md"
          >
            <motion.div 
              key="emergency-modal"
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
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Pesan</p>
                      <p className="text-lg font-bold text-slate-800 leading-tight">
                        {typeof alert === 'string' ? alert : alert.message || 'Peringatan Darurat!'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pengirim</p>
                      <p className="font-bold text-slate-800">
                        {typeof alert === 'string' ? 'Sistem' : alert.sender || 'Warga'}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Waktu</p>
                      <p className="font-bold text-slate-800">
                        {typeof alert === 'object' && alert.timestamp 
                          ? new Date(alert.timestamp).toLocaleTimeString('id-ID') 
                          : new Date().toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {typeof alert === 'object' && alert.location && (
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <MapPin size={12} /> Lokasi Terdeteksi
                      </p>
                      <a 
                        href={`https://www.google.com/maps?q=${alert.location.lat},${alert.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between group"
                      >
                        <span className="text-sm font-bold text-indigo-900 underline decoration-indigo-200 underline-offset-4">
                          Buka di Google Maps
                        </span>
                        <div className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <MapPin size={16} />
                        </div>
                      </a>
                    </div>
                  )}
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
