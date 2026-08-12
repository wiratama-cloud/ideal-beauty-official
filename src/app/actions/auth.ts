'use server';

import { prisma } from '@/lib/prisma';
import { getSessionId, setLoggedInUserId, clearLoggedInUserId, getLoggedInUserId } from '@/lib/session';
import { mergeGuestCartToUser } from '@/lib/services/cart';

export async function loginUserAction(email: string, name?: string) {
  const sessionId = await getSessionId();

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name || 'Ideal Beauty Patron',
        phone: '+628123456789',
      },
    });
  }

  await setLoggedInUserId(user.id);
  await mergeGuestCartToUser(sessionId, user.id);

  return user;
}

export async function logoutUserAction() {
  await clearLoggedInUserId();
}

export async function getCurrentUserAction() {
  const userId = await getLoggedInUserId();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: true,
    },
  });
}
