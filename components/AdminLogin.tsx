import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  Loader2, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ShieldAlert, 
  HelpCircle, 
  CheckCircle2, 
  Info, 
  MessageSquare,
  FileCheck,
  TrendingUp,
  Users2,
  ExternalLink
} from 'lucide-react';
import { loginAdmin } from '../services/databaseService';
import { isFirebaseConfigured } from '../services/firebaseConfig';
import { ADMIN_TITLE, RT_NAME, Logo } from '../constants';
import { getWhatsAppLink } from '../services/whatsappService';

interface AdminLoginProps {
  onLogin: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<{ message: string; type: 'error' | 'warning' } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Auto-dismiss transient warnings after 8s
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      setError({ 
        message: 'Sistem Autentikasi (Firebase) belum terkonfigurasi pada peramban ini.', 
        type: 'error' 
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginAdmin(email, password);
      onLogin();
    } catch (err: any) {
      if (
        err?.code === 'auth/invalid-credential' || 
        err?.code === 'auth/wrong-password' || 
        err?.code === 'auth/user-not-found'
      ) {
        setError({
          message: `Kombinasi Email atau Password salah. Pastikan akun ${ADMIN_TITLE} telah didaftarkan di Firebase Authentication.`,
          type: 'error'
        });
      } else if (err?.code === 'auth/too-many-requests') {
        setError({
          message: 'Terlalu banyak percobaan gagal. Akses dibatasi sementara demi keamanan. Silakan tunggu 1-2 menit.',
          type: 'warning'
        });
      } else if (err?.code === 'auth/network-request-failed') {
        setError({
          message: 'Gagal menghubungi server otentikasi. Periksa koneksi internet Anda.',
          type: 'error'
        });
      } else {
        setError({
          message: err?.message || 'Akses ditolak. Silakan periksa kredensial Anda.',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const adminWaLink = getWhatsAppLink(
    '6285961194621',
    'Halo Ketua RT 02 / Super Admin, saya pengurus RT ingin konfirmasi atau meminta bantuan kredensial login Portal Admin.'
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 sm:p-6 lg:p-10 font-sans relative overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* Ambient Backdrop Highlights */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-indigo-100/40 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-5xl relative z-10">
        {/* Main Split-Screen Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[2.5rem] border border-slate-200/80 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.08)] overflow-hidden">
          
          {/* Left Hero Pane (Executive Branding) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
            {/* Ambient pattern inside dark pane */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

            {/* Top Logo & Status */}
            <div className="relative z-10">
              <div className="inline-flex p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 mb-6 shadow-inner">
                <Logo showText={true} imageSize="h-8 brightness-0 invert" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-[11px] font-bold uppercase tracking-wider mb-4">
                <Shield size={13} className="text-indigo-400" />
                <span>Portal Resmi Pengurus {RT_NAME}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                Pusat Kendali & Tata Kelola Siber
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm font-normal mt-2 leading-relaxed">
                Kelola data kependudukan, pembukuan kas lingkungan, verifikasi permohonan surat warga, dan koordinasi keamanan terintegrasi.
              </p>
            </div>

            {/* Middle Feature Highlights */}
            <div className="my-8 space-y-3 relative z-10">
              <div className="flex items-start gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">Transparansi Keuangan</h2>
                  <p className="text-[11px] text-slate-300 leading-snug">Pencatatan kas dan iuran otomatis dengan kwitansi digital ber-Kop resmi.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                  <FileCheck size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">Otomasi Surat Pengantar</h2>
                  <p className="text-[11px] text-slate-300 leading-snug">Penerbitan surat keterangan kelurahan dengan verifikasi barcode instan.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                  <Users2 size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">Sinergi Ronda & Warga</h2>
                  <p className="text-[11px] text-slate-300 leading-snug">Log patroli malam, koordinasi jadwal tukar ronda, dan aduan lingkungan.</p>
                </div>
              </div>
            </div>

            {/* Bottom Security Info */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300 relative z-10 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Enkripsi Firebase Auth</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">v2.5 Enterprise</span>
            </div>
          </div>

          {/* Right Form Pane (Authentication Card) */}
          <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-between relative bg-white">
            <div>
              {/* Header and Online Indicator */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Masuk Dasbor
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Verifikasi identitas pengurus untuk mengakses data warga.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-full shadow-2xs">
                  <span 
                    className={`w-2 h-2 rounded-full ${isFirebaseConfigured ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {isFirebaseConfigured ? 'Server Siap' : 'Terputus'}
                  </span>
                </div>
              </div>

              <form 
                onSubmit={handleLogin} 
                className="space-y-5"
                aria-label="Form Masuk Pengurus RT"
                noValidate={false}
              >
                {/* Email Field */}
                <div>
                  <label 
                    htmlFor="admin-email" 
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1"
                  >
                    Alamat Email Resmi Pengurus
                  </label>
                  <div className="relative group">
                    <div 
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none"
                      aria-hidden="true"
                    >
                      <Mail size={18} />
                    </div>
                    <input 
                      id="admin-email"
                      name="email"
                      type="email" 
                      autoComplete="username email"
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal" 
                      placeholder="contoh: pengurus@rt02.id" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
                    Gunakan alamat email resmi pengurus yang terdaftar pada sistem.
                  </p>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2 ml-1">
                    <label 
                      htmlFor="admin-password" 
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                    >
                      Kunci Akses (Password)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowHelp(true)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      Bantuan Akun?
                    </button>
                  </div>
                  <div className="relative group">
                    <div 
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none"
                      aria-hidden="true"
                    >
                      <Lock size={18} />
                    </div>
                    <input 
                      id="admin-password"
                      name="password"
                      type={showPassword ? "text" : "password"} 
                      autoComplete="current-password"
                      required
                      className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal font-mono" 
                      placeholder="Masukkan kata sandi pengurus" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
                    Kombinasi kata sandi rahasia yang diberikan oleh Administrator RT.
                  </p>
                </div>

                {/* Error Message Display */}
                {error && (
                  <div 
                    role="alert" 
                    aria-live="assertive"
                    className={`flex items-start gap-3 p-4 rounded-2xl border ${
                      error.type === 'error' 
                        ? 'bg-rose-50 border-rose-200 text-rose-700' 
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {error.type === 'error' ? (
                      <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                    ) : (
                      <Info size={18} className="shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-semibold leading-relaxed">{error.message}</p>
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <button 
                  type="submit" 
                  disabled={loading} 
                  aria-busy={loading}
                  className="w-full h-13 mt-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold rounded-2xl transition-all shadow-lg shadow-slate-900/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Mengautentikasi...</span>
                    </>
                  ) : (
                    <>
                      <span>Buka Dashboard Pengurus</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Help Overlay Modal */}
              {showHelp && (
                <div 
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="help-title"
                  className="absolute inset-0 bg-slate-900/95 backdrop-blur-md p-7 sm:p-10 flex flex-col justify-between text-white z-20 rounded-[2.5rem]"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                        <HelpCircle size={22} />
                      </div>
                      <div>
                        <h4 id="help-title" className="text-base font-bold text-white">Panduan Akses Pengurus</h4>
                        <p className="text-xs text-slate-400">Keamanan Akses Terpadu {RT_NAME}</p>
                      </div>
                    </div>

                    <ul className="text-xs space-y-3 text-slate-300 font-medium">
                      <li className="flex gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                        <span>Akun pengurus dikelola terpusat dan tidak melalui form registrasi umum.</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                        <span>Hanya email resmi pengurus yang terdaftar di Firebase Auth yang diizinkan masuk.</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                        <span>Bagi pengurus sah ({ADMIN_TITLE}) yang belum memiliki akun, silakan hubungi Ketua RT atau Super Admin Platform.</span>
                      </li>
                    </ul>

                    {adminWaLink && (
                      <div className="mt-5 pt-4 border-t border-slate-800">
                        <a
                          href={adminWaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <MessageSquare size={14} />
                          <span>Hubungi Ketua RT via WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <button 
                    type="button"
                    onClick={() => setShowHelp(false)}
                    className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl transition-colors text-xs uppercase tracking-wider cursor-pointer mt-4"
                  >
                    Tutup & Kembali
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Navigation & Bridge to Citizen Portal */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
              <div className="p-3 bg-indigo-50/60 border border-indigo-100/80 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Bukan pengurus RT?</span>
                <a 
                  href="#/" 
                  className="font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Portal Layanan Warga</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              <div className="text-center">
                <a 
                  href="#/" 
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft size={15} /> 
                  <span>Kembali ke Beranda Utama</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
