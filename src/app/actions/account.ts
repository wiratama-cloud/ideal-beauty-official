'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/session';
import { DeviceType } from '@prisma/client';
import {
  registerUserDevice,
  getUserDevices,
  revokeUserDevice,
  revokeAllOtherUserDevices,
  touchDeviceHeartbeat,
} from '@/lib/services/device';
import { DeviceMetadata } from '@/lib/utils/device';
import {
  getUserAccount,
  getUserAddresses,
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
import { sendPushToUser } from '@/lib/services/notification';

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

export async function getUserAddressesAction() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    const addresses = await getUserAddresses(userId);
    return { success: true, data: addresses };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch addresses' };
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

export type RegisterDeviceActionInput =
  | string
  | {
      token: string;
      deviceType?: DeviceType;
      deviceName?: string;
      browser?: string;
      os?: string;
      userAgent?: string;
      ipAddress?: string;
      metadata?: Partial<DeviceMetadata>;
    };

export async function registerDeviceTokenAction(input: RegisterDeviceActionInput) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }

    let token: string;
    let deviceType: DeviceType | undefined;
    let deviceName: string | undefined;
    let browser: string | undefined;
    let os: string | undefined;
    let userAgent: string | undefined;
    let ipAddress: string | undefined;

    if (typeof input === 'string') {
      token = input;
    } else {
      token = input.token;
      deviceType = (input.deviceType || input.metadata?.deviceType) as DeviceType | undefined;
      deviceName = input.deviceName || input.metadata?.deviceName;
      browser = input.browser || input.metadata?.browser;
      os = input.os || input.metadata?.os;
      userAgent = input.userAgent || input.metadata?.userAgent;
      ipAddress = input.ipAddress;
    }

    const device = await registerUserDevice({
      userId,
      token,
      deviceType,
      deviceName,
      browser,
      os,
      userAgent,
      ipAddress,
    });

    try {
      revalidatePath('/account');
    } catch {
      // Ignored outside Next.js request context
    }

    return { success: true, data: device };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to register device token' };
  }
}

export async function getUserDevicesAction() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    const devices = await getUserDevices(userId);
    return { success: true, data: devices };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch user devices' };
  }
}

export async function revokeDeviceAction(deviceId: string) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    const result = await revokeUserDevice(userId, deviceId);
    try {
      revalidatePath('/account');
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to revoke device' };
  }
}

export async function revokeAllOtherDevicesAction(currentTokenOrId?: string) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    const result = await revokeAllOtherUserDevices(userId, currentTokenOrId);
    try {
      revalidatePath('/account');
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to revoke other devices' };
  }
}

export async function touchDeviceHeartbeatAction(token: string) {
  try {
    const userId = await getSessionUserId();
    const device = await touchDeviceHeartbeat(token, userId || undefined);
    return { success: true, data: device };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update device heartbeat' };
  }
}

export async function deleteFcmTokenAction(token?: string) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }

    if (token) {
      const device = await prisma.userDevice.findFirst({
        where: { userId, token },
      });
      if (device) {
        await prisma.userDevice.delete({ where: { id: device.id } });
      }
    } else {
      await prisma.userDevice.deleteMany({
        where: { userId },
      });
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

export async function saveFcmTokenAction(token: string, metadata?: DeviceMetadata) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    await registerUserDevice({
      userId,
      token,
      deviceType: metadata?.deviceType,
      deviceName: metadata?.deviceName,
      browser: metadata?.browser,
      os: metadata?.os,
      userAgent: metadata?.userAgent,
    });
    const user = await prisma.user.findUnique({ where: { id: userId } });
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

export async function sendTestPushNotificationAction() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'User session not found' };
    }
    const result = await sendPushToUser(userId, {
      title: '✨ Ideal Beauty Push Notification',
      body: 'Push notifications are successfully active on your account!',
      url: '/account?tab=notifications',
    });
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send test notification' };
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
