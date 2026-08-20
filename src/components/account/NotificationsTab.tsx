'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getToken } from 'firebase/messaging';
import {
  Bell,
  BellOff,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Truck,
  CreditCard,
  Smartphone,
  Info,
  Share,
  PlusSquare,
  Sparkles,
  Laptop,
  Tablet,
  Globe,
  Trash2,
  Send,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { getMessagingInstance, isFirebaseConfigured } from '@/lib/firebase/client';
import {
  saveFcmTokenAction,
  deleteFcmTokenAction,
  getUserDevicesAction,
  revokeDeviceAction,
  revokeAllOtherDevicesAction,
  sendTestPushNotificationAction,
} from '@/app/actions/auth';
import { FCM_PROMPT_DISMISSED_KEY } from '@/components/common/FcmNotificationPrompt';
import { isIos, isStandalone, isNotificationSupported, getIosBrowserType } from '@/lib/utils/pwa';
import { getDeviceMetadata } from '@/lib/utils/device';

interface UserDeviceItem {
  id: string;
  token: string;
  deviceType: 'MOBILE' | 'TABLET' | 'DESKTOP' | 'OTHER';
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  lastActiveAt: Date | string;
  createdAt: Date | string;
  isActive: boolean;
}

interface NotificationsTabProps {
  user: {
    id: string;
    fcmToken?: string | null;
  };
}

export default function NotificationsTab({ user }: NotificationsTabProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(Boolean(user.fcmToken));
  const [permission, setPermission] = useState<NotificationPermission | 'unknown'>('unknown');
  const [isToggling, setIsToggling] = useState(false);
  const [devices, setDevices] = useState<UserDeviceItem[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState<boolean>(true);
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);
  const [isRevokingAllOther, setIsRevokingAllOther] = useState<boolean>(false);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [pwaState, setPwaState] = useState<{
    isIos: boolean;
    isStandalone: boolean;
    isSupported: boolean;
    browserType: 'safari' | 'chrome' | 'other';
  }>({
    isIos: false,
    isStandalone: false,
    isSupported: true,
    browserType: 'other',
  });

  const [iosGuideTab, setIosGuideTab] = useState<'safari' | 'chrome'>('safari');

  const fetchDevices = useCallback(async () => {
    try {
      setIsLoadingDevices(true);
      const userDevices = await getUserDevicesAction();
      setDevices(userDevices as unknown as UserDeviceItem[]);
      if (userDevices && userDevices.length > 0) {
        setIsEnabled(true);
      }
    } catch (err) {
      console.error('Failed to load user devices:', err);
    } finally {
      setIsLoadingDevices(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ios = isIos();
      const standalone = isStandalone();
      const supported = isNotificationSupported();
      const browser = getIosBrowserType();

      setPwaState({
        isIos: ios,
        isStandalone: standalone,
        isSupported: supported,
        browserType: browser,
      });

      if (browser === 'chrome') {
        setIosGuideTab('chrome');
      } else {
        setIosGuideTab('safari');
      }

      if ('Notification' in window) {
        setPermission(Notification.permission);
      }

      fetchDevices();

      // Attempt to retrieve active client token to match "Current Device"
      if (isFirebaseConfigured && 'Notification' in window && Notification.permission === 'granted') {
        getMessagingInstance()
          .then((messaging) => {
            if (messaging) {
              const configParams = new URLSearchParams({
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
                messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
                appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
              }).toString();

              navigator.serviceWorker
                .register(`/firebase-messaging-sw.js?${configParams}`)
                .then((registration) => {
                  return getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                    serviceWorkerRegistration: registration,
                  });
                })
                .then((tok) => {
                  if (tok) setCurrentToken(tok);
                })
                .catch(() => {
                  // Silent fail for token detection
                });
            }
          })
          .catch(() => {});
      }
    }
  }, [fetchDevices]);

  const handleToggle = async (turnOn: boolean) => {
    setIsToggling(true);
    setStatusMessage(null);

    if (!turnOn) {
      // Turn OFF notifications
      try {
        await deleteFcmTokenAction();
        setCurrentToken(null);
        await fetchDevices();
        setIsEnabled(false);
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(FCM_PROMPT_DISMISSED_KEY, 'true');
          }
        } catch {
          // Ignore localStorage errors
        }
        setStatusMessage({
          type: 'success',
          text: 'Push notifications have been disabled for your account.',
        });
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to disable push notifications. Please try again.';
        setStatusMessage({
          type: 'error',
          text: errorMsg,
        });
      } finally {
        setIsToggling(false);
      }
      return;
    }

    // Turn ON notifications
    if (typeof window === 'undefined') {
      setIsToggling(false);
      return;
    }

    if (pwaState.isIos && !pwaState.isStandalone) {
      setStatusMessage({
        type: 'info',
        text: 'On iOS, push notifications require adding Ideal Beauty to your Home Screen. Please follow the instructions below.',
      });
      setIsToggling(false);
      return;
    }

    if (!('Notification' in window) || !isNotificationSupported()) {
      setStatusMessage({
        type: 'error',
        text: 'Push notifications are not supported in this browser.',
      });
      setIsToggling(false);
      return;
    }

    if (Notification.permission === 'denied') {
      setPermission('denied');
      setStatusMessage({
        type: 'error',
        text: 'Push notifications are blocked in your browser settings. Please allow notifications for Ideal Beauty Official in your browser preferences to enable them.',
      });
      setIsToggling(false);
      return;
    }

    if (!isFirebaseConfigured) {
      setStatusMessage({
        type: 'info',
        text: 'Push notification service is not configured in this environment.',
      });
      setIsToggling(false);
      return;
    }

    try {
      const messaging = await getMessagingInstance();
      if (!messaging) {
        setStatusMessage({
          type: 'error',
          text: 'Push messaging instance could not be initialized.',
        });
        setIsToggling(false);
        return;
      }

      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult === 'granted') {
        const configParams = new URLSearchParams({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
        }).toString();

        const registration = await navigator.serviceWorker.register(
          `/firebase-messaging-sw.js?${configParams}`
        );

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          const metadata = getDeviceMetadata();
          await saveFcmTokenAction(token, metadata);
          setCurrentToken(token);
          setIsEnabled(true);
          await fetchDevices();
          try {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(FCM_PROMPT_DISMISSED_KEY);
            }
          } catch {
            // Ignore localStorage errors
          }
          setStatusMessage({
            type: 'success',
            text: 'Push notifications have been successfully registered for this device.',
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: 'Unable to generate device push notification token. Please try again later.',
          });
        }
      } else if (permissionResult === 'denied') {
        setStatusMessage({
          type: 'error',
          text: 'Notification permission was denied in your browser settings.',
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: 'Notification permission request was dismissed.',
        });
      }
    } catch (err: unknown) {
      console.error('Error enabling notifications:', err);
      const errorMsg =
        err instanceof Error ? err.message : 'An error occurred while enabling notifications.';
      setStatusMessage({
        type: 'error',
        text: errorMsg,
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    setRevokingDeviceId(deviceId);
    setStatusMessage(null);
    try {
      await revokeDeviceAction(deviceId);
      await fetchDevices();
      setStatusMessage({
        type: 'success',
        text: 'Device has been disconnected and notification token revoked.',
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to revoke device. Please try again.';
      setStatusMessage({
        type: 'error',
        text: errorMsg,
      });
    } finally {
      setRevokingDeviceId(null);
    }
  };

  const handleRevokeAllOther = async () => {
    setIsRevokingAllOther(true);
    setStatusMessage(null);
    try {
      await revokeAllOtherDevicesAction(currentToken || undefined);
      await fetchDevices();
      setStatusMessage({
        type: 'success',
        text: 'All other devices have been disconnected. Notifications remain active on this device only.',
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to revoke other devices. Please try again.';
      setStatusMessage({
        type: 'error',
        text: errorMsg,
      });
    } finally {
      setIsRevokingAllOther(false);
    }
  };

  const handleSendTestNotification = async () => {
    setIsSendingTest(true);
    setStatusMessage(null);
    try {
      const res = await sendTestPushNotificationAction();
      if (res && res.successCount > 0) {
        setStatusMessage({
          type: 'success',
          text: `Test notification sent successfully to ${res.successCount} registered device${
            res.successCount > 1 ? 's' : ''
          }!`,
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: 'Test notification was dispatched. Check your device for incoming push alerts.',
        });
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to send test notification. Please try again.';
      setStatusMessage({
        type: 'error',
        text: errorMsg,
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const isIosBrowserTab = pwaState.isIos && !pwaState.isStandalone;

  const renderDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'MOBILE':
        return <Smartphone className="w-5 h-5 text-neutral-700" />;
      case 'TABLET':
        return <Tablet className="w-5 h-5 text-neutral-700" />;
      case 'DESKTOP':
        return <Laptop className="w-5 h-5 text-neutral-700" />;
      default:
        return <Globe className="w-5 h-5 text-neutral-700" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications Overview Header */}
      <div className="bg-white border border-neutral-100 p-6 sm:p-8 space-y-6">
        <div className="border-b border-neutral-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-normal text-neutral-900 flex items-center gap-2">
              <span>Notification Preferences</span>
              <BellRing className="w-4 h-4 text-amber-600" />
            </h2>
            <p className="text-neutral-500 font-light text-xs mt-1 max-w-xl">
              Control push notifications and multi-device synchronization for orders, fitting confirmations, and exclusive atelier updates.
            </p>
          </div>
          <div>
            {isEnabled ? (
              <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono px-3 py-1.5 uppercase tracking-widest border border-emerald-200 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{devices.length > 0 ? `${devices.length} Devices Active` : 'Notifications Active'}</span>
              </span>
            ) : (
              <span className="bg-neutral-100 text-neutral-600 text-[10px] font-mono px-3 py-1.5 uppercase tracking-widest border border-neutral-200 flex items-center space-x-1.5">
                <BellOff className="w-3.5 h-3.5 text-neutral-500" />
                <span>Notifications Disabled</span>
              </span>
            )}
          </div>
        </div>

        {/* Status Feedback Toast */}
        {statusMessage && (
          <div
            className={`p-4 text-xs flex items-start space-x-3 transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-light leading-relaxed">{statusMessage.text}</div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-neutral-400 hover:text-neutral-700 text-xs font-mono"
            >
              &times;
            </button>
          </div>
        )}

        {/* Browser Permission Denied Alert Banner */}
        {permission === 'denied' && (
          <div className="bg-amber-50/80 border border-amber-200 p-4 text-xs space-y-2 text-amber-900">
            <div className="flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Browser Notifications Blocked</span>
            </div>
            <p className="font-light text-[11px] leading-relaxed text-amber-800">
              Notifications have been blocked in your browser site permissions. To receive alerts on this device, please click the lock/settings icon in your browser address bar and change notifications permission to &quot;Allow&quot;.
            </p>
          </div>
        )}

        {/* Dedicated iOS Home Screen Installation Guide Banner for Safari and Chrome on iOS */}
        {isIosBrowserTab && (
          <div className="bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white p-5 sm:p-7 border border-neutral-800 rounded-none shadow-md space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-neutral-700/80 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-serif text-sm tracking-wide font-normal text-white">
                    Enable Push Notifications on iPhone
                  </span>
                </div>
                <p className="text-neutral-300 text-xs font-light leading-relaxed">
                  Apple iOS requires adding Ideal Beauty to your Home Screen as a web app to deliver instant order and delivery notifications.
                </p>
              </div>
            </div>

            {/* iOS Browser Selection Tabs */}
            <div className="flex items-center space-x-2 border-b border-neutral-700/60 pb-3">
              <button
                type="button"
                onClick={() => setIosGuideTab('safari')}
                className={`text-xs px-3 py-1.5 font-medium transition-all ${
                  iosGuideTab === 'safari'
                    ? 'bg-amber-500 text-neutral-950 font-semibold'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
                }`}
              >
                Safari on iPhone
              </button>
              <button
                type="button"
                onClick={() => setIosGuideTab('chrome')}
                className={`text-xs px-3 py-1.5 font-medium transition-all ${
                  iosGuideTab === 'chrome'
                    ? 'bg-amber-500 text-neutral-950 font-semibold'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
                }`}
              >
                Chrome on iPhone
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            {iosGuideTab === 'safari' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-neutral-800/70 border border-neutral-700 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-amber-400 font-mono text-[11px]">
                    <span>STEP 1</span>
                    <Share className="w-4 h-4" />
                  </div>
                  <div className="text-neutral-200 font-medium">Tap the Share Button</div>
                  <p className="text-neutral-400 text-[11px] font-light leading-relaxed">
                    In Safari&apos;s bottom toolbar, tap the square <span className="text-white font-normal">Share</span> icon.
                  </p>
                </div>

                <div className="bg-neutral-800/70 border border-neutral-700 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-amber-400 font-mono text-[11px]">
                    <span>STEP 2</span>
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div className="text-neutral-200 font-medium">Add to Home Screen</div>
                  <p className="text-neutral-400 text-[11px] font-light leading-relaxed">
                    Scroll down the menu and select <span className="text-white font-normal">&quot;Add to Home Screen&quot;</span>.
                  </p>
                </div>

                <div className="bg-neutral-800/70 border border-neutral-700 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-amber-400 font-mono text-[11px]">
                    <span>STEP 3</span>
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="text-neutral-200 font-medium">Launch &amp; Enable</div>
                  <p className="text-neutral-400 text-[11px] font-light leading-relaxed">
                    Open <span className="text-white font-normal">Ideal Beauty</span> from your Home Screen to activate 1-tap alerts.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-neutral-800/70 border border-neutral-700 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-amber-400 font-mono text-[11px]">
                    <span>STEP 1</span>
                    <Share className="w-4 h-4" />
                  </div>
                  <div className="text-neutral-200 font-medium">Tap Share in Chrome</div>
                  <p className="text-neutral-400 text-[11px] font-light leading-relaxed">
                    Tap the <span className="text-white font-normal">Share</span> icon in Chrome&apos;s address bar or bottom menu.
                  </p>
                </div>

                <div className="bg-neutral-800/70 border border-neutral-700 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-amber-400 font-mono text-[11px]">
                    <span>STEP 2</span>
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div className="text-neutral-200 font-medium">Add to Home Screen</div>
                  <p className="text-neutral-400 text-[11px] font-light leading-relaxed">
                    Scroll down the sharing list and tap <span className="text-white font-normal">&quot;Add to Home Screen&quot;</span>.
                  </p>
                </div>

                <div className="bg-neutral-800/70 border border-neutral-700 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-amber-400 font-mono text-[11px]">
                    <span>STEP 3</span>
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="text-neutral-200 font-medium">Launch &amp; Enable</div>
                  <p className="text-neutral-400 text-[11px] font-light leading-relaxed">
                    Open <span className="text-white font-normal">Ideal Beauty</span> from your Home Screen to turn on push notifications.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Notification Toggle Setting Card */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wider text-neutral-700 font-medium">
              Push Notification Status
            </h3>
            {isEnabled && (
              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={isSendingTest}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-mono uppercase tracking-wider border border-neutral-200 rounded-xs transition-colors disabled:opacity-50"
              >
                {isSendingTest ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3 text-neutral-600" />
                )}
                <span>Send Test Push</span>
              </button>
            )}
          </div>

          <div className="bg-neutral-50/70 p-5 sm:p-6 border border-neutral-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="bg-white p-2.5 rounded-full border border-neutral-200 shrink-0 shadow-xs">
                  <Smartphone className="w-5 h-5 text-neutral-700" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-neutral-900">
                      Multi-Device Push Alerts
                    </span>
                    {isEnabled && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-500 text-[11px] font-light max-w-lg leading-relaxed">
                    Receive instant push notifications across all your active mobile phones, tablets, and desktop computers when your orders are confirmed and shipped.
                  </p>
                </div>
              </div>

              {/* Accessible Toggle Switch */}
              <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-wider">
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  aria-label="Toggle push notifications"
                  disabled={isToggling}
                  onClick={() => handleToggle(!isEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                    isEnabled ? 'bg-amber-600' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Quick Action Buttons for explicit click */}
            <div className="pt-2 border-t border-neutral-200/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-1.5 text-neutral-400 text-[11px]">
                <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>You can turn notifications on or off on this device at any time.</span>
              </div>

              <div>
                {isEnabled ? (
                  <button
                    type="button"
                    onClick={() => handleToggle(false)}
                    disabled={isToggling}
                    className="border border-rose-200 text-rose-700 hover:bg-rose-50 text-[10px] uppercase tracking-[0.15em] px-4 py-2 font-medium transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {isToggling ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-rose-600" />
                        <span>Disabling...</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3.5 h-3.5 text-rose-600" />
                        <span>Turn Off Notifications</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggle(true)}
                    disabled={isToggling}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] uppercase tracking-[0.15em] px-4 py-2 font-medium transition-colors flex items-center space-x-1.5 disabled:opacity-50 shadow-xs"
                  >
                    {isToggling ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-white" />
                        <span>Enabling...</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5 text-white" />
                        <span>Turn On Notifications</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Connected Devices & Endpoints List */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs uppercase tracking-wider text-neutral-700 font-medium">
                  Registered Devices
                </h3>
                <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 font-mono text-[10px] rounded-full border border-neutral-200">
                  {devices.length} connected
                </span>
              </div>
              <p className="text-neutral-400 font-light text-[11px] mt-0.5">
                Every connected browser and PWA receiving real-time account notifications.
              </p>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-center">
              <button
                type="button"
                onClick={fetchDevices}
                disabled={isLoadingDevices}
                className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-xs transition-colors border border-neutral-200"
                title="Refresh Device List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDevices ? 'animate-spin' : ''}`} />
              </button>

              {devices.length > 1 && (
                <button
                  type="button"
                  onClick={handleRevokeAllOther}
                  disabled={isRevokingAllOther}
                  className="text-[10px] font-mono text-rose-700 hover:text-rose-900 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isRevokingAllOther ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3 text-rose-600" />
                  )}
                  <span>Revoke All Other Devices</span>
                </button>
              )}
            </div>
          </div>

          {isLoadingDevices ? (
            <div className="p-8 border border-neutral-200 bg-neutral-50 text-center text-neutral-400 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
              <p className="text-xs font-light">Loading registered devices...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="p-8 border border-dashed border-neutral-300 bg-neutral-50 text-center space-y-2">
              <Smartphone className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-xs font-medium text-neutral-800">No active devices registered</p>
              <p className="text-[11px] text-neutral-500 font-light max-w-sm mx-auto">
                Turn on notifications above on your phone or computer to start receiving updates on this device.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {devices.map((device) => {
                const isThisDevice =
                  currentToken && device.token === currentToken;
                const lastActiveDate = new Date(device.lastActiveAt);

                return (
                  <div
                    key={device.id}
                    className={`p-4 border rounded-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isThisDevice
                        ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400/50'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5 min-w-0">
                      <div className="p-2.5 bg-neutral-100 border border-neutral-200 rounded-xs shrink-0 mt-0.5">
                        {renderDeviceIcon(device.deviceType)}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-neutral-900">
                            {device.deviceName ||
                              `${device.os || 'Device'} (${device.browser || 'Browser'})`}
                          </span>

                          {isThisDevice && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-mono text-[9px] uppercase font-bold tracking-wider rounded-xs border border-amber-300">
                              This Device
                            </span>
                          )}

                          <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 font-mono text-[9px] rounded-xs border border-neutral-200">
                            {device.os || 'OS'} • {device.browser || 'Browser'}
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-400 font-mono font-light">
                          Last active: {lastActiveDate.toLocaleDateString()} at{' '}
                          {lastActiveDate.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRevokeDevice(device.id)}
                        disabled={revokingDeviceId === device.id}
                        className="px-3 py-1.5 text-[10px] font-mono text-neutral-600 hover:text-rose-700 hover:bg-rose-50 border border-neutral-200 hover:border-rose-200 rounded-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        {revokingDeviceId === device.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-3 h-3 text-neutral-400 group-hover:text-rose-600" />
                        )}
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Informational Categories */}
        <div className="pt-4 space-y-3 border-t border-neutral-100">
          <h4 className="text-xs uppercase tracking-wider text-neutral-700 font-medium">
            What alerts are included?
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-neutral-200 p-4 bg-white space-y-1.5">
              <div className="flex items-center space-x-2 text-neutral-800">
                <Package className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium text-xs">Order Confirmations</span>
              </div>
              <p className="text-neutral-500 text-[11px] font-light leading-relaxed">
                Instant confirmation when your custom atelier order is placed and confirmed.
              </p>
            </div>

            <div className="border border-neutral-200 p-4 bg-white space-y-1.5">
              <div className="flex items-center space-x-2 text-neutral-800">
                <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium text-xs">Payment Verification</span>
              </div>
              <p className="text-neutral-500 text-[11px] font-light leading-relaxed">
                Real-time updates as soon as your down payment or final settlement is verified.
              </p>
            </div>

            <div className="border border-neutral-200 p-4 bg-white space-y-1.5">
              <div className="flex items-center space-x-2 text-neutral-800">
                <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium text-xs">Shipping &amp; Delivery</span>
              </div>
              <p className="text-neutral-500 text-[11px] font-light leading-relaxed">
                Tracking numbers and courier dispatch notifications as your package travels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
