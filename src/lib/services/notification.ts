import { firebaseAdminMessaging } from '@/lib/firebase/admin';

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
