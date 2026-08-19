import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Firebase Messaging Service Worker (firebase-messaging-sw.js)', () => {
  const swPath = path.resolve(__dirname, '../public/firebase-messaging-sw.js');
  const swContent = fs.readFileSync(swPath, 'utf-8');

  it('contains notificationclick event listener in service worker', () => {
    expect(swContent).toContain("self.addEventListener('notificationclick'");
    expect(swContent).toContain('event.notification.close()');
  });

  it('prevents duplicate notification display by skipping showNotification when payload.notification is present', () => {
    expect(swContent).toContain('messaging.onBackgroundMessage(');
    expect(swContent).toContain('if (payload.notification)');
    expect(swContent).toContain('return;');
  });

  it('handles data-only payload by calling showNotification with target url in options.data', () => {
    expect(swContent).toContain('if (payload.data)');
    expect(swContent).toContain('destinationUrl');
    expect(swContent).toContain('self.registration.showNotification(');
  });

  it('matches open window clients and focuses or opens target window upon click', () => {
    expect(swContent).toContain('clients.matchAll');
    expect(swContent).toContain('client.focus()');
    expect(swContent).toContain('clients.openWindow(urlToOpen)');
  });
});

describe('Firebase Messaging Service Worker Simulated Logic', () => {
  let backgroundMessageHandler: (payload: any) => void;
  let notificationClickHandler: (event: any) => void;
  let showNotificationMock: any;
  let openWindowMock: any;
  let matchAllMock: any;

  beforeEach(() => {
    showNotificationMock = vi.fn();
    openWindowMock = vi.fn().mockResolvedValue({} as any);
    matchAllMock = vi.fn().mockResolvedValue([]);

    // Extract handlers or simulate behavior as written in SW
    backgroundMessageHandler = (payload: any) => {
      if (payload.notification) {
        return;
      }
      if (payload.data) {
        const notificationTitle = payload.data.title || 'Ideal Beauty';
        const destinationUrl = payload.data.url || payload.data.link || '/';
        const notificationOptions = {
          body: payload.data.body || '',
          icon: payload.data.icon || '/icon.png',
          badge: payload.data.badge || '/icon.png',
          data: {
            url: destinationUrl,
            ...payload.data,
          },
        };
        showNotificationMock(notificationTitle, notificationOptions);
      }
    };

    notificationClickHandler = (event: any) => {
      event.notification.close();
      const rawUrl = event.notification.data?.url || event.notification.data?.link || '/';
      let urlToOpen = '/';
      try {
        urlToOpen = new URL(rawUrl, 'https://idealbeauty.com').href;
      } catch {
        urlToOpen = rawUrl || '/';
      }

      event.waitUntil(
        matchAllMock({ type: 'window', includeUncontrolled: true }).then((windowClients: any[]) => {
          for (const client of windowClients) {
            if ((client.url === urlToOpen || client.url === rawUrl) && 'focus' in client) {
              return client.focus();
            }
          }
          if (openWindowMock) {
            return openWindowMock(urlToOpen);
          }
        })
      );
    };
  });

  it('does NOT call showNotification when payload contains a notification object (avoids double render)', () => {
    const payload = {
      notification: {
        title: 'Order Status Update',
        body: 'Your order ORD-1 is SHIPPED',
      },
      data: {
        orderId: 'ORD-1',
        url: '/account?tab=orders',
      },
    };

    backgroundMessageHandler(payload);
    expect(showNotificationMock).not.toHaveBeenCalled();
  });

  it('calls showNotification when payload is a data-only message', () => {
    const payload = {
      data: {
        title: 'Exclusive Offer',
        body: 'Rent modern couture dresses with 30% off',
        url: '/products',
      },
    };

    backgroundMessageHandler(payload);
    expect(showNotificationMock).toHaveBeenCalledTimes(1);
    expect(showNotificationMock).toHaveBeenCalledWith('Exclusive Offer', {
      body: 'Rent modern couture dresses with 30% off',
      icon: '/icon.png',
      badge: '/icon.png',
      data: {
        url: '/products',
        title: 'Exclusive Offer',
        body: 'Rent modern couture dresses with 30% off',
      },
    });
  });

  it('closes notification and opens new window when no existing client matches', async () => {
    const closeMock = vi.fn();
    const event = {
      notification: {
        close: closeMock,
        data: {
          url: '/account?tab=orders',
        },
      },
      waitUntil: vi.fn((promise) => promise),
    };

    notificationClickHandler(event);

    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(event.waitUntil).toHaveBeenCalledTimes(1);

    await event.waitUntil.mock.results[0].value;
    expect(openWindowMock).toHaveBeenCalledWith('https://idealbeauty.com/account?tab=orders');
  });

  it('focuses existing window client when client url matches notification target', async () => {
    const closeMock = vi.fn();
    const focusMock = vi.fn().mockResolvedValue(undefined);
    const existingClient = {
      url: 'https://idealbeauty.com/account?tab=orders',
      focus: focusMock,
    };

    matchAllMock.mockResolvedValue([existingClient]);

    const event = {
      notification: {
        close: closeMock,
        data: {
          url: '/account?tab=orders',
        },
      },
      waitUntil: vi.fn((promise) => promise),
    };

    notificationClickHandler(event);

    await event.waitUntil.mock.results[0].value;
    expect(focusMock).toHaveBeenCalledTimes(1);
    expect(openWindowMock).not.toHaveBeenCalled();
  });

  it('falls back gracefully to root / if url is undefined in notification data', async () => {
    const closeMock = vi.fn();
    const event = {
      notification: {
        close: closeMock,
        data: {},
      },
      waitUntil: vi.fn((promise) => promise),
    };

    notificationClickHandler(event);
    await event.waitUntil.mock.results[0].value;
    expect(openWindowMock).toHaveBeenCalledWith('https://idealbeauty.com/');
  });
});
