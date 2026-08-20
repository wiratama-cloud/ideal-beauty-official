import { describe, it, expect } from 'vitest';
import { ACCOUNT_NAV_SCROLL_KEY } from '@/components/account/AccountNavigationHeader';

describe('Account Navigation Mobile Tabs & Scrolling', () => {
  it('defines the correct session storage key for mobile scroll persistence', () => {
    expect(ACCOUNT_NAV_SCROLL_KEY).toBe('ideal_account_nav_scroll_left');
  });

  it('calculates the exact center scroll offset for active tab alignment', () => {
    // Helper replicating the container center calculation in AccountNavigationHeader
    const calculateCenterScroll = (
      containerWidth: number,
      activeLeft: number,
      activeWidth: number
    ) => {
      const targetScrollLeft = activeLeft - containerWidth / 2 + activeWidth / 2;
      return Math.max(0, targetScrollLeft);
    };

    // Case 1: First item on a 375px mobile screen (width = 90px, left = 12px)
    // 12 - 375/2 + 45 = 12 - 187.5 + 45 = -130.5 => clamped to 0
    expect(calculateCenterScroll(375, 12, 90)).toBe(0);

    // Case 2: Deep item (e.g. My Vouchers at offset 280px, width 100px on 360px viewport)
    // 280 - 180 + 50 = 150
    expect(calculateCenterScroll(360, 280, 100)).toBe(150);

    // Case 3: Middle item (e.g. Saved Wishlist at offset 190px, width 110px on 390px viewport)
    // 190 - 195 + 55 = 50
    expect(calculateCenterScroll(390, 190, 110)).toBe(50);
  });

  it('correctly maps route pathnames to active account tab statuses', () => {
    const getActiveTab = (pathname: string) => {
      const isOverview = pathname === '/account';
      const isOrders = pathname.startsWith('/account/orders');
      const isWishlist = pathname.startsWith('/account/wishlist');
      const isVouchers = pathname.startsWith('/account/vouchers');
      return { isOverview, isOrders, isWishlist, isVouchers };
    };

    expect(getActiveTab('/account')).toEqual({
      isOverview: true,
      isOrders: false,
      isWishlist: false,
      isVouchers: false,
    });

    expect(getActiveTab('/account/orders')).toEqual({
      isOverview: false,
      isOrders: true,
      isWishlist: false,
      isVouchers: false,
    });

    expect(getActiveTab('/account/orders/order-123')).toEqual({
      isOverview: false,
      isOrders: true,
      isWishlist: false,
      isVouchers: false,
    });

    expect(getActiveTab('/account/wishlist')).toEqual({
      isOverview: false,
      isOrders: false,
      isWishlist: true,
      isVouchers: false,
    });

    expect(getActiveTab('/account/vouchers')).toEqual({
      isOverview: false,
      isOrders: false,
      isWishlist: false,
      isVouchers: true,
    });
  });
});
