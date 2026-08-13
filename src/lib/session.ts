import { cookies } from 'next/headers';
import { prisma } from './prisma';

const SESSION_COOKIE_NAME = 'ib_session_id';
const USER_COOKIE_NAME = 'ib_user_id';

export async function getSessionId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return 'sess_fallback_' + Math.random().toString(36).substring(2, 15);
    }

    return sessionId;
  } catch {
    return 'sess_test_fallback_' + Math.random().toString(36).substring(2, 15);
  }
}

export async function getLoggedInUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get(USER_COOKIE_NAME)?.value;
    return userId || null;
  } catch {
    return null;
  }
}

export async function setLoggedInUserId(userId: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(USER_COOKIE_NAME, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  } catch {
    // Fallback when executed outside Next.js request store (e.g. unit/integration tests)
  }
}

export async function clearLoggedInUserId(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(USER_COOKIE_NAME);
  } catch {
    // Fallback when executed outside Next.js request store (e.g. unit/integration tests)
  }
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
