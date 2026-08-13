import crypto from 'crypto';
import { prisma } from '../prisma';

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface UpdatePasswordInput {
  currentPassword?: string;
  newPassword: string;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function updateUserProfile(userId: string, data: UpdateProfileInput) {
  if (data.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing && existing.id !== userId) {
      throw new Error('Email address is already in use by another account');
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
    },
  });
}

export async function updateUserPassword(
  userId: string,
  currentPassword?: string,
  newPassword?: string
) {
  if (!newPassword || newPassword.trim().length < 6) {
    throw new Error('New password must be at least 6 characters long');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // If user already has a password, verify current password
  if (user.passwordHash) {
    if (!currentPassword) {
      throw new Error('Current password is required to update password');
    }
    const isValid = verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Incorrect current password');
    }
  }

  const passwordHash = hashPassword(newPassword);

  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
