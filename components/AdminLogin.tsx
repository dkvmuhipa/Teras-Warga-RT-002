import React, { useState } from 'react';
import { Shield, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/firebaseConfig';
import { motion } from 'motion/react';
import { Logo } from '../constants';

interface AdminLoginProps {
  onLogin: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err) {
      setError('Akses ditolak. Email atau password tidak valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-[20%] w-[350px] h-[350px] bg-indigo-600/10 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-emerald-500/5 blur-[130px] rounded-full" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="bg-slate-900/60 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-700/50">
          
          <div className="flex flex-col items-center text-center mb-10">
            <motion.div 
              initial={{ rotate: -10, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mb-6 p-4 bg-slate-800/50 rounded-3xl shadow-inner border border-slate-700/50 flex items-center justify-center shrink-0"
            >
               <Shield className="w-10 h-10 text-indigo-400" strokeWidth={1.5} />
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-2">Admin Portal</h1>
            <p className="text-slate-400 text-sm font-medium px-2">Area terbatas khusus pengurus. Silakan verifikasi identitas Anda.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/10 text-rose-400 p-4 rounded-2xl text-xs font-bold text-center border border-rose-500/20 flex items-center justify-center gap-2 mb-2"
              >
                <Shield size={14} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="email"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-2xl text-sm font-medium text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Email Pengurus"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="password"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-2xl text-sm font-medium text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Kata Sandi Keamanan"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading}
              className="w-full relative flex items-center justify-center gap-2 py-4 mt-6 bg-gradient-to-r from-indigo-500 hover:from-indigo-400 to-indigo-600 hover:to-indigo-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-500/25 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed group/btn overflow-hidden"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Otorisasi Masuk</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center flex flex-col items-center">
            <Logo showText={true} imageSize="h-6 opacity-30 grayscale mb-3 filter grayscale hover:grayscale-0 transition-all duration-300" />
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-1">
              Sistem Akses Residensial Terpadu
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
