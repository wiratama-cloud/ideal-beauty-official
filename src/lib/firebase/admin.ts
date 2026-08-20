import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';
import { getStorage } from 'firebase-admin/storage';

const isServiceAccountConfigured = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const isProduction = process.env.NODE_ENV === 'production';
const isEmulatorOrDev =
  !isProduction &&
  (!!process.env.FIREBASE_STORAGE_EMULATOR_HOST ||
    !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST ||
    !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test');

let app: App | null = null;
if (!getApps().length) {
  try {
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      'ideal-beauty-official-b313d';
    const storageBucket =
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      process.env.FIREBASE_STORAGE_BUCKET ||
      `${projectId}.appspot.com`;

    if (isServiceAccountConfigured) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket,
        projectId: serviceAccount.project_id || projectId,
      });
    } else if (isEmulatorOrDev) {
      app = initializeApp({
        projectId,
        storageBucket,
      });
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
} else {
  app = getApps()[0];
}

export const firebaseAdmin = app;
export const firebaseAdminAuth = app ? getAuth(app) : null;
export const firebaseAdminMessaging = app ? getMessaging(app) : null;
export const firebaseAdminStorage = app ? getStorage(app) : null;

// Helper to decode JWT payload safely in dev / test / emulator mode
function decodeEmulatorOrDevToken(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadStr);
    if (!payload || typeof payload !== 'object') return null;

    const uid = payload.user_id || payload.sub || payload.uid;
    if (!uid || typeof uid !== 'string') return null;

    return {
      uid,
      sub: uid,
      email: payload.email,
      email_verified: !!payload.email_verified,
      phone_number: payload.phone_number,
      name: payload.name,
      picture: payload.picture,
      ...payload,
    };
  } catch {
    return null;
  }
}

// Helper to verify ID token
export async function verifyIdToken(token: string) {
  if (!token || typeof token !== 'string') return null;

  const isCurrentProduction = process.env.NODE_ENV === 'production';
  const shouldAllowEmulator =
    !isCurrentProduction &&
    (isEmulatorOrDev ||
      !!process.env.FIREBASE_STORAGE_EMULATOR_HOST ||
      !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
      !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST ||
      !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ||
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test');

  if (firebaseAdminAuth) {
    try {
      return await firebaseAdminAuth.verifyIdToken(token);
    } catch (error) {
      if (shouldAllowEmulator) {
        const decoded = decodeEmulatorOrDevToken(token);
        if (decoded) {
          return decoded;
        }
      }
      console.error('Error verifying Firebase ID token:', error);
      return null;
    }
  }

  if (shouldAllowEmulator) {
    const decoded = decodeEmulatorOrDevToken(token);
    if (decoded) {
      return decoded;
    }
  }

  return null;
}
