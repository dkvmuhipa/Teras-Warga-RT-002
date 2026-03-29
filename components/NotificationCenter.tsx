import React, { useState, useRef, useEffect } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import { AppNotification } from '../types';
import { NotificationToggle } from './PushNotificationManager';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onMarkRead, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={toggleOpen} className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in origin-top-right">
          <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h4 className="font-bold text-sm text-slate-800">Notifikasi</h4>
            <div className="flex items-center gap-2">
              <NotificationToggle userId={localStorage.getItem('resident_house_id') || 'guest_user'} variant="compact" />
              {unreadCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full">{unreadCount} Baru</span>}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? notifications.map(n => (
              <div key={n.id} onClick={() => onMarkRead(n.id)} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${n.isRead ? 'opacity-60' : 'bg-blue-50/30'}`}>
                <div className="flex gap-3">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === 'Alert' ? 'bg-rose-500' : n.type === 'Success' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h5 className={`text-xs font-bold ${n.isRead ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</h5>
                      {onDelete && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(n.id);
                          }}
                          className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-2">{new Date(n.date).toLocaleDateString()} • {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                Belum ada notifikasi.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
