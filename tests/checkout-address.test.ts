process.env.USE_IN_MEMORY_DB = 'true';

import { expect, test, describe, beforeEach, vi } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  createAddress,
  updateAddress,
  setDefaultAddress,
  getUserAddresses,
} from '../src/lib/services/account';
import {
  getUserAddressesAction,
  createAddressAction,
  updateAddressAction,
  setDefaultAddressAction,
} from '../src/app/actions/account';
import { submitCheckoutAction } from '../src/app/actions/checkout';
import { setLoggedInUserId } from '../src/lib/session';

const { cookieStoreMap } = vi.hoisted(() => {
  const cookieStoreMap = new Map<string, string>();
  return { cookieStoreMap };
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

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe('Checkout Saved Address Book & Selection Flow', () => {
  let testUserId: string;

  beforeEach(async () => {
    cookieStoreMap.clear();
    // Reset test user
    testUserId = `test-user-checkout-${Date.now()}`;
    await prisma.user.create({
      data: {
        id: testUserId,
        email: `patron-${Date.now()}@idealbeauty.id`,
        name: 'Haute Customer',
        phone: '+6281234567890',
      },
    });

    await setLoggedInUserId(testUserId);
  });

  test('should load empty address list when user has no saved addresses', async () => {
    const res = await getUserAddressesAction();
    expect(res.success).toBe(true);
    expect(res.data).toEqual([]);
  });

  test('should create new address during checkout and automatically set it as default if first address', async () => {
    const createRes = await createAddressAction({
      label: 'Home Atelier',
      recipientName: 'Ayu Lestari',
      phone: '+62 812-3456-7890',
      addressLine1: 'Jl. Senopati No. 45, Kebayoran Baru',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12190',
    });

    expect(createRes.success).toBe(true);
    expect(createRes.data).toBeDefined();
    expect(createRes.data?.label).toBe('Home Atelier');
    expect(createRes.data?.recipientName).toBe('Ayu Lestari');
    expect(createRes.data?.isDefault).toBe(true);

    const listRes = await getUserAddressesAction();
    expect(listRes.success).toBe(true);
    expect(listRes.data?.length).toBe(1);
    expect(listRes.data?.[0].id).toBe(createRes.data?.id);
  });

  test('should allow adding multiple addresses and selecting default address', async () => {
    // 1st address (default)
    const addr1 = await createAddressAction({
      label: 'Home',
      recipientName: 'Ayu Home',
      phone: '+62 812-1111-2222',
      addressLine1: 'Jl. Sudirman No. 1',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postalCode: '10220',
    });

    // 2nd address
    const addr2 = await createAddressAction({
      label: 'Office',
      recipientName: 'Ayu Office',
      phone: '+62 812-3333-4444',
      addressLine1: 'Jl. Gatot Subroto No. 50',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12930',
      isDefault: false,
    });

    expect(addr1.success).toBe(true);
    expect(addr2.success).toBe(true);
    expect(addr1.data?.isDefault).toBe(true);
    expect(addr2.data?.isDefault).toBe(false);

    const listRes = await getUserAddressesAction();
    expect(listRes.success).toBe(true);
    expect(listRes.data?.length).toBe(2);

    // Verify default address is sorted first
    expect(listRes.data?.[0].id).toBe(addr1.data?.id);

    // Switch default address to office
    const setDefaultRes = await setDefaultAddressAction(addr2.data!.id);
    expect(setDefaultRes.success).toBe(true);

    const updatedList = await getUserAddressesAction();
    expect(updatedList.data?.[0].id).toBe(addr2.data?.id);
    expect(updatedList.data?.[0].isDefault).toBe(true);
    expect(updatedList.data?.[1].isDefault).toBe(false);
  });

  test('should allow editing an existing saved address', async () => {
    const created = await createAddressAction({
      label: 'Temporary Villa',
      recipientName: 'Ayu Lestari',
      phone: '+62 812-9876-5432',
      addressLine1: 'Jl. Sunset Road No. 88',
      city: 'Badung',
      province: 'Bali',
      postalCode: '80361',
    });

    expect(created.success).toBe(true);
    const addressId = created.data!.id;

    const updateRes = await updateAddressAction(addressId, {
      recipientName: 'Ayu Putri Lestari',
      addressLine1: 'Jl. Petitenget No. 100',
    });

    expect(updateRes.success).toBe(true);
    expect(updateRes.data?.recipientName).toBe('Ayu Putri Lestari');
    expect(updateRes.data?.addressLine1).toBe('Jl. Petitenget No. 100');
    expect(updateRes.data?.city).toBe('Badung');
  });

  test('should validate phone number format when creating address', async () => {
    const res = await createAddressAction({
      label: 'Home',
      recipientName: 'Invalid Phone User',
      phone: '12345',
      addressLine1: 'Jl. Test No. 1',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      postalCode: '10000',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('phone');
  });

  test('should submit order using selected saved address', async () => {
    // Create product, variant, and cart item
    const product = await prisma.product.create({
      data: {
        name: 'Bespoke Silk Gown',
        slug: `bespoke-silk-gown-${Date.now()}`,
        description: 'Silk luxury dress',
        category: 'HAUTE_COUTURE',
        variants: {
          create: {
            sku: `BSG-${Date.now()}`,
            attributes: { size: 'M', color: 'Champagne' },
            stockSaleTotal: 10,
            stockSaleAvailable: 10,
            priceSale: 15000000,
          },
        },
      },
      include: { variants: true },
    });

    const variant = product.variants[0];

    // Create cart
    await prisma.cart.create({
      data: {
        userId: testUserId,
        items: {
          create: {
            variantId: variant.id,
            quantity: 1,
            type: 'SALE',
          },
        },
      },
    });

    // Create saved address
    const addr = await createAddressAction({
      label: 'Home Atelier',
      recipientName: 'Raden Ayu',
      phone: '+62 812-9988-7766',
      addressLine1: 'Jl. Diponegoro No. 12',
      city: 'Surabaya',
      province: 'Jawa Timur',
      postalCode: '60241',
    });

    expect(addr.success).toBe(true);

    const savedAddr = addr.data!;

    // Submit order with the saved address
    const orderResult = await submitCheckoutAction({
      shippingAddress: {
        recipientName: savedAddr.recipientName,
        phone: savedAddr.phone,
        addressLine1: savedAddr.addressLine1,
        city: savedAddr.city,
        province: savedAddr.province,
        postalCode: savedAddr.postalCode,
      },
      paymentType: 'FULL_PAYMENT',
      paymentMethod: 'QRIS',
    });

    expect(orderResult).toBeDefined();
    expect(orderResult.order).toBeDefined();
    expect(orderResult.order.shippingAddressId).toBeDefined();
    expect(orderResult.payment).toBeDefined();

    const orderAddress = await prisma.address.findUnique({
      where: { id: orderResult.order.shippingAddressId },
    });
    expect(orderAddress).toBeDefined();
    expect(orderAddress?.recipientName).toBe(savedAddr.recipientName);
    expect(orderAddress?.phone).toBe(savedAddr.phone);
    expect(orderAddress?.addressLine1).toBe(savedAddr.addressLine1);
    expect(orderAddress?.city).toBe(savedAddr.city);
    expect(orderAddress?.province).toBe(savedAddr.province);
    expect(orderAddress?.postalCode).toBe(savedAddr.postalCode);
  });
});
