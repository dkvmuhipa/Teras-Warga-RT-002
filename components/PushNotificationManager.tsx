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

    return () => unsubscribe();
  }, [userId]);

  const requestPermission = async () => {
    if (!messaging) {
      toast.error('Browser ini tidak mendukung notifikasi push.');
      return;
    }

    try {
      const status = await Notification.requestPermission();
      setPermission(status);

      if (status === 'granted') {
        // Get FCM Token
        // NOTE: Replace with your actual VAPID key from Firebase Console
        const token = await getToken(messaging, {
          vapidKey: 'BNSRlNOcVZgnWv9VtH-tqMT5bA-oF6iHnvQYsBsrUAByoNAcE0DL7QwQ6MImWMtnZ6oFlWLJ7svp4pIJREUbi0U' 
        });

        if (token) {
          await saveFCMToken(userId, token);
          setIsTokenSaved(true);
          toast.success('Notifikasi push berhasil diaktifkan!');
        } else {
          console.warn('No registration token available. Request permission to generate one.');
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Gagal mengaktifkan notifikasi.');
    }
  };

  if (permission === 'granted' && isTokenSaved) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[60] animate-bounce">
      <button
        onClick={requestPermission}
        className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-full shadow-xl hover:bg-rose-700 transition-all border-2 border-white"
      >
        {permission === 'denied' ? (
          <>
            <BellOff size={18} />
            <span className="text-xs font-bold">Aktifkan Notifikasi</span>
          </>
        ) : (
          <>
            <Bell size={18} />
            <span className="text-xs font-bold">Aktifkan Notifikasi Darurat</span>
          </>
        )}
      </button>
    </div>
  );
};
