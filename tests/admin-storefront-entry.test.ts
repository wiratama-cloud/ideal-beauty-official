import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkIsAdminAction } from '../src/app/actions/auth';
import { getPrimaryAdminEmail } from '../src/lib/services/access';
import { prisma } from '../src/lib/prisma';
import { setLoggedInUserId, clearLoggedInUserId } from '../src/lib/session';

const cookieStoreMap = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockImplementation(async () => ({
    get: (name: string) => {
      const val = cookieStoreMap.get(name);
      return val ? { value: val } : undefined;
    },
    set: (name: string, value: string) => {
      cookieStoreMap.set(name, value);
    },
    delete: (name: string) => {
      cookieStoreMap.delete(name);
    },
  })),
}));

describe('Storefront Admin Portal Entry Feature', () => {
  const primaryAdminEmail = getPrimaryAdminEmail();

  beforeEach(async () => {
    cookieStoreMap.clear();
    await clearLoggedInUserId();
  });

  it('should return false for checkIsAdminAction when no user is logged in', async () => {
    const isAdmin = await checkIsAdminAction();
    expect(isAdmin).toBe(false);
  });

  it('should return true for checkIsAdminAction when logged in as admin user', async () => {
    // Ensure admin user exists in DB
    let adminUser = await prisma.user.findFirst({
      where: { email: primaryAdminEmail },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: primaryAdminEmail,
          name: 'Primary Admin User',
          isEmailVerified: true,
        },
      });
    }

    await setLoggedInUserId(adminUser.id);

    const isAdmin = await checkIsAdminAction();
    expect(isAdmin).toBe(true);
  });

  it('should return false for checkIsAdminAction when logged in as regular customer', async () => {
    const customerEmail = `customer.${Date.now()}@example.com`;
    const customerUser = await prisma.user.create({
      data: {
        email: customerEmail,
        name: 'Regular Customer',
        isEmailVerified: true,
      },
    });

    await setLoggedInUserId(customerUser.id);

    const isAdmin = await checkIsAdminAction();
    expect(isAdmin).toBe(false);

    // Cleanup
    await prisma.user.delete({ where: { id: customerUser.id } });
  });
});
