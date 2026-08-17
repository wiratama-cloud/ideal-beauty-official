import { firebaseAdminMessaging } from '@/lib/firebase/admin';
import type { MulticastMessage } from 'firebase-admin/messaging';

export async function sendOrderPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  orderId: string
) {
  if (!firebaseAdminMessaging) {
    console.warn('Firebase Admin Messaging not configured. Skipping notification.');
    return null;
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        orderId,
      },
    };

    const response = await firebaseAdminMessaging.send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

export interface MulticastPushNotificationResult {
  success: boolean;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  message?: string;
  errors?: string[];
}

export async function sendMulticastPushNotification(
  tokens: string[],
  title: string,
  body: string,
  url?: string
): Promise<MulticastPushNotificationResult> {
  const validTokens = Array.from(
    new Set(tokens.filter((t) => typeof t === 'string' && t.trim().length > 0))
  );

  if (validTokens.length === 0) {
    return {
      success: true,
      totalRecipients: 0,
      successCount: 0,
      failureCount: 0,
      message: 'No valid FCM tokens found for recipients',
    };
  }

  if (!firebaseAdminMessaging) {
    console.warn('Firebase Admin Messaging not configured. Skipping notification broadcast.');
    return {
      success: false,
      totalRecipients: validTokens.length,
      successCount: 0,
      failureCount: validTokens.length,
      message: 'Firebase Admin Messaging is not configured in server environment.',
    };
  }

  // Firebase allows sending up to 500 tokens per multicast batch
  const CHUNK_SIZE = 500;
  let totalSuccess = 0;
  let totalFailure = 0;
  const errors: string[] = [];

  for (let i = 0; i < validTokens.length; i += CHUNK_SIZE) {
    const batchTokens = validTokens.slice(i, i + CHUNK_SIZE);
    try {
      const message: MulticastMessage = {
        tokens: batchTokens,
        notification: {
          title,
          body,
        },
      };

      if (url && url.trim()) {
        message.data = { url: url.trim() };
        message.webpush = {
          fcmOptions: {
            link: url.trim(),
          },
        };
      }

      const response =
        typeof firebaseAdminMessaging.sendEachForMulticast === 'function'
          ? await firebaseAdminMessaging.sendEachForMulticast(message)
          : await (firebaseAdminMessaging as unknown as { sendMulticast: (m: MulticastMessage) => Promise<{ successCount: number; failureCount: number }> }).sendMulticast(message);

      totalSuccess += response.successCount;
      totalFailure += response.failureCount;
    } catch (error: unknown) {
      console.error('Error sending multicast message batch:', error);
      totalFailure += batchTokens.length;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while dispatching batch';
      errors.push(errorMessage);
    }
  }

  return {
    success: totalSuccess > 0 || totalFailure === 0,
    totalRecipients: validTokens.length,
    successCount: totalSuccess,
    failureCount: totalFailure,
    errors: errors.length > 0 ? errors : undefined,
  };
}
