'use client';

import { useState, useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { Bell, Loader2, X } from 'lucide-react';
import { getMessagingInstance, isFirebaseConfigured } from '@/lib/firebase/client';
import { saveFcmTokenAction } from '@/app/actions/auth';

export const FCM_PROMPT_DISMISSED_KEY = 'fcm_prompt_dismissed';

interface FcmNotificationPromptProps {
  isLoggedIn?: boolean;
}

export default function FcmNotificationPrompt({ isLoggedIn = false }: FcmNotificationPromptProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [enabled, setEnabled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    if (typeof window !== 'undefined') {
      try {
        const isDismissed = localStorage.getItem(FCM_PROMPT_DISMISSED_KEY) === 'true';
        if (isDismissed) {
          setDismissed(true);
        }
      } catch {
        // Ignore localStorage errors
      }

      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    }
  }, [isLoggedIn]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(FCM_PROMPT_DISMISSED_KEY, 'true');
      }
    } catch {
      // Ignore localStorage errors
    }
  };

  const requestPermission = async () => {
    if (!isFirebaseConfigured || isRequesting) return;

    setIsRequesting(true);
    try {
      const messaging = await getMessagingInstance();
      if (!messaging) return;

      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult === 'granted') {
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
    } finally {
      setIsRequesting(false);
    }
  };

  if (!isLoggedIn || !isFirebaseConfigured || permission !== 'default' || enabled || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm sm:w-full z-50 bg-white/95 backdrop-blur-md border border-neutral-200/80 shadow-xl shadow-black/5 rounded-2xl p-4 sm:p-5 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="bg-neutral-100 p-2.5 rounded-full shrink-0 text-neutral-800 flex items-center justify-center">
            <Bell className="w-5 h-5 text-neutral-800" />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-sm font-semibold text-neutral-900 leading-none mb-1.5">
              Stay Updated
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Enable notifications to stay updated on your order status.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss notification prompt"
          className="p-1 -mr-1 -mt-1 text-neutral-400 hover:text-neutral-700 transition-colors rounded-lg hover:bg-neutral-100 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2.5 pt-1">
        <button
          onClick={handleDismiss}
          disabled={isRequesting}
          className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100/80 disabled:opacity-50 min-h-[44px] flex items-center justify-center"
        >
          Later
        </button>
        <button
          onClick={requestPermission}
          disabled={isRequesting}
          className="px-5 py-2.5 text-sm font-medium text-white bg-black hover:bg-neutral-800 transition-colors rounded-lg flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 min-h-[44px]"
        >
          {isRequesting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Enable</span>
        </button>
      </div>
    </div>
  );
}
