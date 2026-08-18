import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  Auth,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize only if config exists
const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app: FirebaseApp | undefined;

if (isFirebaseConfigured && !getApps().length) {
  app = initializeApp(firebaseConfig);
} else if (isFirebaseConfigured) {
  app = getApp();
}

let authInstance: Auth | null = null;

if (isFirebaseConfigured && app) {
  try {
    if (typeof window !== 'undefined') {
      authInstance = initializeAuth(app, {
        persistence: [
          browserLocalPersistence,
          indexedDBLocalPersistence,
          browserSessionPersistence,
          inMemoryPersistence,
        ],
        popupRedirectResolver: browserPopupRedirectResolver,
      });
    } else {
      authInstance = getAuth(app);
    }
  } catch {
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
export const storage = isFirebaseConfigured && app ? getStorage(app) : null;

export const getMessagingInstance = async (): Promise<Messaging | null> => {
  if (!isFirebaseConfigured || typeof window === 'undefined') return null;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app!);
  } catch (error) {
    console.warn('Firebase Messaging is not supported in this environment:', error);
    return null;
  }
};

export { isFirebaseConfigured };
