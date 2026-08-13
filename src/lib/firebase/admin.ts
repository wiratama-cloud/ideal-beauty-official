import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';
import { getStorage } from 'firebase-admin/storage';

// Initialize only if service account exists
const isFirebaseAdminConfigured = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let app: App | null = null;
if (isFirebaseAdminConfigured) {
  if (!getApps().length) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
    }
  } else {
    app = getApps()[0];
  }
}

export const firebaseAdmin = app;
export const firebaseAdminAuth = app ? getAuth(app) : null;
export const firebaseAdminMessaging = app ? getMessaging(app) : null;
export const firebaseAdminStorage = app ? getStorage(app) : null;

// Helper to verify ID token
export async function verifyIdToken(token: string) {
  if (!firebaseAdminAuth) return null;
  try {
    return await firebaseAdminAuth.verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return null;
  }
}
