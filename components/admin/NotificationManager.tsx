import React from 'react';
import { AppNotification } from '../../types';
import { Bell, Info, AlertCircle, CheckCircle } from 'lucide-react';

interface NotificationManagerProps {
  notifications: AppNotification[];
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ notifications }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-2xl text-slate-800">Manajemen Notifikasi</h2>
        <p className="text-sm text-slate-500">{notifications.length} Notifikasi Terkirim</p>
      </div>
      
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {notifications.length > 0 ? (
            notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((n) => (
              <div key={n.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <div className={`p-3 rounded-2xl ${n.type === 'Alert' ? 'bg-rose-50 text-rose-600' : n.type === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {n.type === 'Alert' ? <AlertCircle size={20} /> : n.type === 'Success' ? <CheckCircle size={20} /> : <Info size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800">{n.title}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(n.date).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 italic">Belum ada notifikasi.</div>
          )}
        </div>
      </div>
    </div>
  );
};
