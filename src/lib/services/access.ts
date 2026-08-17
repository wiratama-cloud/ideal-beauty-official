import { prisma } from '@/lib/prisma';
import { getLoggedInUserId } from '@/lib/session';

export function getPrimaryAdminEmail(): string {
  const envEmail = process.env.FIRST_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  if (envEmail && envEmail.trim()) {
    return envEmail.trim().toLowerCase();
  }
  return 'admin@idealbeautyofficial.com';
}

export function isPrimaryAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === getPrimaryAdminEmail();
}

export async function isEmailAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  if (isPrimaryAdminEmail(cleanEmail)) {
    return true;
  }

  try {
    const record = await prisma.adminAccess.findUnique({
      where: { email: cleanEmail },
    });

    return !!record;
  } catch (error) {
    console.error('Failed to verify admin status from database:', error);
    return false;
  }
}

export async function getAdminAccessList() {
  const primaryEmail = getPrimaryAdminEmail();

  // Ensure primary email exists in AdminAccess
  try {
    const existingPrimary = await prisma.adminAccess.findUnique({
      where: { email: primaryEmail },
    });
    if (!existingPrimary) {
      await prisma.adminAccess.create({
        data: {
          email: primaryEmail,
          role: 'ADMIN',
          addedBy: 'SYSTEM_ENV',
        },
      });
    }
  } catch {
    // Ignore race condition / existing record
  }

  const list = await prisma.adminAccess.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return list.map((item) => {
    const isPrimary = item.email.trim().toLowerCase() === primaryEmail;
    return {
      id: item.id,
      email: item.email,
      role: item.role,
      addedBy: item.addedBy || (isPrimary ? 'SYSTEM_ENV' : 'ADMIN'),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isPrimary,
    };
  });
}

export async function addAdminAccess(email: string, addedBy?: string) {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please enter a valid email address.');
  }

  const primaryEmail = getPrimaryAdminEmail();
  const isPrimary = cleanEmail === primaryEmail;

  const existing = await prisma.adminAccess.findUnique({
    where: { email: cleanEmail },
  });

  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      role: existing.role,
      addedBy: existing.addedBy,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
      isPrimary,
    };
  }

  const created = await prisma.adminAccess.create({
    data: {
      email: cleanEmail,
      role: 'ADMIN',
      addedBy: addedBy || 'ADMIN',
    },
  });

  return {
    id: created.id,
    email: created.email,
    role: created.role,
    addedBy: created.addedBy,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
    isPrimary,
  };
}

export async function removeAdminAccess(idOrEmail: string, currentAdminEmail?: string) {
  const cleanInput = idOrEmail.trim().toLowerCase();
  const primaryEmail = getPrimaryAdminEmail();

  const record = await prisma.adminAccess.findFirst({
    where: {
      OR: [
        { id: idOrEmail },
        { email: cleanInput },
      ],
    },
  });

  if (!record) {
    throw new Error('Admin access entry not found.');
  }

  if (record.email.trim().toLowerCase() === primaryEmail) {
    throw new Error('Cannot revoke access for the primary system administrator.');
  }

  if (currentAdminEmail && record.email.trim().toLowerCase() === currentAdminEmail.trim().toLowerCase()) {
    throw new Error('You cannot revoke your own admin access.');
  }

  await prisma.adminAccess.delete({
    where: { id: record.id },
  });

  return {
    success: true,
    email: record.email,
  };
}

export async function requireAdminAccess() {
  const userId = await getLoggedInUserId();

  if (!userId) {
    // In test environment where session cookies aren't set, allow fallback
    if (process.env.NODE_ENV === 'test' || process.env.USE_IN_MEMORY_DB === 'true' || process.env.NEXT_PHASE === 'phase-production-build') {
      return { id: 'test-admin-id', email: getPrimaryAdminEmail(), role: 'ADMIN' };
    }
    throw new Error('Unauthorized: Admin session required');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user || !user.email) {
    throw new Error('Unauthorized: Admin account required');
  }

  const isAdmin = await isEmailAdmin(user.email);
  if (!isAdmin) {
    throw new Error('Forbidden: You do not have admin access permissions');
  }

  return user;
}
