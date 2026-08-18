'use client';

import { useState, useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { Bell, Loader2, X, Share, PlusSquare, Smartphone, Sparkles } from 'lucide-react';
import { getMessagingInstance, isFirebaseConfigured } from '@/lib/firebase/client';
import { saveFcmTokenAction } from '@/app/actions/auth';
import { isIos, isStandalone, isNotificationSupported, getIosBrowserType } from '@/lib/utils/pwa';

export const FCM_PROMPT_DISMISSED_KEY = 'fcm_prompt_dismissed';

interface FcmNotificationPromptProps {
  isLoggedIn?: boolean;
}

export default function FcmNotificationPrompt({ isLoggedIn = false }: FcmNotificationPromptProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [enabled, setEnabled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isIosBrowser, setIsIosBrowser] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [iosBrowserTab, setIosBrowserTab] = useState<'safari' | 'chrome'>('safari');

  useEffect(() => {
    if (!isLoggedIn) return;

    if (typeof window !== 'undefined') {
      try {
        const isDismissed = localStorage.getItem(FCM_PROMPT_DISMISSED_KEY) === 'true';
        if (isDismissed) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setDismissed(true);
        }
      } catch {
        // Ignore localStorage errors
      }

      const ios = isIos();
      const standalone = isStandalone();
      const isIosTab = ios && !standalone;
      setIsIosBrowser(isIosTab);

      const browserType = getIosBrowserType();
      if (browserType === 'chrome') {
        setIosBrowserTab('chrome');
      } else {
        setIosBrowserTab('safari');
      }

      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    }
  }, [isLoggedIn]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowIosModal(false);
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

    if (isIosBrowser) {
      setShowIosModal(true);
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window) || !isNotificationSupported()) {
      return;
    }

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
    <>
      {/* Storefront Floating Prompt Banner */}
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
                {isIosBrowser
                  ? 'Add to Home Screen to get order status notifications on your iPhone.'
                  : 'Enable notifications to stay updated on your order status.'}
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
            <span>{isIosBrowser ? 'Instructions' : 'Enable'}</span>
          </button>
        </div>
      </div>

      {/* iOS PWA Installation Guide Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-neutral-900 text-white border border-neutral-800 max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif text-base font-medium text-white">
                  Add to Home Screen
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="text-neutral-400 hover:text-white p-1"
                aria-label="Close iOS guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed font-light">
              Apple iOS requires adding Ideal Beauty to your Home Screen to enable instant order status and shipment push notifications.
            </p>

            {/* Browser Selector */}
            <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3">
              <button
                type="button"
                onClick={() => setIosBrowserTab('safari')}
                className={`text-xs px-3 py-1.5 font-medium transition-all ${
                  iosBrowserTab === 'safari'
                    ? 'bg-amber-500 text-neutral-950 font-semibold'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                Safari on iPhone
              </button>
              <button
                type="button"
                onClick={() => setIosBrowserTab('chrome')}
                className={`text-xs px-3 py-1.5 font-medium transition-all ${
                  iosBrowserTab === 'chrome'
                    ? 'bg-amber-500 text-neutral-950 font-semibold'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                Chrome on iPhone
              </button>
            </div>

            {/* Steps */}
            {iosBrowserTab === 'safari' ? (
              <div className="space-y-2.5 text-xs">
                <div className="bg-neutral-800/80 p-3 border border-neutral-700/60 flex items-start space-x-3">
                  <div className="bg-neutral-700 p-1.5 rounded-sm text-amber-400 shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium text-neutral-200 block">1. Tap Share in Safari</span>
                    <span className="text-neutral-400 text-[11px] font-light">Tap the square Share icon in Safari&apos;s bottom toolbar.</span>
                  </div>
                </div>

                <div className="bg-neutral-800/80 p-3 border border-neutral-700/60 flex items-start space-x-3">
                  <div className="bg-neutral-700 p-1.5 rounded-sm text-amber-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium text-neutral-200 block">2. Add to Home Screen</span>
                    <span className="text-neutral-400 text-[11px] font-light">Scroll down the menu and choose &quot;Add to Home Screen&quot;.</span>
                  </div>
                </div>

                <div className="bg-neutral-800/80 p-3 border border-neutral-700/60 flex items-start space-x-3">
                  <div className="bg-neutral-700 p-1.5 rounded-sm text-amber-400 shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium text-neutral-200 block">3. Open from Home Screen</span>
                    <span className="text-neutral-400 text-[11px] font-light">Launch Ideal Beauty from your Home Screen to activate push alerts.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="bg-neutral-800/80 p-3 border border-neutral-700/60 flex items-start space-x-3">
                  <div className="bg-neutral-700 p-1.5 rounded-sm text-amber-400 shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium text-neutral-200 block">1. Tap Share in Chrome</span>
                    <span className="text-neutral-400 text-[11px] font-light">Tap the Share icon in the Chrome address bar or menu.</span>
                  </div>
                </div>

                <div className="bg-neutral-800/80 p-3 border border-neutral-700/60 flex items-start space-x-3">
                  <div className="bg-neutral-700 p-1.5 rounded-sm text-amber-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium text-neutral-200 block">2. Add to Home Screen</span>
                    <span className="text-neutral-400 text-[11px] font-light">Scroll down and tap &quot;Add to Home Screen&quot;.</span>
                  </div>
                </div>

                <div className="bg-neutral-800/80 p-3 border border-neutral-700/60 flex items-start space-x-3">
                  <div className="bg-neutral-700 p-1.5 rounded-sm text-amber-400 shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium text-neutral-200 block">3. Open from Home Screen</span>
                    <span className="text-neutral-400 text-[11px] font-light">Open the app icon from your Home Screen to enable notifications.</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
