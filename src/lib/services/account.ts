import { prisma } from '../prisma';
import { getUserVouchers } from './voucher';

export * from './user';
export * from './address';

export async function getUserAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      },
      _count: {
        select: {
          orders: true,
          wishlist: true,
        },
      },
    },
  });

  if (!user) return null;

  const userVouchers = await getUserVouchers(userId);
  const vouchersCount = userVouchers.filter((v) => v.isAvailable).length;

  return {
    ...user,
    _count: {
      ...user._count,
      vouchers: vouchersCount,
    },
    vouchersCount,
    availableVouchersCount: vouchersCount,
  };
}
