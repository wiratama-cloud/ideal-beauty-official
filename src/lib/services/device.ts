import { prisma } from '../prisma';
import { DeviceType, UserDevice } from '@prisma/client';

export interface RegisterDeviceInput {
  userId: string;
  token: string;
  deviceType?: DeviceType;
  deviceName?: string;
  browser?: string;
  os?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface BackfillUserDevicesResult {
  totalChecked: number;
  migratedCount: number;
}

/**
 * Registers or updates a user device token with metadata.
 * Handles token ownership transfer if the token was previously registered to another user.
 */
export async function registerUserDevice(input: RegisterDeviceInput): Promise<UserDevice> {
  const token = input.token?.trim();
  if (!token) {
    throw new Error('Device token is required');
  }
  if (!input.userId) {
    throw new Error('User ID is required');
  }

  const existingDevice = await prisma.userDevice.findUnique({
    where: { token },
  });

  const now = new Date();
  let userDevice: UserDevice;

  if (existingDevice) {
    userDevice = await prisma.userDevice.update({
      where: { id: existingDevice.id },
      data: {
        userId: input.userId,
        isActive: true,
        lastActiveAt: now,
        ...(input.deviceType !== undefined ? { deviceType: input.deviceType } : {}),
        ...(input.deviceName !== undefined ? { deviceName: input.deviceName } : {}),
        ...(input.browser !== undefined ? { browser: input.browser } : {}),
        ...(input.os !== undefined ? { os: input.os } : {}),
        ...(input.userAgent !== undefined ? { userAgent: input.userAgent } : {}),
        ...(input.ipAddress !== undefined ? { ipAddress: input.ipAddress } : {}),
      },
    });
  } else {
    userDevice = await prisma.userDevice.create({
      data: {
        userId: input.userId,
        token,
        deviceType: input.deviceType || DeviceType.OTHER,
        deviceName: input.deviceName || 'Web Device',
        browser: input.browser || 'Unknown',
        os: input.os || 'Unknown',
        userAgent: input.userAgent || null,
        ipAddress: input.ipAddress || null,
        isActive: true,
        lastActiveAt: now,
      },
    });
  }

  // Synchronize User.fcmToken for backward compatibility
  try {
    await prisma.user.update({
      where: { id: input.userId },
      data: { fcmToken: token },
    });
  } catch {
    // Ignore if user record is unavailable in current context
  }

  return userDevice;
}

/**
 * Retrieves all registered devices for a specific user, sorted by last active timestamp descending.
 */
export async function getUserDevices(userId: string): Promise<UserDevice[]> {
  if (!userId) return [];
  return await prisma.userDevice.findMany({
    where: {
      userId,
    },
    orderBy: {
      lastActiveAt: 'desc',
    },
  });
}

/**
 * Revokes and deletes a specific device belonging to the user.
 */
export async function revokeUserDevice(userId: string, deviceId: string): Promise<{ success: boolean; revokedDeviceId: string }> {
  if (!userId) throw new Error('User ID is required');
  if (!deviceId) throw new Error('Device ID is required');

  const device = await prisma.userDevice.findUnique({
    where: { id: deviceId },
  });

  if (!device || device.userId !== userId) {
    throw new Error('Device not found or not authorized to revoke');
  }

  await prisma.userDevice.delete({
    where: { id: deviceId },
  });

  // If user's primary fcmToken matches the deleted device token, update to next active device or null
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (user && user.fcmToken === device.token) {
      const nextActiveDevice = await prisma.userDevice.findFirst({
        where: { userId, isActive: true },
        orderBy: { lastActiveAt: 'desc' },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken: nextActiveDevice ? nextActiveDevice.token : null },
      });
    }
  } catch {
    // Ignore secondary sync errors
  }

  return { success: true, revokedDeviceId: deviceId };
}

/**
 * Revokes and deletes all other devices for a user except the specified current token or device ID.
 */
export async function revokeAllOtherUserDevices(
  userId: string,
  currentTokenOrId?: string
): Promise<{ success: boolean; revokedCount: number }> {
  if (!userId) throw new Error('User ID is required');

  let keepDevice: UserDevice | null = null;
  if (currentTokenOrId && currentTokenOrId.trim().length > 0) {
    const trimmed = currentTokenOrId.trim();
    keepDevice = await prisma.userDevice.findFirst({
      where: {
        userId,
        OR: [{ token: trimmed }, { id: trimmed }],
      },
    });
  }

  const deleteResult = await prisma.userDevice.deleteMany({
    where: {
      userId,
      ...(keepDevice ? { id: { not: keepDevice.id } } : {}),
    },
  });

  // Sync user.fcmToken to the active remaining device or null
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: keepDevice ? keepDevice.token : null },
    });
  } catch {
    // Ignore secondary sync errors
  }

  return { success: true, revokedCount: deleteResult.count };
}

/**
 * Updates the lastActiveAt timestamp and active status for a given device token.
 */
export async function touchDeviceHeartbeat(token: string, userId?: string): Promise<UserDevice | null> {
  const cleanToken = token?.trim();
  if (!cleanToken) return null;

  const existingDevice = await prisma.userDevice.findUnique({
    where: { token: cleanToken },
  });

  const now = new Date();

  if (existingDevice) {
    const updated = await prisma.userDevice.update({
      where: { id: existingDevice.id },
      data: {
        lastActiveAt: now,
        isActive: true,
        ...(userId && existingDevice.userId !== userId ? { userId } : {}),
      },
    });

    if (userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { fcmToken: cleanToken },
        });
      } catch {}
    }

    return updated;
  }

  if (userId) {
    const created = await prisma.userDevice.create({
      data: {
        userId,
        token: cleanToken,
        deviceType: DeviceType.OTHER,
        deviceName: 'Web Device',
        browser: 'Unknown',
        os: 'Unknown',
        isActive: true,
        lastActiveAt: now,
      },
    });

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken: cleanToken },
      });
    } catch {}

    return created;
  }

  return null;
}

/**
 * Migrates existing non-null User.fcmToken records into UserDevice records.
 * Ensures backward compatibility and populates UserDevice entries.
 */
export async function backfillUserDeviceTokens(): Promise<BackfillUserDevicesResult> {
  try {
    const usersWithTokens = await prisma.user.findMany({
      where: {
        fcmToken: {
          not: null,
        },
      },
      select: {
        id: true,
        fcmToken: true,
        updatedAt: true,
      },
    });

    let migratedCount = 0;

    for (const user of usersWithTokens) {
      if (!user.fcmToken || user.fcmToken.trim().length === 0) {
        continue;
      }

      try {
        const token = user.fcmToken.trim();
        const existingDevice = await prisma.userDevice.findUnique({
          where: { token },
        });

        if (!existingDevice) {
          await prisma.userDevice.create({
            data: {
              userId: user.id,
              token,
              deviceType: DeviceType.OTHER,
              deviceName: 'Migrated Device',
              browser: 'Unknown',
              os: 'Unknown',
              isActive: true,
              lastActiveAt: user.updatedAt || new Date(),
            },
          });
          migratedCount++;
        } else if (existingDevice.userId !== user.id) {
          await prisma.userDevice.update({
            where: { id: existingDevice.id },
            data: {
              userId: user.id,
              isActive: true,
              lastActiveAt: user.updatedAt || new Date(),
            },
          });
          migratedCount++;
        }
      } catch (userError) {
        // Skip user if deleted concurrently or constraint fails
        console.warn(`[UserDevice Backfill] Skipped user ${user.id}:`, userError);
      }
    }

    return {
      totalChecked: usersWithTokens.length,
      migratedCount,
    };
  } catch (error) {
    console.error('Error during UserDevice backfill:', error);
    return {
      totalChecked: 0,
      migratedCount: 0,
    };
  }
}
