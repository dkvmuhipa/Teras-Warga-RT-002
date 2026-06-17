import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  X, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  MapPin, 
  CheckCircle, 
  Lock, 
  Flame, 
  Shield, 
  Activity, 
  CloudLightning, 
  PhoneCall, 
  Bell, 
  Compass, 
  HelpCircle, 
  AlertOctagon, 
  MessageSquare,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  sendPanicAlert, 
  subscribeToActivePanicAlerts, 
  updatePanicAlertStatus, 
  handleFirestoreError, 
  OperationType 
} from '../services/databaseService';
import { toast } from 'sonner';
import { PanicAlert, House } from '../types';

// ==========================================
// HIGH-FIDELITY WEB AUDIO EMERGENCY SYNTHESIZER
// ==========================================
class DynamicEmergencySiren {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  start(type: string = 'Keamanan') {
    if (this.isPlaying) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // Significantly increased base volume to make it sound realistic, powerful, and audible
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);

      this.osc1 = this.ctx.createOscillator();
      this.osc2 = this.ctx.createOscillator();
      this.lfo = this.ctx.createOscillator();
      this.lfoGain = this.ctx.createGain();

      // Connect LFO modulator directly to oscillator frequencies for authentic sweeps
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.osc1.frequency);
      this.lfoGain.connect(this.osc2.frequency);

      this.osc1.connect(this.gainNode);
      this.osc2.connect(this.gainNode);

      // Dedicated synthesis parameters for unmatched alarm fidelity
      if (type === 'Keamanan') {
        // High Urgency Fast Yelp Siren (Police Patrol style)
        this.osc1.type = 'sawtooth';
        this.osc2.type = 'sawtooth';
        this.osc1.frequency.setValueAtTime(650, this.ctx.currentTime);
        this.osc2.frequency.setValueAtTime(655, this.ctx.currentTime); // detuned for thick chorus effect

        this.lfo.type = 'sine';
        this.lfo.frequency.setValueAtTime(4.0, this.ctx.currentTime); // very fast 4.0 Hz sweeps
        this.lfoGain.gain.setValueAtTime(320, this.ctx.currentTime); // sweep bounds: +/- 320 Hz
      } else if (type === 'Kebakaran') {
        // Heavy, sweeping Air Horn Siren
        this.osc1.type = 'sawtooth';
        this.osc2.type = 'triangle';
        this.osc1.frequency.setValueAtTime(420, this.ctx.currentTime);
        this.osc2.frequency.setValueAtTime(425, this.ctx.currentTime);

        this.lfo.type = 'sine';
        this.lfo.frequency.setValueAtTime(0.8, this.ctx.currentTime); // slow sweeping wail
        this.lfoGain.gain.setValueAtTime(220, this.ctx.currentTime); 
      } else if (type === 'Medis') {
        // Classic Hi-Lo Ambulance Siren (Square modulations)
        this.osc1.type = 'sawtooth';
        this.osc2.type = 'triangle';
        this.osc1.frequency.setValueAtTime(750, this.ctx.currentTime);
        this.osc2.frequency.setValueAtTime(755, this.ctx.currentTime);

        this.lfo.type = 'square'; // sharp toggling between frequencies
        this.lfo.frequency.setValueAtTime(1.8, this.ctx.currentTime); // 1.8 Hz toggle rate
        this.lfoGain.gain.setValueAtTime(180, this.ctx.currentTime); // alternating +/- 180 Hz
      } else if (type === 'Bencana') {
        // Low and terrifying pulsing Air Raid warning drone
        this.osc1.type = 'sawtooth';
        this.osc2.type = 'sawtooth';
        this.osc1.frequency.setValueAtTime(280, this.ctx.currentTime);
        this.osc2.frequency.setValueAtTime(140, this.ctx.currentTime); // heavy octaves

        this.lfo.type = 'sine';
        this.lfo.frequency.setValueAtTime(0.5, this.ctx.currentTime); // deep slow pulse
        this.lfoGain.gain.setValueAtTime(110, this.ctx.currentTime);
      } else {
        // High pitched test warning chime
        this.osc1.type = 'sine';
        this.osc2.type = 'sine';
        this.osc1.frequency.setValueAtTime(880, this.ctx.currentTime);
        this.osc2.frequency.setValueAtTime(440, this.ctx.currentTime);

        this.lfo.type = 'sine';
        this.lfo.frequency.setValueAtTime(7.0, this.ctx.currentTime); // light vibrato
        this.lfoGain.gain.setValueAtTime(35, this.ctx.currentTime);
      }

      this.lfo.start();
      this.osc1.start();
      this.osc2.start();
      this.isPlaying = true;
    } catch (e) {
      console.warn("Web Audio API warning or muted gesture policy:", e);
    }
  }

  tickTone(progress: number) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const tCtx = new AudioContextClass();
      const osc = tCtx.createOscillator();
      const clickGain = tCtx.createGain();
      
      osc.type = 'sine';
      const targetFreq = 400 + (progress * 6);
      osc.frequency.setValueAtTime(targetFreq, tCtx.currentTime);
      
      // Increased progress feedback volume from 0.12 to 0.35 to sound solid and mechanical
      clickGain.gain.setValueAtTime(0.35, tCtx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.01, tCtx.currentTime + 0.1);
      
      osc.connect(clickGain);
      clickGain.connect(tCtx.destination);
      osc.start();
      osc.stop(tCtx.currentTime + 0.12);
    } catch (e) {}
  }

  stop() {
    this.isPlaying = false;
    try {
      if (this.lfo) {
        this.lfo.stop();
        this.lfo = null;
      }
      if (this.osc1) {
        this.osc1.stop();
        this.osc1 = null;
      }
      if (this.osc2) {
        this.osc2.stop();
        this.osc2 = null;
      }
      if (this.ctx) {
        this.ctx.close();
        this.ctx = null;
      }
    } catch (e) {}
  }
}

const sirenSynth = new DynamicEmergencySiren();

export function PanicButton({ houses = [] }: { houses?: House[] }) {
  const [alert, setAlert] = useState<{ 
    message: string; 
    sender: string; 
    timestamp: string; 
    location?: string;
    category?: string;
    locationCoords?: { x: number; y: number } 
  } | null>(null);
  
  const [activeAlerts, setActiveAlerts] = useState<PanicAlert[]>([]);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [showIdentifyPrompt, setShowIdentifyPrompt] = useState(false);
  const [isOpenControlCenter, setIsOpenControlCenter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Keamanan');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number>(0);

  const residentHouseId = localStorage.getItem('resident_house_id');
  const isIdentified = !!residentHouseId;

  // Sync to active alerts
  useEffect(() => {
    const unsubscribe = subscribeToActivePanicAlerts((data) => {
      setActiveAlerts(data as PanicAlert[]);
      
      const myHouseId = localStorage.getItem('resident_house_id');
      const latestAlert = data[data.length - 1];
      
      if (latestAlert && latestAlert.houseId !== myHouseId && latestAlert.status === 'Active') {
        // Extract category if encoded in location string
        let displayCategory = 'Darurat';
        let rawLoc = latestAlert.location;
        
        if (latestAlert.location.includes('[Kebakaran')) {
          displayCategory = 'Kebakaran 🔥';
          rawLoc = latestAlert.location.split(' [')[0];
        } else if (latestAlert.location.includes('[Medis')) {
          displayCategory = 'Gawat Darurat Medis 🚑';
          rawLoc = latestAlert.location.split(' [')[0];
        } else if (latestAlert.location.includes('[Keamanan')) {
          displayCategory = 'Keamanan Terancam 🚨';
          rawLoc = latestAlert.location.split(' [')[0];
        } else if (latestAlert.location.includes('[Bencana')) {
          displayCategory = 'Bencana Alam/Publik 🌊';
          rawLoc = latestAlert.location.split(' [')[0];
        } else if (latestAlert.location.includes('[Simulasi')) {
          displayCategory = 'Uji Simulasi Keamanan 🔔';
          rawLoc = latestAlert.location.split(' [')[0];
        }

        setAlert({
          message: `🚨 ${displayCategory}\nSegera cek lokasi demi kepedulian warga!`,
          sender: latestAlert.residentName,
          timestamp: latestAlert.timestamp,
          location: rawLoc,
          category: displayCategory,
          locationCoords: latestAlert.locationCoords
        });

        // Trigger synth if not muted
        if (!isMuted) {
          sirenSynth.stop();
          const cleanCatId = latestAlert.location.includes('Kebakaran') ? 'Kebakaran' :
                           latestAlert.location.includes('Medis') ? 'Medis' :
                           latestAlert.location.includes('Bencana') ? 'Bencana' :
                           latestAlert.location.includes('Simulasi') ? 'Testing' : 'Keamanan';
          sirenSynth.start(cleanCatId);
        }
      }
    });

    // Check GPS capability on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        null,
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    return () => {
      sirenSynth.stop();
      unsubscribe();
    };
  }, [isMuted]);

  const myActiveAlert = activeAlerts.find(a => a.houseId === residentHouseId);

  // Sound triggering helper
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute) {
      sirenSynth.stop();
    } else if (alert) {
      const cleanCatId = alert.category?.toLowerCase().includes('kebakaran') ? 'Kebakaran' :
                       alert.category?.toLowerCase().includes('medis') ? 'Medis' :
                       alert.category?.toLowerCase().includes('bencana') ? 'Bencana' :
                       alert.category?.toLowerCase().includes('simulasi') ? 'Testing' : 'Keamanan';
      sirenSynth.start(cleanCatId);
    }
  };

  const startHolding = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isIdentified) {
      setShowIdentifyPrompt(true);
      return;
    }
    
    setIsHolding(true);
    setHoldProgress(0);
    touchStartRef.current = Date.now();
    const duration = 2000; // 2 seconds

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - touchStartRef.current;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setHoldProgress(progress);

      // Play soft high-end charging-up tones to give a tactical hardware feel
      if (Math.floor(progress) % 15 === 0) {
        sirenSynth.tickTone(progress);
      }

      if (elapsed >= duration) {
        triggerPanic();
        cancelHolding();
      }
    }, 45);
  };

  const cancelHolding = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
    }
  };

  const triggerPanic = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setGpsLocation(coords);
          sendPanicSignal(coords);
        },
        () => {
          sendPanicSignal();
        },
        { timeout: 4000 }
      );
    } else {
      sendPanicSignal();
    }
  };

  const sendPanicSignal = async (coords?: { lat: number; lng: number }) => {
    const houseId = residentHouseId || 'Unknown';
    const house = houses.find(h => h.id === houseId);
    
    const residentName = house ? house.headOfFamily : (localStorage.getItem('resident_name') || 'Warga');
    
    // Encode the chosen crisis category inside the location string for robust transit
    let categorySuffix = '[Keamanan 🚨]';
    if (selectedCategory === 'Kebakaran') categorySuffix = '[Kebakaran 🔥]';
    if (selectedCategory === 'Medis') categorySuffix = '[Medis 🚑]';
    if (selectedCategory === 'Bencana') categorySuffix = '[Bencana 🌊]';
    if (selectedCategory === 'Testing') categorySuffix = '[Simulasi 🔔]';

    const locationBase = house ? `Blok ${house.block}-${house.number}` : (localStorage.getItem('resident_location') || houseId);
    const encodedLocation = `${locationBase} ${categorySuffix}`;

    // Layout representation mapping coord
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
      const result = await sendPanicAlert(houseId, residentName, encodedLocation, locationCoords);
      
      if (result === true) {
        if (navigator.vibrate) {
          navigator.vibrate([500, 200, 500, 200, 500]);
        }

        setIsSent(true);
        if (!isMuted) {
          sirenSynth.stop();
          sirenSynth.start(selectedCategory);
        }
        
        toast.success("🔴 ALARM DARURAT AKTIF!", {
          description: `Kategori ${selectedCategory} berhasil disebarkan ke seluruh pengurus dan warga terdekat.`,
          duration: 4000
        });

        // Auto close control panel on success
        setIsOpenControlCenter(false);
        setTimeout(() => setIsSent(false), 5000);
      } else {
        toast.error(typeof result === 'string' ? result : "Gagal mengaktifkan sinyal darurat.");
      }
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, "panicAlerts");
      toast.error(`Kegagalan Sistem: ${error.message || 'Harap periksa sambungan internet.'}`);
    }
  };

  const closeAlertOverlay = () => {
    setAlert(null);
    sirenSynth.stop();
  };

  const handleCancelAlert = async () => {
    if (myActiveAlert) {
      await updatePanicAlertStatus(myActiveAlert.id, 'Cancelled');
      sirenSynth.stop();
      toast.success("Sinyal Darurat Dinonaktifkan oleh Anda.");
    }
  };

  // Neighborhood responder system
  const handleRespondToCrisis = async (alertId: string) => {
    setResolvingAlertId(alertId);
    try {
      await updatePanicAlertStatus(alertId, 'Responding');
      toast.success("Pemberitahuan Dikirim!", {
        description: "Warga yang tertimpa musibah telah diberitahu bahwa Anda sedang membantu menuju lokasi.",
        duration: 4000
      });
    } catch (e: any) {
      toast.error("Gagal mengirim persetujuan penolong.");
    } finally {
      setResolvingAlertId(null);
    }
  };

  // Emergency Categories Definition
  const CATEGORIES = [
    { id: 'Keamanan', title: 'Keamanan 🚨', sub: 'Maling / Kriminal', color: 'rose', icon: ShieldAlert, desc: 'Ancaman kejahatan, pencurian, atau intimidasi fisik di dekat rumah.' },
    { id: 'Kebakaran', title: 'Kebakaran 🔥', sub: 'Asap / Korsleting', color: 'orange', icon: Flame, desc: 'Lidah api berkobar, korslet listrik berbau gosong, atau tabung gas bocor.' },
    { id: 'Medis', title: 'Medis Darurat 🚑', sub: 'Critical Health', color: 'blue', icon: Activity, desc: 'Serangan jantung, sesak napas berat, ibu melahirkan, atau kecelakaan fatal.' },
    { id: 'Bencana', title: 'Bencana Alam 🌊', sub: 'Banjir / Gempa', color: 'teal', icon: CloudLightning, desc: 'Banjir bandang, pohon tumbang menimpa atap, kabel sutet terputus.' },
    { id: 'Testing', title: 'Simulasi Keamanan 🔔', sub: 'Tes Fungsi', color: 'slate', icon: Bell, desc: 'Hanya uji fungsi respons asisten & tombol tanpa menyiagakan warga luas.' },
  ];

  return (
    <>
      {/* Floating Panic Widget Launcher */}
      <div id="smart-panic-launcher" className="fixed bottom-24 left-4 md:bottom-8 md:sideline-adjust md:left-8 z-50 flex flex-col items-center gap-3">
        
        {/* Glowing Status badge for incoming alarms */}
        <AnimatePresence>
          {activeAlerts.filter(a => a.status === 'Active' && a.houseId !== residentHouseId).length > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 10 }}
              onClick={() => {
                const latest = activeAlerts[activeAlerts.length - 1];
                if (latest) {
                  setAlert({
                    message: `🚨 Bahaya Aktif!\nWarga butuh pertolongan darurat.`,
                    sender: latest.residentName,
                    timestamp: latest.timestamp,
                    location: latest.location,
                    category: latest.location.includes('[Kebakaran') ? 'Kebakaran 🔥' :
                              latest.location.includes('[Medis') ? 'Gawat Medis 🚑' :
                              latest.location.includes('[Bencana') ? 'Bencana Alam 🌊' : 'Keamanan 🚨',
                    locationCoords: latest.locationCoords
                  });
                }
              }}
              className="bg-rose-600 text-white border-2 border-rose-400 py-1.5 px-3 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer invite-siren-animation"
            >
              <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
              {activeAlerts.filter(a => a.status === 'Active').length} ALARM WARGA AKTIF!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Identity Missing Prompt Alert Card */}
        <AnimatePresence>
          {showIdentifyPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.92 }}
              className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-72 text-center relative overflow-hidden backdrop-blur-xl"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-rose-600"></div>
              <div className="bg-red-500/10 text-red-400 p-2.5 rounded-xl w-fit mx-auto mb-3 border border-red-500/25">
                <Lock size={22} className="animate-pulse" />
              </div>
              <h4 className="text-sm font-extrabold text-white uppercase tracking-tight mb-1.5">Akses Sinyal Terkunci</h4>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-4 px-1">
                Demi mencegah laporan fiktif (fake alert), Anda harus teridentifikasi sebagai warga terdaftar terlebih dahulu.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setShowIdentifyPrompt(false)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase rounded-xl transition-all"
                >
                  Tutup
                </button>
                <a 
                  href="#/resident"
                  onClick={() => setShowIdentifyPrompt(false)}
                  className="py-2.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 border border-red-400/25"
                >
                  Identifikasi
                </a>
              </div>
            </motion.div>
          )}

          {/* Sinyal Send Control/Cancel Floating Alert */}
          {myActiveAlert && (
            <motion.div 
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              className="flex flex-col items-center gap-1.5 bg-slate-950/95 border border-red-900/30 p-2.5 rounded-2xl shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full text-[9px] font-extrabold uppercase tracking-widest text-white shadow-sm duration-500 animate-pulse">
                Sinyal Anda Aktif!
              </div>
              <button 
                onClick={handleCancelAlert}
                className="bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-900/20 text-[9px] font-black uppercase tracking-tight px-3 py-1 rounded-lg transition-all"
              >
                Matikan Alarm
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Master Panic Launcher Button */}
        <button
          onClick={() => {
            if (!isIdentified) {
              setShowIdentifyPrompt(true);
            } else {
              setIsOpenControlCenter(true);
            }
          }}
          className="relative group transition-transform active:scale-95 duration-200"
          id="btn-sos-floating"
        >
          {/* Pulsating emergency locator rings */}
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-15"></div>
          <div className="absolute -inset-2.5 rounded-full border border-red-600/30 animate-pulse"></div>

          <div className={`
            relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-4 border-slate-900/40 shadow-2xl transition-all duration-300
            ${isIdentified 
              ? 'bg-gradient-to-br from-red-500 via-red-600 to-rose-700 shadow-red-500/20 cursor-pointer' 
              : 'bg-slate-800 grayscale cursor-not-allowed border-slate-700'}
          `}>
            {isIdentified ? (
              <ShieldAlert size={28} className="text-white relative animate-pulse" />
            ) : (
              <Lock size={22} className="text-slate-400" />
            )}
          </div>

          <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/5">
            {isIdentified ? "SOS Darurat Warga" : "SOS Terkunci"}
          </span>
        </button>
      </div>

      {/* ==========================================
          MODERN EMERGENCY CONTROL HUB OVERLAY (MODAL)
          ========================================== */}
      <AnimatePresence>
        {isOpenControlCenter && (
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-slate-900/95 border border-slate-800 text-white rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Decorative Warning Header line */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-rose-500 animate-pulse"></div>

              {/* Close Button */}
              <button 
                onClick={() => setIsOpenControlCenter(false)}
                className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700/80 rounded-full text-slate-400 hover:text-white transition-all border border-slate-700/30"
              >
                <X size={18} />
              </button>

              <div className="p-6 md:p-8 space-y-6">
                
                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 text-rose-500 mb-1">
                    <Shield size={20} className="animate-spin" style={{ animationDuration: '4s' }} />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em]">Sistem Siaga Bencana Lingkungan</span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-white uppercase">Pusat Siaga SOS RT 02</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Pilih kategori bahaya di bawah, lalu tekan dan tahan tombol pemicu utama di bawah untuk menyiagakan lingkungan.
                  </p>
                </div>

                {/* Category Grid */}
                <div className="grid grid-cols-5 gap-2 md:gap-3">
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    
                    let bgActiveColor = 'bg-rose-500/10 border-rose-500 text-rose-400';
                    if (cat.color === 'orange') bgActiveColor = 'bg-orange-500/10 border-orange-500 text-orange-400';
                    if (cat.color === 'blue') bgActiveColor = 'bg-blue-500/10 border-blue-500 text-blue-400';
                    if (cat.color === 'teal') bgActiveColor = 'bg-teal-500/10 border-teal-500 text-teal-400';
                    if (cat.color === 'slate') bgActiveColor = 'bg-slate-700/15 border-slate-500 text-slate-300';

                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`
                          flex flex-col items-center justify-between p-2 pb-3 rounded-xl border text-center transition-all duration-300 group cursor-pointer
                          ${isSelected 
                            ? `${bgActiveColor} shadow-lg ring-1 ring-slate-800` 
                            : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'}
                        `}
                      >
                        <div className={`p-2 rounded-lg mb-2 ${isSelected ? 'bg-slate-900/60' : 'bg-slate-900/30 group-hover:bg-slate-900/50'}`}>
                          <CatIcon size={18} />
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                          <span className="text-[9px] font-extrabold tracking-tight block truncate uppercase leading-none">
                            {cat.id === 'Testing' ? 'Tes Uji' : cat.id}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Interactive category details card */}
                {selectedCategory && (
                  <motion.div 
                    layoutId="selected-category-desc"
                    className="p-4 bg-slate-800/40 border border-slate-800/90 rounded-2xl flex gap-3 items-start"
                  >
                    <div className="p-2 bg-slate-900/50 text-amber-500 rounded-xl">
                      <Info size={16} />
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-wider mb-0.5">Deskripsi Modul {selectedCategory === 'Testing' ? 'Simulasi' : 'Bahaya'}</h5>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                        {CATEGORIES.find(c => c.id === selectedCategory)?.desc}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Location Status & Signal Level */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">
                      GPS: {gpsLocation ? 'Terbaca Presisi' : 'Estimasi Alamat Rumah'}
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold text-slate-500 font-mono">
                    {localStorage.getItem('resident_location') || 'Blok C5 / Default'}
                  </span>
                </div>

                {/* BIG INTERACTIVE HARDWARE HOVER/HOLD BUTTON */}
                <div className="flex flex-col items-center justify-center py-4 relative">
                  
                  {/* Ripple overlay for holding */}
                  <AnimatePresence>
                    {isHolding && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.15, scale: 1.4 }}
                        exit={{ opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="absolute w-44 h-44 rounded-full bg-red-600 pointer-events-none"
                      />
                    )}
                  </AnimatePresence>

                  <button
                    onMouseDown={(e) => startHolding(e)}
                    onMouseUp={cancelHolding}
                    onMouseLeave={cancelHolding}
                    onTouchStart={(e) => startHolding(e)}
                    onTouchEnd={cancelHolding}
                    className="relative w-36 h-36 rounded-full flex items-center justify-center group overflow-hidden border-4 border-slate-800 select-none cursor-pointer"
                  >
                    {/* Background Progress circular mask */}
                    <div 
                      className="absolute inset-0 bg-red-600 origin-bottom transition-transform duration-75"
                      style={{ 
                        transform: `scaleY(${holdProgress / 100})`, 
                        opacity: isHolding ? 0.95 : 0.4,
                        transition: 'transform 0.05s ease-out'
                      }}
                    />

                    {/* Button Body Overlay */}
                    <div className="absolute inset-2 rounded-full bg-slate-950 flex flex-col items-center justify-center p-3 text-center border-2 border-slate-800 group-hover:border-slate-700/80 transition-colors">
                      {isHolding ? (
                        <>
                          <span className="text-xl font-black text-white font-mono animate-bounce">{Math.floor(holdProgress)}%</span>
                          <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider mt-1 leading-none">TAHAN TERUS</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={36} className="text-red-500 mb-1 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-[9px] font-black text-white uppercase tracking-tight leading-none">SOS DARURAT</span>
                          <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider mt-1">HOLD 2 DETIK</span>
                        </>
                      )}
                    </div>
                  </button>

                  {/* Extra assist info */}
                  <span className="mt-3 text-[10px] text-slate-500 font-extrabold text-center uppercase tracking-widest block h-4">
                    {isHolding ? 'Mengirim Sinyal Peringatan Sipil...' : 'Konfirmasi Fisik Diperlukan'}
                  </span>
                </div>

                {/* Emergency Hotline fast dial contacts */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Telepon Hotline Cepat</span>
                  <div className="grid grid-cols-3 gap-2">
                    <a 
                      href="tel:+6282123456789"
                      className="p-2.5 bg-slate-800/30 border border-slate-850 hover:bg-slate-800 rounded-xl flex items-center gap-2 group transition-all"
                    >
                      <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg group-hover:bg-rose-500 group-hover:text-white transition-all">
                        <PhoneCall size={12} />
                      </div>
                      <div className="text-left overflow-hidden">
                        <span className="text-[9px] font-bold text-slate-300 block">Pos Satpam</span>
                        <span className="text-[8px] text-slate-500 font-medium block truncate">Siaga 24 Jam</span>
                      </div>
                    </a>
                    <a 
                      href="tel:113"
                      className="p-2.5 bg-slate-800/30 border border-slate-850 hover:bg-slate-800 rounded-xl flex items-center gap-2 group transition-all"
                    >
                      <div className="p-1.5 bg-orange-500/10 text-orange-400 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-all">
                        <Flame size={12} />
                      </div>
                      <div className="text-left overflow-hidden">
                        <span className="text-[9px] font-bold text-slate-300 block">Pemadam</span>
                        <span className="text-[8px] text-slate-500 font-medium block truncate">Damkar Sipil</span>
                      </div>
                    </a>
                    <a 
                      href="tel:118"
                      className="p-2.5 bg-slate-800/30 border border-slate-850 hover:bg-slate-800 rounded-xl flex items-center gap-2 group transition-all"
                    >
                      <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <Activity size={12} />
                      </div>
                      <div className="text-left overflow-hidden">
                        <span className="text-[9px] font-bold text-slate-300 block">Ambulans</span>
                        <span className="text-[8px] text-slate-500 font-medium block truncate">Layanan IG</span>
                      </div>
                    </a>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          IMMERSIVE CRISIS OVERLAY (INCOMING EMERGENCY ALERT HUD FROM NEIGHBORS)
          ========================================== */}
      <AnimatePresence>
        {alert && (
          <motion.div 
            key="immersive-danger-hud"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-red-950/95 backdrop-blur-md"
          >
            {/* Ambient Red Strobe flash background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/25 to-transparent animate-pulse pointer-events-none"></div>

            {/* Simulated flashing response bar on top/bottom edges of screen to capture attention */}
            <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-red-600 via-blue-600 to-red-600 animate-pulse flex border-b border-white/10 overflow-hidden">
              <div className="w-1/2 bg-red-600 animate-ping"></div>
              <div className="w-1/2 bg-blue-600 animate-ping" style={{ animationDelay: '0.3s' }}></div>
            </div>

            <motion.div 
              initial={{ scale: 0.92, y: 25 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 25 }}
              className="w-full max-w-lg bg-slate-900 border-4 border-red-600 rounded-[2.5rem] shadow-[0_0_120px_rgba(239,68,68,0.6)] overflow-hidden"
            >
              
              {/* Header inside modal */}
              <div className="bg-gradient-to-b from-red-600 to-rose-700 p-7 text-white text-center relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="bg-white text-red-600 p-3 rounded-2xl mb-4 shadow-xl animate-bounce">
                    <ShieldAlert size={36} className="animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight uppercase">ALARM AKTIF TERPANCAR!</h2>
                  <div className="mt-1 flex items-center gap-2 px-3 py-1 bg-black/35 rounded-full text-[9px] font-black uppercase tracking-widest text-red-300">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping"></span>
                    Darurat Sipil Real-Time
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 space-y-5 text-white">
                
                {/* Visual Details Cards */}
                <div className="space-y-3">
                  
                  {/* Category description row */}
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-red-900/20 flex gap-3.5 items-start">
                    <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 shadow-inner">
                      <AlertTriangle size={22} className="animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-0.5">Jenis Kejadian Terlapor</span>
                      <p className="text-base font-extrabold text-white leading-tight">
                        {alert.category || 'Insiden Keamanan'}
                      </p>
                    </div>
                  </div>

                  {/* Responder Info details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Identitas Korban</span>
                      <p className="font-extrabold text-slate-200 text-sm leading-tight">
                        {alert.sender || 'Warga Terdaftar'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Waktu Kejadian</span>
                      <p className="font-extrabold text-slate-200 text-sm leading-tight">
                        {alert.timestamp 
                          ? new Date(alert.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                          : new Date().toLocaleTimeString('id-ID')} WITA
                      </p>
                    </div>
                  </div>

                  {/* Location display in high contrast details card */}
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <MapPin size={12} className="text-red-500 animate-bounce" /> Titik Lokasi Hunian
                      </span>
                      <span className="font-bold text-slate-300 font-mono text-[10px]">
                        {alert.location || 'Posisi Warga'}
                      </span>
                    </div>

                    {/* Google Maps Assist Guide */}
                    {gpsLocation ? (
                      <a 
                        href={`https://www.google.com/maps?q=${gpsLocation.lat},${gpsLocation.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800/80 transition-colors group cursor-pointer"
                      >
                        <span className="text-[10px] font-black text-rose-400 underline underline-offset-4 tracking-tighter group-hover:text-rose-300 transition-colors">
                          Pandu Jalan (GPS Google Maps)
                        </span>
                        <div className="p-2 bg-red-600 text-white rounded-lg group-hover:bg-red-500 transition-colors">
                          <Compass size={14} />
                        </div>
                      </a>
                    ) : (
                      <div className="text-[10px] text-slate-400 border-t border-slate-900 pt-2 flex items-center gap-1.5 leading-relaxed">
                        <Info size={12} className="text-slate-500 shrink-0" />
                        <span>Lokasi dapat dicari langsung pada Peta Interaktif halaman depan (Blok Terdaftar)</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Response / Responder Action Matrix */}
                <div className="space-y-2.5">
                  <div className="flex gap-2">
                    {/* Toggle mute of police synth siren */}
                    <button 
                      onClick={handleToggleMute}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer ${isMuted ? 'bg-slate-800 text-slate-400 border border-slate-700/60' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      {isMuted ? 'Bungkam Sirine' : 'Bunyi sirine'}
                    </button>

                    {/* Neighborhood coordination response button */}
                    {activeAlerts.find(a => a.status === 'Active' && a.houseId !== residentHouseId) && (
                      <button
                        onClick={() => handleRespondToCrisis(activeAlerts.find(a => a.status === 'Active' && a.houseId !== residentHouseId)!.id)}
                        disabled={resolvingAlertId !== null}
                        className="flex-[2] bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {resolvingAlertId ? (
                          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Saya Menuju Lokasi!
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={closeAlertOverlay}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X size={14} /> Close Dashboard
                  </button>
                </div>

                <p className="text-center text-[9px] font-semibold text-slate-500 uppercase tracking-widest leading-relaxed">
                  Utamakan keselamatan jiwa Anda sendiri sebelum memberikan bantuan fisik.
                </p>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
