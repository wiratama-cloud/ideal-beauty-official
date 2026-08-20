import { firebaseAdminMessaging } from '@/lib/firebase/admin';
import type { Message, MulticastMessage } from 'firebase-admin/messaging';
import { prisma } from '../prisma';

export const INVALID_FCM_ERROR_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
  'messaging/mismatched-credential',
  'registration-token-not-registered',
  'invalid-registration-token',
  'invalid-argument',
  'mismatched-credential',
  'NotRegistered',
  'InvalidRegistration',
];

/**
 * Determines whether a Firebase Messaging error indicates that the token is invalid, expired, or unregistered.
 */
export function isInvalidTokenError(errorOrCode?: unknown): boolean {
  if (!errorOrCode) return false;

  let str = '';
  if (typeof errorOrCode === 'string') {
    str = errorOrCode;
  } else if (typeof errorOrCode === 'object' && errorOrCode !== null) {
    const errObj = errorOrCode as {
      code?: unknown;
      message?: unknown;
      errorInfo?: { code?: unknown; message?: unknown };
    };
    const code =
      typeof errObj.code === 'string'
        ? errObj.code
        : typeof errObj.errorInfo?.code === 'string'
        ? errObj.errorInfo.code
        : '';
    const message =
      typeof errObj.message === 'string'
        ? errObj.message
        : typeof errObj.errorInfo?.message === 'string'
        ? errObj.errorInfo.message
        : '';
    str = `${code} ${message}`;
  }

  if (!str.trim()) return false;
  const lower = str.toLowerCase();
  if (INVALID_FCM_ERROR_CODES.some((code) => lower.includes(code.toLowerCase()))) {
    return true;
  }
  if (
    lower.includes('not-registered') ||
    lower.includes('notregistered') ||
    lower.includes('invalid-registration') ||
    lower.includes('invalid registration') ||
    lower.includes('requested entity was not found') ||
    lower.includes('is not a valid fcm registration token') ||
    lower.includes('unregistered')
  ) {
    return true;
  }
  return false;
}

/**
 * Prunes dead/unregistered FCM tokens from the database.
 * Deletes corresponding UserDevice records and clears User.fcmToken if matched.
 */
export async function pruneDeadTokens(
  tokens: string[]
): Promise<{ prunedDevicesCount: number; clearedUsersCount: number; prunedTokens: string[] }> {
  const cleanTokens = Array.from(
    new Set(tokens.filter((t) => typeof t === 'string' && t.trim().length > 0))
  );

  if (cleanTokens.length === 0) {
    return { prunedDevicesCount: 0, clearedUsersCount: 0, prunedTokens: [] };
  }

  try {
    const deleteResult = await prisma.userDevice.deleteMany({
      where: {
        token: { in: cleanTokens },
      },
    });

    const updateResult = await prisma.user.updateMany({
      where: {
        fcmToken: { in: cleanTokens },
      },
      data: {
        fcmToken: null,
      },
    });

    console.log(
      `[FCM Prune] Pruned ${deleteResult.count} dead user devices and cleared ${updateResult.count} primary user tokens.`
    );

    return {
      prunedDevicesCount: deleteResult.count,
      clearedUsersCount: updateResult.count,
      prunedTokens: cleanTokens,
    };
  } catch (error) {
    console.error('Error pruning dead FCM tokens from database:', error);
    return { prunedDevicesCount: 0, clearedUsersCount: 0, prunedTokens: cleanTokens };
  }
}

/**
 * Sends a transactional order push notification to a single FCM device token.
 * If the device token is expired/invalid, automatically prunes it.
 */
export async function sendOrderPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  orderId: string,
  url: string = '/account?tab=orders'
) {
  if (!firebaseAdminMessaging) {
    console.warn('Firebase Admin Messaging not configured. Skipping notification.');
    return null;
  }

  const destinationUrl = url && url.trim() ? url.trim() : '/account?tab=orders';

  try {
    const message: Message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        orderId,
        url: destinationUrl,
      },
      webpush: {
        notification: {
          icon: '/icon.png',
          badge: '/icon.png',
        },
        fcmOptions: {
          link: destinationUrl,
        },
      },
    };

    const response = await firebaseAdminMessaging.send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error: any) {
    console.error('Error sending single order push notification:', error);
    const errorCodeOrMessage = error?.code || error?.message || '';
    if (isInvalidTokenError(errorCodeOrMessage)) {
      await pruneDeadTokens([fcmToken]);
    }
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
  prunedTokensCount?: number;
  prunedTokens?: string[];
}

export interface MulticastOptions {
  data?: Record<string, string>;
  orderId?: string;
  pruneDeadTokens?: boolean;
}

/**
 * Dispatches multicast push notifications to a list of tokens with automatic batching (up to 500 tokens)
 * and dead token pruning when Firebase returns invalid token errors.
 */
export async function sendMulticastPushNotification(
  tokens: string[],
  title: string,
  body: string,
  url?: string,
  options?: MulticastOptions
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

  const destinationUrl = url && url.trim() ? url.trim() : '/';
  const customData: Record<string, string> = {
    url: destinationUrl,
    ...(options?.orderId ? { orderId: options.orderId } : {}),
    ...(options?.data || {}),
  };

  // Firebase allows sending up to 500 tokens per multicast batch
  const CHUNK_SIZE = 500;
  let totalSuccess = 0;
  let totalFailure = 0;
  const errors: string[] = [];
  const deadTokensToPrune: string[] = [];

  for (let i = 0; i < validTokens.length; i += CHUNK_SIZE) {
    const batchTokens = validTokens.slice(i, i + CHUNK_SIZE);
    try {
      if (typeof (firebaseAdminMessaging as any).sendEachForMulticast === 'function') {
        const message: MulticastMessage = {
          tokens: batchTokens,
          notification: {
            title,
            body,
          },
          data: customData,
          webpush: {
            notification: {
              icon: '/icon.png',
              badge: '/icon.png',
            },
            fcmOptions: {
              link: destinationUrl,
            },
          },
        };

        const response = await (firebaseAdminMessaging as any).sendEachForMulticast(message);
        totalSuccess += response.successCount || 0;
        totalFailure += response.failureCount || 0;

        if (Array.isArray(response.responses)) {
          response.responses.forEach((resp: any, idx: number) => {
            if (!resp.success && resp.error) {
              const codeOrMsg = resp.error.code || resp.error.message || '';
              if (isInvalidTokenError(codeOrMsg)) {
                deadTokensToPrune.push(batchTokens[idx]);
              }
              const errStr = resp.error.message || resp.error.code || 'Unknown token dispatch failure';
              if (!errors.includes(errStr)) {
                errors.push(errStr);
              }
            }
          });
        }
      } else if (typeof (firebaseAdminMessaging as any).sendMulticast === 'function') {
        const message: MulticastMessage = {
          tokens: batchTokens,
          notification: {
            title,
            body,
          },
          data: customData,
          webpush: {
            notification: {
              icon: '/icon.png',
              badge: '/icon.png',
            },
            fcmOptions: {
              link: destinationUrl,
            },
          },
        };

        const response = await (firebaseAdminMessaging as any).sendMulticast(message);
        totalSuccess += response.successCount || 0;
        totalFailure += response.failureCount || 0;

        if (Array.isArray(response.responses)) {
          response.responses.forEach((resp: any, idx: number) => {
            if (!resp.success && resp.error) {
              const codeOrMsg = resp.error.code || resp.error.message || '';
              if (isInvalidTokenError(codeOrMsg)) {
                deadTokensToPrune.push(batchTokens[idx]);
              }
            }
          });
        }
      } else if (typeof (firebaseAdminMessaging as any).send === 'function') {
        // Fallback for mocked environments where only send(message) is defined
        for (const token of batchTokens) {
          try {
            await (firebaseAdminMessaging as any).send({
              token,
              notification: {
                title,
                body,
              },
              data: customData,
              webpush: {
                notification: {
                  icon: '/icon.png',
                  badge: '/icon.png',
                },
                fcmOptions: {
                  link: destinationUrl,
                },
              },
            });
            totalSuccess += 1;
          } catch (singleErr: any) {
            totalFailure += 1;
            const codeOrMsg = singleErr?.code || singleErr?.message || '';
            if (isInvalidTokenError(codeOrMsg)) {
              deadTokensToPrune.push(token);
            }
            const errStr = singleErr?.message || 'Single token dispatch failed';
            if (!errors.includes(errStr)) {
              errors.push(errStr);
            }
          }
        }
      } else {
        throw new Error('Firebase Admin Messaging has no compatible send method available.');
      }
    } catch (error: unknown) {
      console.error('Error sending multicast message batch:', error);
      totalFailure += batchTokens.length;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred while dispatching batch';
      errors.push(errorMessage);
    }
  }

  // Prune dead tokens automatically unless explicitly disabled
  let prunedCount = 0;
  if (options?.pruneDeadTokens !== false && deadTokensToPrune.length > 0) {
    const pruneRes = await pruneDeadTokens(deadTokensToPrune);
    prunedCount = pruneRes.prunedDevicesCount;
  }

  return {
    success: totalSuccess > 0 || totalFailure === 0,
    totalRecipients: validTokens.length,
    successCount: totalSuccess,
    failureCount: totalFailure,
    errors: errors.length > 0 ? errors : undefined,
    prunedTokensCount: prunedCount,
    prunedTokens: deadTokensToPrune.length > 0 ? Array.from(new Set(deadTokensToPrune)) : undefined,
  };
}

/**
 * Convenience wrapper for multicast notification with automatic dead token cleanup.
 */
export async function sendMulticastWithCleanup(
  tokens: string[],
  payload: {
    title: string;
    body: string;
    url?: string;
    data?: Record<string, string>;
    orderId?: string;
  }
): Promise<MulticastPushNotificationResult> {
  return sendMulticastPushNotification(tokens, payload.title, payload.body, payload.url, {
    data: payload.data,
    orderId: payload.orderId,
    pruneDeadTokens: true,
  });
}

/**
 * Dispatches a push notification to all active devices registered under a specific user.
 * Falls back to User.fcmToken if no active UserDevice records are found.
 */
export async function sendPushToUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    url?: string;
    data?: Record<string, string>;
    orderId?: string;
  }
): Promise<MulticastPushNotificationResult> {
  if (!userId) {
    return {
      success: false,
      totalRecipients: 0,
      successCount: 0,
      failureCount: 0,
      message: 'User ID is required to send notification',
    };
  }

  try {
    // 1. Fetch active devices for user
    const devices = await prisma.userDevice.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        token: true,
      },
    });

    let tokens = devices.map((d) => d.token).filter((t): t is string => Boolean(t && t.trim()));

    // 2. Fallback to User.fcmToken for legacy backward compatibility
    if (tokens.length === 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });
      if (user?.fcmToken && user.fcmToken.trim().length > 0) {
        tokens = [user.fcmToken.trim()];
      }
    }

    if (tokens.length === 0) {
      return {
        success: true,
        totalRecipients: 0,
        successCount: 0,
        failureCount: 0,
        message: 'No active device tokens found for user',
      };
    }

    return await sendMulticastWithCleanup(tokens, payload);
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error);
    return {
      success: false,
      totalRecipients: 0,
      successCount: 0,
      failureCount: 0,
      message: error instanceof Error ? error.message : 'Failed to query user devices or dispatch push',
    };
  }
}

/**
 * Sends an order status push notification to all active devices for a given customer.
 */
export async function sendOrderPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  orderId: string,
  url: string = '/account?tab=orders'
): Promise<MulticastPushNotificationResult> {
  return sendPushToUser(userId, {
    title,
    body,
    orderId,
    url,
    data: {
      orderId,
    },
  });
}
