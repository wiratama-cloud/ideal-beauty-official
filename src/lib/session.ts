import { cookies } from 'next/headers';
import { prisma } from './prisma';

const SESSION_COOKIE_NAME = 'ib_session_id';
const USER_COOKIE_NAME = 'ib_user_id';

export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    // Fallback in case middleware hasn't run (e.g. some api routes), generate one 
    // but don't attempt to set it on the cookieStore in RSC context
    return 'sess_fallback_' + Math.random().toString(36).substring(2, 15);
  }

  return sessionId;
}

export async function getLoggedInUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(USER_COOKIE_NAME)?.value;
  return userId || null;
}

export async function setLoggedInUserId(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export async function clearLoggedInUserId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string> {
  const loggedInUserId = await getLoggedInUserId();
  if (loggedInUserId) {
    return loggedInUserId;
  }

  // Fallback to guest user attached to session or create seed guest user
  const sessionId = await getSessionId();
  let guestUser = await prisma.user.findFirst({
    where: { email: `guest_${sessionId}@idealbeautyofficial.com` },
  });

  if (!guestUser) {
    guestUser = await prisma.user.create({
      data: {
        email: `guest_${sessionId}@idealbeautyofficial.com`,
        name: 'Guest Customer',
      },
    });
  }

  return guestUser.id;
}
