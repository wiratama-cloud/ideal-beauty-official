process.env.USE_IN_MEMORY_DB = 'true';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-bucket';

import { expect, test, describe, beforeEach, vi } from 'vitest';
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
import {
  loginUserAction,
  logoutUserAction,
  verifyFirebaseTokenAction,
  linkPhoneToUserAction,
  saveFcmTokenAction,
  sendEmailVerificationAction,
  verifyEmailOtpAction,
} from '../src/app/actions/auth';
import { getLoggedInUserId, setLoggedInUserId } from '../src/lib/session';
import { uploadFileToFirebase, deleteFileFromFirebase } from '../src/lib/services/firebase-storage';

const {
  cookieStoreMap,
  mockVerifyIdToken,
  mockStorageSave,
  mockStorageDelete,
  mockSendMessage,
} = vi.hoisted(() => {
  process.env.USE_IN_MEMORY_DB = 'true';
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-bucket';

  const cookieStoreMap = new Map<string, string>();

  const mockVerifyIdToken = vi.fn().mockImplementation(async (token: string) => {
    if (token === 'valid_firebase_id_token') {
      return {
        uid: 'firebase_uid_test_123',
        email: 'firebase.patron.new@idealbeautyofficial.com',
        phone_number: '+6289999888877',
      };
    }
    if (token === 'valid_phone_token') {
      return {
        uid: 'firebase_uid_phone_456',
        phone_number: '+6289876543210',
      };
    }
    if (token === 'existing_phone_token') {
      return {
        uid: 'firebase_uid_existing_789',
        phone_number: '+628111111111',
      };
    }
    if (token === 'google_oauth_token') {
      return {
        uid: 'google_uid_101',
        email: 'google.patron@gmail.com',
        name: 'Google Patron Name',
      };
    }
    if (token === 'facebook_oauth_token') {
      return {
        uid: 'facebook_uid_202',
        email: 'facebook.patron@fb.com',
        name: 'Facebook Patron Name',
      };
    }
    if (token === 'apple_oauth_token') {
      return {
        uid: 'apple_uid_303',
        email: 'apple.patron@apple.com',
        name: 'Apple Patron Name',
      };
    }
    return null;
  });

  const mockStorageSave = vi.fn().mockResolvedValue(undefined);
  const mockStorageDelete = vi.fn().mockResolvedValue(undefined);
  const mockSendMessage = vi.fn().mockResolvedValue('projects/test-project/messages/mock-msg-id-123');

  return {
    cookieStoreMap,
    mockVerifyIdToken,
    mockStorageSave,
    mockStorageDelete,
    mockSendMessage,
  };
});

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

vi.mock('@/lib/firebase/admin', () => ({
  firebaseAdmin: {},
  firebaseAdminAuth: {
    verifyIdToken: (token: string) => mockVerifyIdToken(token),
  },
  firebaseAdminMessaging: {
    send: (msg: any) => mockSendMessage(msg),
  },
  firebaseAdminStorage: {
    bucket: vi.fn().mockReturnValue({
      file: vi.fn().mockReturnValue({
        save: mockStorageSave,
        delete: mockStorageDelete,
      }),
    }),
  },
  verifyIdToken: (token: string) => mockVerifyIdToken(token),
}));

vi.mock('firebase-admin/storage', () => ({
  getDownloadURL: vi.fn().mockResolvedValue('https://storage.googleapis.com/test-bucket/uploads/test-image.jpg'),
}));

describe('Account Management Services Unit & Integration Tests', () => {
  let testUser: any;

  beforeEach(async () => {
    cookieStoreMap.clear();
    await prisma.user.updateMany({
      where: { email: 'ayu.lestari@example.com' },
      data: { phone: '+6281234567890', firebaseUid: null },
    });
    await prisma.user.updateMany({
      where: { firebaseUid: { not: null } },
      data: { firebaseUid: null },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: 'idealbeautyofficial.com' } },
          { email: { contains: 'another.patron' } },
        ],
      },
    });

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

    // 1. Signing in with non-existent account in signin mode throws error
    await expect(
      loginUserAction(loginEmail, 'Pass123!', undefined, false)
    ).rejects.toThrow('No account found with this email. Please sign up for a new account.');

    // 2. Sign up creates new account
    const newUser = await loginUserAction(loginEmail, 'SecurePass123', 'New Patron', true);
    expect(newUser.email).toBe(loginEmail);
    expect(newUser.passwordHash).toBeDefined();

    // 3. Attempting to sign up again with existing email throws error
    await expect(
      loginUserAction(loginEmail, 'SecurePass123', 'New Patron', true)
    ).rejects.toThrow('An account with this email already exists. Please sign in instead.');

    // 4. Logging in with incorrect password should throw an error
    await expect(
      loginUserAction(loginEmail, 'WrongPassword', undefined, false)
    ).rejects.toThrow('Invalid email or password.');

    // 5. Logging in without password on password-protected account should throw
    await expect(
      loginUserAction(loginEmail, '', undefined, false)
    ).rejects.toThrow('Password is required for this account.');

    // 6. Logging in with correct password in signin mode succeeds
    const loggedInUser = await loginUserAction(loginEmail, 'SecurePass123', undefined, false);
    expect(loggedInUser.id).toBe(newUser.id);
  });

  test('Firebase Token Verification & Session Sync', async () => {
    // 1. Verify valid ID token creates user and sets session cookie
    const user = await verifyFirebaseTokenAction('valid_firebase_id_token');
    expect(user).toBeDefined();
    expect(user.firebaseUid).toBe('firebase_uid_test_123');
    expect(user.email).toBe('firebase.patron.new@idealbeautyofficial.com');
    expect(user.phone).toBe('+6289999888877');
    expect(user.isPhoneVerified).toBe(true);

    const sessionUserId = await getLoggedInUserId();
    expect(sessionUserId).toBe(user.id);

    // 2. Phone-only SMS OTP verification creates user with nullable email (null)
    const phoneOnlyUser = await verifyFirebaseTokenAction('valid_phone_token');
    expect(phoneOnlyUser).toBeDefined();
    expect(phoneOnlyUser.firebaseUid).toBe('firebase_uid_phone_456');
    expect(phoneOnlyUser.email).toBeNull();
    expect(phoneOnlyUser.phone).toBe('+6289876543210');
    expect(phoneOnlyUser.isPhoneVerified).toBe(true);

    // 3. Subsequent verification with same token upserts existing user
    const reVerifiedUser = await verifyFirebaseTokenAction('valid_firebase_id_token');
    expect(reVerifiedUser.id).toBe(user.id);

    // 4. Invalid token throws error
    await expect(verifyFirebaseTokenAction('invalid_token')).rejects.toThrow('Invalid Firebase ID token');
  });

  test('Firebase Social OAuth Token Verification (Google, Facebook, Apple)', async () => {
    // Google OAuth
    const googleUser = await verifyFirebaseTokenAction('google_oauth_token');
    expect(googleUser.firebaseUid).toBe('google_uid_101');
    expect(googleUser.email).toBe('google.patron@gmail.com');
    expect(googleUser.name).toBe('Google Patron Name');

    // Facebook OAuth
    const fbUser = await verifyFirebaseTokenAction('facebook_oauth_token');
    expect(fbUser.firebaseUid).toBe('facebook_uid_202');
    expect(fbUser.email).toBe('facebook.patron@fb.com');
    expect(fbUser.name).toBe('Facebook Patron Name');

    // Apple OAuth
    const appleUser = await verifyFirebaseTokenAction('apple_oauth_token');
    expect(appleUser.firebaseUid).toBe('apple_uid_303');
    expect(appleUser.email).toBe('apple.patron@apple.com');
    expect(appleUser.name).toBe('Apple Patron Name');
  });

  test('Phone Number Verification & Linking', async () => {
    await setLoggedInUserId(testUser.id);

    // 1. Link phone number successfully
    const updatedUser = await linkPhoneToUserAction('valid_phone_token');
    expect(updatedUser.phone).toBe('+6289876543210');
    expect(updatedUser.isPhoneVerified).toBe(true);
    expect(updatedUser.firebaseUid).toBe('firebase_uid_phone_456');

    // 2. Attempting to link phone number associated with another user fails
    await prisma.user.create({
      data: {
        firebaseUid: 'firebase_uid_existing_789',
        email: 'another.patron@idealbeautyofficial.com',
        phone: '+628111111111',
        isPhoneVerified: true,
      },
    });

    await expect(linkPhoneToUserAction('existing_phone_token')).rejects.toThrow(
      'This phone number is already associated with another account.'
    );
  });

  test('FCM Push Token Save Action', async () => {
    await setLoggedInUserId(testUser.id);

    const updated = await saveFcmTokenAction('mock_fcm_token_12345');
    expect(updated.fcmToken).toBe('mock_fcm_token_12345');

    const fetched = await prisma.user.findUnique({ where: { id: testUser.id } });
    expect(fetched?.fcmToken).toBe('mock_fcm_token_12345');
  });

  test('Email & Phone Re-Verification on Profile Change', async () => {
    // 1. Initial user states
    await prisma.user.update({
      where: { id: testUser.id },
      data: { isEmailVerified: true, isPhoneVerified: true },
    });

    let fetched = await prisma.user.findUnique({ where: { id: testUser.id } });
    expect(fetched?.isEmailVerified).toBe(true);
    expect(fetched?.isPhoneVerified).toBe(true);

    // 2. Updating email resets isEmailVerified to false
    const updatedEmailUser = await updateUserProfile(testUser.id, {
      email: `new.email.${Date.now()}@idealbeautyofficial.com`,
    });
    expect(updatedEmailUser.isEmailVerified).toBe(false);

    // 3. Updating phone resets isPhoneVerified to false
    const updatedPhoneUser = await updateUserProfile(testUser.id, {
      phone: '+6287777666555',
    });
    expect(updatedPhoneUser.isPhoneVerified).toBe(false);

    // 4. Verifying email OTP marks isEmailVerified = true
    await setLoggedInUserId(testUser.id);
    const sendRes = await sendEmailVerificationAction();
    expect(sendRes.success).toBe(true);

    const verifiedEmailUser = await verifyEmailOtpAction('123456');
    expect(verifiedEmailUser.isEmailVerified).toBe(true);

    // 5. Re-verifying phone via linkPhoneToUserAction marks isPhoneVerified = true
    const reVerifiedPhoneUser = await linkPhoneToUserAction('valid_phone_token');
    expect(reVerifiedPhoneUser.isPhoneVerified).toBe(true);
  });
});
