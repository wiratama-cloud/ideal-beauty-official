process.env.USE_IN_MEMORY_DB = 'true';

import { expect, test, describe, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  getUserAccount,
  updateUserProfile,
  updateUserPassword,
  verifyPassword,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getUserAddresses,
} from '../src/lib/services/account';
import { loginUserAction, logoutUserAction } from '../src/app/actions/auth';
import { getLoggedInUserId } from '../src/lib/session';

describe('Account Management Services Unit & Integration Tests', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: {
        email: `account.test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@idealbeautyofficial.com`,
        name: 'Account Test User',
        phone: '+628999999999',
      },
    });
  });

  test('User Profile Update', async () => {
    const updated = await updateUserProfile(testUser.id, {
      name: 'Account Test User Updated',
      phone: '+628999999888',
    });

    expect(updated.name).toBe('Account Test User Updated');
    expect(updated.phone).toBe('+628999999888');

    const fetched = await prisma.user.findUnique({ where: { id: testUser.id } });
    expect(fetched?.name).toBe('Account Test User Updated');
  });

  test('User Password Management', async () => {
    // Set initial password
    const userWithPass = await updateUserPassword(testUser.id, undefined, 'InitialPass123');
    expect(userWithPass.passwordHash).toBeDefined();
    expect(verifyPassword('InitialPass123', userWithPass.passwordHash!)).toBe(true);

    // Fail to update with incorrect current password
    await expect(
      updateUserPassword(testUser.id, 'WrongPass123', 'NewPass123')
    ).rejects.toThrow('Incorrect current password');

    // Successfully update password with correct current password
    const userWithNewPass = await updateUserPassword(testUser.id, 'InitialPass123', 'NewPass123');
    expect(verifyPassword('NewPass123', userWithNewPass.passwordHash!)).toBe(true);
  });

  test('Address CRUD & Default Management', async () => {
    // 1. Create first address (should automatically become default)
    const addr1 = await createAddress(testUser.id, {
      label: 'Home',
      recipientName: 'Test Recipient 1',
      phone: '+628123456789',
      addressLine1: 'Jl. Sudirman No. 123',
      city: 'Jakarta South',
      province: 'DKI Jakarta',
      postalCode: '12190',
    });

    expect(addr1.isDefault).toBe(true);
    expect(addr1.label).toBe('Home');

    // 2. Create second address (isDefault = false)
    const addr2 = await createAddress(testUser.id, {
      label: 'Office',
      recipientName: 'Test Recipient 2',
      phone: '+628987654321',
      addressLine1: 'Jl. MH Thamrin No. 45',
      city: 'Jakarta Central',
      province: 'DKI Jakarta',
      postalCode: '10350',
      isDefault: false,
    });

    expect(addr2.isDefault).toBe(false);

    let addresses = await getUserAddresses(testUser.id);
    expect(addresses.length).toBe(2);
    expect(addresses[0].id).toBe(addr1.id); // Default address comes first

    // 3. Set second address as default
    await setDefaultAddress(testUser.id, addr2.id);

    addresses = await getUserAddresses(testUser.id);
    expect(addresses[0].id).toBe(addr2.id);
    expect(addresses[0].isDefault).toBe(true);
    expect(addresses[1].id).toBe(addr1.id);
    expect(addresses[1].isDefault).toBe(false);

    // 4. Update address details
    const updatedAddr1 = await updateAddress(addr1.id, {
      addressLine1: 'Jl. Sudirman No. 999',
    }, testUser.id);
    expect(updatedAddr1.addressLine1).toBe('Jl. Sudirman No. 999');

    // 5. Delete active default address (addr2) -> addr1 should automatically become default
    await deleteAddress(addr2.id, testUser.id);

    addresses = await getUserAddresses(testUser.id);
    expect(addresses.length).toBe(1);
    expect(addresses[0].id).toBe(addr1.id);
    expect(addresses[0].isDefault).toBe(true);
  });

  test('getUserAccount summary retrieval', async () => {
    await createAddress(testUser.id, {
      label: 'Home',
      recipientName: 'Test Recipient 1',
      phone: '+628123456789',
      addressLine1: 'Jl. Sudirman No. 123',
      city: 'Jakarta South',
      province: 'DKI Jakarta',
      postalCode: '12190',
    });

    const account = await getUserAccount(testUser.id);
    expect(account).toBeDefined();
    expect(account?.id).toBe(testUser.id);
    expect(account?.addresses.length).toBeGreaterThan(0);
    expect(account?._count).toHaveProperty('orders');
    expect(account?._count).toHaveProperty('wishlist');
  });

  test('Authentication login and logout actions with password validation', async () => {
    const loginEmail = `login.test_${Date.now()}@idealbeautyofficial.com`;

    // 1. First login creates new account with optional password
    const newUser = await loginUserAction(loginEmail, 'SecurePass123', 'New Patron');
    expect(newUser.email).toBe(loginEmail);
    expect(newUser.passwordHash).toBeDefined();

    // 2. Logging in with incorrect password should throw an error
    await expect(
      loginUserAction(loginEmail, 'WrongPassword')
    ).rejects.toThrow('Invalid email or password.');

    // 3. Logging in without password on password-protected account should throw
    await expect(
      loginUserAction(loginEmail, '')
    ).rejects.toThrow('Password is required for this account.');

    // 4. Logging in with correct password succeeds
    const loggedInUser = await loginUserAction(loginEmail, 'SecurePass123');
    expect(loggedInUser.id).toBe(newUser.id);
  });
});
