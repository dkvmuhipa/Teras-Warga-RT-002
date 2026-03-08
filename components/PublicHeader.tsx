import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import { RT_NAME } from '../constants';
import { Button } from './ui/Button';
import { NotificationCenter } from './NotificationCenter';
import { MobileBottomNav } from './MobileBottomNav';
import { AppNotification } from '../types';

interface PublicHeaderProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ notifications, onMarkRead }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:text-blue-600";
  
  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer font-black text-xl text-slate-800" onClick={() => navigate('/')}>TERAS {RT_NAME}</div>
            <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center space-x-1 mr-4">
                  <button onClick={() => navigate('/')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/')}`}>Beranda</button>
                  <button onClick={() => navigate('/voting')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/voting')}`}>E-Voting</button>
                  <button onClick={() => navigate('/market')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/market')}`}>Pasar Warga</button>
                  <button onClick={() => navigate('/services')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/services')}`}>Layanan</button>
                  <button onClick={() => navigate('/dokumen')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/dokumen')}`}>Dokumen</button>
                  <button onClick={() => navigate('/umkm')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/umkm')}`}>UMKM</button>
                  <button onClick={() => navigate('/info')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/info')}`}>Info RT</button>
                </div>
                
                <NotificationCenter notifications={notifications} onMarkRead={onMarkRead} />

                <div className="hidden md:block h-6 w-px bg-slate-200 mx-2"></div>
                <Button onClick={() => navigate('/admin')} variant="secondary" className="hidden md:flex ml-2 text-xs h-9">Login Admin</Button>
            </div>
            <div className="flex items-center md:hidden gap-2">
               <button onClick={() => navigate('/admin')} className="p-2 text-slate-400 hover:text-blue-600"><User size={20}/></button>
            </div>
          </div>
        </div>
      </nav>
      <MobileBottomNav />
    </>
  );
};
