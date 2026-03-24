import React, { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../services/firebaseConfig';
import { saveFCMToken } from '../services/databaseService';
import { Bell, BellOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface PushNotificationManagerProps {
  userId: string;
}

export const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({ userId }) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  const [isTokenSaved, setIsTokenSaved] = useState(false);

  useEffect(() => {
    if (!messaging || !userId) return;

    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      toast(payload.notification?.title || 'Notifikasi Baru', {
        description: payload.notification?.body,
        icon: <Bell className="text-rose-500" size={16} />,
        duration: 10000,
      });
    });

    // Check if we already have a token saved in this session/local storage
    const savedToken = localStorage.getItem(`fcm_token_saved_${userId}`);
    if (savedToken) setIsTokenSaved(true);

    return () => unsubscribe();
  }, [userId]);

  const requestPermission = async () => {
    if (!messaging) {
      toast.error('Browser ini tidak mendukung notifikasi push.');
      return;
    }

    try {
      // Check if in iframe
      if (window.self !== window.top) {
        toast.error('Notifikasi tidak bisa diaktifkan di dalam frame. Silakan buka aplikasi di tab baru (klik ikon panah di pojok kanan atas).', {
          duration: 6000
        });
        return;
      }

      const status = await Notification.requestPermission();
      setPermission(status);

      if (status === 'granted') {
        // Register service worker manually if needed, or ensure it's ready
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered with scope:', registration.scope);

        // Get FCM Token
        const token = await getToken(messaging, {
          vapidKey: 'BNSRlNOcVZgnWv9VtH-tqMT5bA-oF6iHnvQYsBsrUAByoNAcE0DL7QwQ6MImWMtnZ6oFlWLJ7svp4pIJREUbi0U',
          serviceWorkerRegistration: registration
        });

        if (token) {
          await saveFCMToken(userId, token);
          setIsTokenSaved(true);
          localStorage.setItem(`fcm_token_saved_${userId}`, 'true');
          toast.success('Notifikasi push berhasil diaktifkan!');
        } else {
          toast.error('Gagal mendapatkan token notifikasi.');
        }
      } else if (status === 'denied') {
        toast.error('Izin notifikasi ditolak. Silakan aktifkan melalui pengaturan browser Anda.');
      }
    } catch (error: any) {
      console.error('Error requesting notification permission:', error);
      toast.error(`Gagal mengaktifkan notifikasi: ${error.message || 'Error tidak diketahui'}`);
    }
  };

  // This component now only handles the logic and foreground messages
  // It doesn't render the floating button anymore
  return null;
};

export const NotificationToggle: React.FC<{ userId: string; variant?: 'compact' | 'full' }> = ({ userId, variant = 'full' }) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  
  const requestPermission = async () => {
    if (!messaging) return;
    
    if (window.self !== window.top) {
      toast.error('Buka aplikasi di tab baru untuk mengaktifkan notifikasi.');
      return;
    }

    const status = await Notification.requestPermission();
    setPermission(status);

    if (status === 'granted') {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const token = await getToken(messaging, {
          vapidKey: 'BNSRlNOcVZgnWv9VtH-tqMT5bA-oF6iHnvQYsBsrUAByoNAcE0DL7QwQ6MImWMtnZ6oFlWLJ7svp4pIJREUbi0U',
          serviceWorkerRegistration: registration
        });

        if (token) {
          await saveFCMToken(userId, token);
          localStorage.setItem(`fcm_token_saved_${userId}`, 'true');
          toast.success('Notifikasi aktif!');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (permission === 'granted') {
    return (
      <div className={`flex items-center gap-2 text-emerald-600 ${variant === 'compact' ? 'p-1' : 'p-3 bg-emerald-50 rounded-xl border border-emerald-100'}`}>
        <ShieldCheck size={variant === 'compact' ? 14 : 18} />
        <span className={`${variant === 'compact' ? 'text-[10px]' : 'text-xs'} font-bold uppercase tracking-widest`}>Notifikasi Aktif</span>
      </div>
    );
  }

  return (
    <button
      onClick={requestPermission}
      className={`flex items-center justify-center gap-2 transition-all ${
        variant === 'compact' 
        ? 'text-rose-500 hover:text-rose-600 p-1' 
        : 'w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-100'
      }`}
    >
      {permission === 'denied' ? <BellOff size={variant === 'compact' ? 14 : 18} /> : <Bell size={variant === 'compact' ? 14 : 18} />}
      <span className={`${variant === 'compact' ? 'text-[10px]' : 'text-xs'} font-black uppercase tracking-widest`}>
        {permission === 'denied' ? 'Izin Ditolak' : 'Aktifkan Notifikasi'}
      </span>
    </button>
  );
};
