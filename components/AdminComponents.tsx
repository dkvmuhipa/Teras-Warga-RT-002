import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, Loader2, AlertCircle, ArrowLeft, Info, Key, CheckCircle2, ShieldAlert, HelpCircle } from 'lucide-react';
import { loginAdmin } from '../services/databaseService';
import { isFirebaseConfigured } from '../services/firebaseConfig';

interface AdminLoginProps {
  onLogin: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ message: string; type: 'error' | 'warning' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Clear error after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      setError({ message: 'Sistem Autentikasi (Firebase) belum terkonfigurasi di browser ini.', type: 'error' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginAdmin(email, password);
      onLogin(); 
    } catch (err: any) {
      console.error("Auth Error Debug:", err.code);
      
      // Handle modern Firebase error codes
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError({ 
          message: 'Kombinasi Email atau Password salah. Pastikan akun Ketua RT sudah didaftarkan di Konsol Firebase oleh Pengembang.', 
          type: 'error' 
        });
      } else if (err.code === 'auth/too-many-requests') {
        setError({ 
          message: 'Terlalu banyak percobaan. Akun Anda diblokir sementara demi keamanan. Silakan tunggu 1-2 menit.', 
          type: 'warning' 
        });
      } else if (err.code === 'auth/network-request-failed') {
        setError({ 
          message: 'Gagal menghubungi server. Periksa koneksi internet Anda.', 
          type: 'error' 
        });
      } else {
        setError({ 
          message: `Kendala Sistem: ${err.message}`, 
          type: 'error' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4 font-sans selection:bg-slate-900 selection:text-white">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex p-4 bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 mb-6 group hover:scale-105 transition-all duration-500">
            <div className="bg-slate-900 text-white p-4 rounded-[1.5rem] shadow-lg shadow-slate-900/20 group-hover:rotate-12 transition-transform">
              <Shield size={36} strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Portal Administrasi</h1>
          <p className="text-slate-500 text-sm font-medium">Khusus Pengurus RT 002 RW 020</p>
          
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isFirebaseConfigured ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isFirebaseConfigured ? 'System Secure & Online' : 'System Disconnected'}
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(15,23,42,0.12)] border border-white relative overflow-hidden animate-slide-up">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2.5 ml-1">Alamat Email Resmi</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 transition-all text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium" 
                  placeholder="rt002@huntaptondo.id" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2.5 ml-1">Kunci Akses (Password)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 transition-all text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  {showPassword ? <Info size={20} /> : <Key size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className={`flex items-start gap-3 p-4 rounded-2xl animate-fade-in border-2 ${
                error.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-amber-50 border-amber-100 text-amber-700'
              }`}>
                {error.type === 'error' ? <ShieldAlert size={20} className="shrink-0 mt-0.5" /> : <Info size={20} className="shrink-0 mt-0.5" />}
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-black leading-relaxed">{error.message}</p>
                  <button 
                    type="button"
                    onClick={() => setShowHelp(true)}
                    className="text-[10px] font-bold underline text-left opacity-80 hover:opacity-100"
                  >
                    Bantuan Akses Akun
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-slate-900 text-white font-black py-4.5 rounded-2xl hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group relative h-[56px]"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span className="tracking-tight">Otentikasi...</span>
                </>
              ) : (
                <>
                  <span className="tracking-tight">Buka Dashboard</span>
                  <ArrowLeft size={20} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Help Overlay */}
          {showHelp && (
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md p-8 flex flex-col justify-center text-white z-20 animate-fade-in">
              <div className="bg-blue-500/20 p-3 rounded-2xl w-fit mb-4">
                <HelpCircle size={28} className="text-blue-400" />
              </div>
              <h4 className="text-lg font-black mb-3">Butuh Bantuan Masuk?</h4>
              <ul className="text-xs space-y-3 font-medium text-slate-300">
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0"></div>
                  Akun Admin tidak dibuat melalui form registrasi umum.
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0"></div>
                  Hanya email yang telah didaftarkan oleh Sistem Developer di Firebase Auth yang dapat masuk.
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0"></div>
                  Jika Anda Ketua RT yang sah dan belum memiliki akun, hubungi Tim IT Terpadu untuk pembuatan kredensial.
                </li>
              </ul>
              <button 
                onClick={() => setShowHelp(false)}
                className="mt-8 bg-white text-slate-900 font-black py-3 rounded-xl hover:bg-slate-100 transition-all text-sm"
              >
                Saya Mengerti
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End-to-End Encryption Enabled</p>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-all hover:gap-3"
          >
            <ArrowLeft size={18} /> 
            Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
};

interface AdminRouteWrapperProps {
  isAdmin: boolean;
  children: React.ReactNode;
  onLogin: () => void;
}

export const AdminRouteWrapper: React.FC<AdminRouteWrapperProps> = ({ isAdmin, children, onLogin }) => {
  if (!isAdmin) {
    return <AdminLogin onLogin={onLogin} />;
  }
  return <>{children}</>;
};