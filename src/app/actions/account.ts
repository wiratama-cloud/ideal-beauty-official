'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/session';
import {
  getUserAccount,
  updateUserProfile,
  updateUserPassword,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  UpdateProfileInput,
  UpdatePasswordInput,
  AddressInput,
} from '@/lib/services/account';
import {
  getUserVouchers,
  getUserVoucherHistory,
  checkVoucher,
} from '@/lib/services/voucher';

export async function getUserAccountAction() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    const account = await getUserAccount(userId);
    return { success: true, data: account };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch account data' };
  }
}

export async function updateProfileAction(data: UpdateProfileInput) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    const user = await updateUserProfile(userId, data);
    revalidatePath('/account');
    return { success: true, data: user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update profile' };
  }
}

export async function updatePasswordAction(data: UpdatePasswordInput) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    const user = await updateUserPassword(userId, data.currentPassword, data.newPassword);
    revalidatePath('/account');
    return { success: true, data: user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update password' };
  }
}

export async function createAddressAction(data: AddressInput) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    const address = await createAddress(userId, data);
    revalidatePath('/account');
    return { success: true, data: address };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create address' };
  }
}

export async function updateAddressAction(addressId: string, data: Partial<AddressInput>) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    const address = await updateAddress(addressId, data, userId);
    revalidatePath('/account');
    return { success: true, data: address };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update address' };
  }
}

export async function deleteAddressAction(addressId: string) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    await deleteAddress(addressId, userId);
    revalidatePath('/account');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete address' };
  }
}

export async function setDefaultAddressAction(addressId: string) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    const address = await setDefaultAddress(userId, addressId);
    revalidatePath('/account');
    return { success: true, data: address };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to set default address' };
  }
}

export async function deleteFcmTokenAction() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null },
    });
    try {
      revalidatePath('/account');
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to disable notifications' };
  }
}

export async function saveFcmTokenAction(token: string) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token },
    });
    try {
      revalidatePath('/account');
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save notification token' };
  }
}

export async function getUserVouchersAction() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    const vouchers = await getUserVouchers(userId);
    const history = await getUserVoucherHistory(userId);
    return {
      success: true,
      data: {
        vouchers,
        history,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch vouchers' };
  }
}

export async function checkVoucherAction(code: string) {
  try {
    const userId = await getSessionUserId();
    const result = await checkVoucher(code, userId);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to check voucher' };
  }
}

export async function claimOrCheckVoucherAction(code: string) {
  return checkVoucherAction(code);
}
