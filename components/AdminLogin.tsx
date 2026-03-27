import React, { useState } from 'react';
import { Shield, Lock, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/firebaseConfig';
import { Button } from './ui/Button';
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
      setError('Login gagal. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-50 mb-4">
            <Logo showText={true} imageSize="h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Admin Portal</h1>
          <p className="text-slate-500 text-sm font-medium">Masuk untuk mengelola data RT 02</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold mb-6 text-center border border-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Email Admin</label>
            <input
              type="email"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <input
                type="password"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>
          <Button type="submit" className="w-full py-3.5 mt-2" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Masuk Dashboard'}
          </Button>
        </form>
        
        <p className="text-center text-[10px] text-slate-400 mt-8 font-bold uppercase tracking-widest">
          Sistem Informasi Digital RT 02
        </p>
      </div>
    </div>
  );
};
