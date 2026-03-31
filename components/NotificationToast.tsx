import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Bell, X } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationToastProps {
  notification: AppNotification;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(notification.title, { body: notification.message, icon: '/vite.svg' });
      } catch (e) { /* Browser notification failed */ }
    }
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  const bgColor = notification.type === 'Alert' ? 'bg-rose-50 border-rose-200' : notification.type === 'Success' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200';
  const textColor = notification.type === 'Alert' ? 'text-rose-800' : notification.type === 'Success' ? 'text-emerald-800' : 'text-slate-800';
  const Icon = notification.type === 'Alert' ? AlertTriangle : notification.type === 'Success' ? CheckCircle : Bell;

  return (
    <div className={`fixed top-4 right-4 z-[100] w-80 p-4 rounded-2xl shadow-2xl border flex items-start gap-3 animate-slide-in-right ${bgColor}`}>
      <div className={`p-2 rounded-full bg-white/50 shrink-0`}>
        <Icon size={18} className={textColor} />
      </div>
      <div className="flex-1">
        <h4 className={`font-bold text-sm ${textColor}`}>{notification.title}</h4>
        <p className={`text-xs mt-1 ${textColor} opacity-80 line-clamp-2`}>{notification.message}</p>
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
    </div>
  );
};
