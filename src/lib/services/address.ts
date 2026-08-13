import { prisma } from '../prisma';

export interface AddressInput {
  id?: string;
  label?: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault?: boolean;
}

export async function getUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getAddressById(addressId: string) {
  return prisma.address.findUnique({
    where: { id: addressId },
  });
}

export async function createAddress(userId: string, data: AddressInput) {
  const existingCount = await prisma.address.count({
    where: { userId },
  });

  const isDefault = data.isDefault || existingCount === 0;

  if (isDefault && existingCount > 0) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  return prisma.address.create({
    data: {
      userId,
      label: data.label || 'Home',
      recipientName: data.recipientName,
      phone: data.phone,
      addressLine1: data.addressLine1,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
      isDefault,
    },
  });
}

export async function updateAddress(
  addressId: string,
  data: Partial<AddressInput>,
  userId?: string
) {
  const existingAddress = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!existingAddress) {
    throw new Error('Address not found');
  }

  if (userId && existingAddress.userId !== userId) {
    throw new Error('Unauthorized address modification');
  }

  const effectiveUserId = existingAddress.userId;

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: effectiveUserId },
      data: { isDefault: false },
    });
  }

  return prisma.address.update({
    where: { id: addressId },
    data: {
      ...(data.label !== undefined && { label: data.label }),
      ...(data.recipientName !== undefined && { recipientName: data.recipientName }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.addressLine1 !== undefined && { addressLine1: data.addressLine1 }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.province !== undefined && { province: data.province }),
      ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
    },
  });
}

export async function deleteAddress(addressId: string, userId?: string) {
  const existingAddress = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!existingAddress) {
    throw new Error('Address not found');
  }

  if (userId && existingAddress.userId !== userId) {
    throw new Error('Unauthorized address deletion');
  }

  const wasDefault = existingAddress.isDefault;
  const effectiveUserId = existingAddress.userId;

  const deleted = await prisma.address.delete({
    where: { id: addressId },
  });

  if (wasDefault) {
    const nextAddress = await prisma.address.findFirst({
      where: { userId: effectiveUserId },
      orderBy: { createdAt: 'desc' },
    });

    if (nextAddress) {
      await prisma.address.update({
        where: { id: nextAddress.id },
        data: { isDefault: true },
      });
    }
  }

  return deleted;
}

export async function setDefaultAddress(userId: string, addressId: string) {
  const existingAddress = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!existingAddress) {
    throw new Error('Address not found');
  }

  if (existingAddress.userId !== userId) {
    throw new Error('Unauthorized default address update');
  }

  await prisma.address.updateMany({
    where: { userId },
    data: { isDefault: false },
  });

  return prisma.address.update({
    where: { id: addressId },
    data: { isDefault: true },
  });
}
