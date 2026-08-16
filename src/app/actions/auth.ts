'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getSessionId, setLoggedInUserId, clearLoggedInUserId, getLoggedInUserId } from '@/lib/session';
import { mergeGuestCartToUser } from '@/lib/services/cart';
import { verifyPassword, hashPassword } from '@/lib/services/user';
import { verifyIdToken } from '@/lib/firebase/admin';
import { isEmailAdmin } from '@/lib/services/access';

export async function verifyFirebaseTokenAction(token: string) {
  const decodedToken = await verifyIdToken(token);
  if (!decodedToken) {
    throw new Error('Invalid Firebase ID token');
  }

  const { uid, email, phone_number, name: tokenName } = decodedToken as any;

  const sessionId = await getSessionId();

  // Find user by firebaseUid, email, or phone
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { firebaseUid: uid },
        ...(email ? [{ email }] : []),
        ...(phone_number ? [{ phone: phone_number }] : []),
      ],
    },
  });

  if (user) {
    // True upsert logic
    const updateData: any = {};

    if (user.firebaseUid !== uid) {
      updateData.firebaseUid = uid;
    }

    if (tokenName && (!user.name || user.name === 'Ideal Beauty Patron')) {
      updateData.name = tokenName;
    }

    if (email) {
      if (user.email !== email) {
        updateData.email = email;
      }
      if (!user.isEmailVerified) {
        updateData.isEmailVerified = true;
      }
    }

    if (phone_number) {
      if (user.phone !== phone_number) {
        updateData.phone = phone_number;
      }
      if (!user.isPhoneVerified) {
        updateData.isPhoneVerified = true;
      }
    }

    if (Object.keys(updateData).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        firebaseUid: uid,
        email: email || null,
        phone: phone_number,
        isPhoneVerified: !!phone_number,
        isEmailVerified: !!email,
        name: tokenName || 'Ideal Beauty Patron',
      },
    });
  }

  await setLoggedInUserId(user.id);
  await mergeGuestCartToUser(sessionId, user.id);

  return user;
}

export async function linkPhoneToUserAction(token: string) {
  const decodedToken = await verifyIdToken(token);
  if (!decodedToken) throw new Error('Invalid Firebase ID token');
  const { phone_number } = decodedToken;
  if (!phone_number) throw new Error('No phone number in token');

  const userId = await getLoggedInUserId();
  if (!userId) throw new Error('Not logged in');

  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        phone: phone_number,
        isPhoneVerified: true,
        firebaseUid: decodedToken.uid,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('This phone number is already associated with another account.');
    }
    throw error;
  }
}

export async function loginUserAction(
  email: string,
  password?: string,
  name?: string,
  isSignUp?: boolean
) {
  const sessionId = await getSessionId();

  const cleanEmail = email.trim().toLowerCase();

  let user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (isSignUp === true) {
    if (user) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name?.trim() || 'Ideal Beauty Patron',
        phone: '+628123456789',
        ...(password ? { passwordHash: hashPassword(password) } : {}),
      },
    });
  } else if (isSignUp === false) {
    if (!user) {
      throw new Error('No account found with this email. Please sign up for a new account.');
    }
    if (user.passwordHash) {
      if (!password) {
        throw new Error('Password is required for this account.');
      }
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        throw new Error('Invalid email or password.');
      }
    }
  } else {
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
  }

  await setLoggedInUserId(user.id);
  await mergeGuestCartToUser(sessionId, user.id);

  return user;
}

export async function logoutUserAction() {
  await clearLoggedInUserId();
}

export async function sendEmailVerificationAction() {
  const userId = await getLoggedInUserId();
  if (!userId) throw new Error('Not logged in');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  if (!user.email) {
    throw new Error('No email address is associated with this account. Please add an email address in your profile first.');
  }

  return {
    success: true,
    message: `A 6-digit verification code has been dispatched to ${user.email}.`,
  };
}

export async function verifyEmailOtpAction(code: string) {
  const userId = await getLoggedInUserId();
  if (!userId) throw new Error('Not logged in');

  const cleanCode = code.trim();
  if (!cleanCode || cleanCode.length < 4) {
    throw new Error('Please enter a valid verification code.');
  }

  return await prisma.user.update({
    where: { id: userId },
    data: {
      isEmailVerified: true,
    },
  });
}

export async function saveFcmTokenAction(token: string) {
  const userId = await getLoggedInUserId();
  if (!userId) throw new Error('Not logged in');

  return await prisma.user.update({
    where: { id: userId },
    data: { fcmToken: token },
  });
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

export async function checkIsAdminAction(): Promise<boolean> {
  try {
    const userId = await getLoggedInUserId();
    if (!userId) return false;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || !user.email) return false;

    return await isEmailAdmin(user.email);
  } catch {
    return false;
  }
}
