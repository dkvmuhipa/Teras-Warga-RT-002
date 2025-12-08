

import React, { useState } from 'react';
import { Shield, Lock, Mail, Loader2, Bell } from 'lucide-react';
import { loginAdmin, resolvePanicAlert } from '../services/databaseService';
import { PanicAlert } from '../types';

interface AdminLoginProps {
  onLogin: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginAdmin(email, password);
      onLogin(); // State update handled in App.tsx listener mostly, but this ensures flow
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('Email atau Password salah.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan. Coba lagi nanti.');
      } else {
        setError('Gagal login. Periksa koneksi internet.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-6">
          <div className="bg-slate-900 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-slate-300">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Login</h1>
          <p className="text-slate-500 text-sm">Masuk menggunakan akun Firebase Auth.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Email Admin</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all" 
                placeholder="admin@teras.id" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          {error && <p className="text-rose-500 text-xs font-bold text-center bg-rose-50 py-2 rounded-lg border border-rose-100">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 active:scale-95 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Masuk Dashboard'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-slate-400 hover:text-slate-600 font-medium">← Kembali ke Beranda</a>
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

export const PanicMonitor: React.FC<{ alerts: PanicAlert[] }> = ({ alerts }) => {
  const activeAlerts = alerts.filter(a => a.status === 'Active');
  
  if (activeAlerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-2 pointer-events-none">
      {activeAlerts.map(alert => (
        <div key={alert.id} className="pointer-events-auto bg-red-600 text-white p-4 rounded-xl shadow-2xl animate-pulse flex items-center justify-between gap-4 border-2 border-red-400">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full"><Bell size={24} className="animate-bounce"/></div>
            <div>
              <h4 className="font-bold text-lg leading-none">SINYAL DARURAT!</h4>
              <p className="text-xs font-medium opacity-90 mt-1">{alert.location}</p>
              <p className="text-[10px] opacity-75">{new Date(alert.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
          <button 
            onClick={() => resolvePanicAlert(alert.id)}
            className="bg-white text-red-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-50 shadow-sm"
          >
            SELESAI
          </button>
        </div>
      ))}
    </div>
  );
};
