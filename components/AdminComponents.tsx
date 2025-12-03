import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      onLogin();
    } else {
      setError('Password salah! (Hint: admin123)');
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
          <p className="text-slate-500 text-sm">Masuk untuk mengelola data warga RT 002.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Password Admin</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all" 
                placeholder="Masukkan password..." 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-rose-500 text-xs font-bold text-center bg-rose-50 py-2 rounded-lg">{error}</p>}
          <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 active:scale-95 transition-all shadow-lg shadow-slate-200">
            Masuk Dashboard
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