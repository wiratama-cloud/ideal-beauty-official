'use client';

import { useState, useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { getMessagingInstance, isFirebaseConfigured } from '@/lib/firebase/client';
import { saveFcmTokenAction } from '@/app/actions/auth';

export default function FcmNotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isFirebaseConfigured) return;

    try {
      const messaging = await getMessagingInstance();
      if (!messaging) return;

      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        // Register SW manually with config
        const configParams = new URLSearchParams({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
        }).toString();
        
        const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${configParams}`);
        
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });
        
        if (token) {
          await saveFcmTokenAction(token);
          setEnabled(true);
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  if (!isFirebaseConfigured || permission !== 'default' || enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 shadow-lg rounded-lg border border-neutral-200 z-50">
      <p className="mb-2">Enable notifications to stay updated on your order status.</p>
      <button
        onClick={requestPermission}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Enable Notifications
      </button>
    </div>
  );
}
