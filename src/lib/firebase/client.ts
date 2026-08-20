import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  connectAuthEmulator,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  Auth,
} from 'firebase/auth';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';

const isProduction = process.env.NODE_ENV === 'production';
const forceEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
const shouldConnectEmulator = !isProduction || forceEmulator;

const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  'ideal-beauty-official-b313d';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    (projectId ? `${projectId}.firebaseapp.com` : undefined),
  projectId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    (projectId ? `${projectId}.appspot.com` : undefined),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize only if config exists or emulator is present
const isFirebaseConfigured = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST ||
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ||
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST
);

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

  const authEmulatorHost =
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (
    shouldConnectEmulator &&
    authEmulatorHost &&
    authEmulatorHost !== 'false' &&
    authEmulatorHost !== 'undefined' &&
    authEmulatorHost.trim() !== '' &&
    authInstance
  ) {
    const url = authEmulatorHost.startsWith('http')
      ? authEmulatorHost
      : `http://${authEmulatorHost}`;
    try {
      connectAuthEmulator(authInstance, url, { disableWarnings: true });
    } catch {
      // Ignore if already connected
    }
  }
}

let storageInstance: FirebaseStorage | null = null;
if (isFirebaseConfigured && app) {
  storageInstance = getStorage(app);
  const storageEmulatorHost =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST ||
    process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  if (
    shouldConnectEmulator &&
    storageEmulatorHost &&
    storageEmulatorHost !== 'false' &&
    storageEmulatorHost !== 'undefined' &&
    storageEmulatorHost.trim() !== '' &&
    storageInstance
  ) {
    const cleanHost = storageEmulatorHost.replace(/^https?:\/\//, '');
    const [host, portStr] = cleanHost.split(':');
    const port = portStr ? parseInt(portStr, 10) : 9199;
    try {
      connectStorageEmulator(storageInstance, host, port);
    } catch {
      // Ignore if already connected
    }
  }
}

export const auth = authInstance;
export const storage = storageInstance;

export const getMessagingInstance = async (): Promise<Messaging | null> => {
  if (!isFirebaseConfigured || typeof window === 'undefined' || !app) return null;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
  } catch (error) {
    console.warn('Firebase Messaging is not supported in this environment:', error);
    return null;
  }
};

export { isFirebaseConfigured };
