import { prisma } from '../prisma';

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

  return user;
}
