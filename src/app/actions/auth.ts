'use server';

import { prisma } from '@/lib/prisma';
import { getSessionId, setLoggedInUserId, clearLoggedInUserId, getLoggedInUserId } from '@/lib/session';
import { mergeGuestCartToUser } from '@/lib/services/cart';
import { verifyPassword, hashPassword } from '@/lib/services/user';

export async function loginUserAction(email: string, password?: string, name?: string) {
  const sessionId = await getSessionId();

  const cleanEmail = email.trim().toLowerCase();

  let user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (user && user.passwordHash) {
    if (!password) {
      throw new Error('Password is required for this account.');
    }
    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name?.trim() || 'Ideal Beauty Patron',
        phone: '+628123456789',
        ...(password ? { passwordHash: hashPassword(password) } : {}),
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
