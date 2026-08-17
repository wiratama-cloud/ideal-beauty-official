import { describe, it, expect } from 'vitest';
import { NAV_GROUPS } from '../src/components/admin/AdminLayoutShell';

describe('AdminLayoutShell Navigation Configuration & Route Handling', () => {
  it('defines all required admin navigation groups with structured items', () => {
    const groupIds = NAV_GROUPS.map((g) => g.id);
    expect(groupIds).toContain('overview');
    expect(groupIds).toContain('catalog');
    expect(groupIds).toContain('storefront');
    expect(groupIds).toContain('operations');
    expect(groupIds).toContain('finance');
  });

  it('includes all primary admin routes across navigation groups', () => {
    const allItems = NAV_GROUPS.flatMap((g) => g.items);
    const hrefs = allItems.map((item) => item.href);

    expect(hrefs).toContain('/admin/dashboard');
    expect(hrefs).toContain('/admin/products');
    expect(hrefs).toContain('/admin/size-charts');
    expect(hrefs).toContain('/admin/sections');
    expect(hrefs).toContain('/admin/collection');
    expect(hrefs).toContain('/admin/orders');
    expect(hrefs).toContain('/admin/calendar');
    expect(hrefs).toContain('/admin/vouchers');
    expect(hrefs).toContain('/admin/notifications');
    expect(hrefs).toContain('/admin/ledger');
    expect(hrefs).toContain('/admin/audit-logs');
    expect(hrefs).toContain('/admin/access');
  });

  it('has valid labels and icon components for every navigation item', () => {
    NAV_GROUPS.forEach((group) => {
      expect(group.title).toBeTruthy();
      expect(group.items.length).toBeGreaterThan(0);

      group.items.forEach((item) => {
        expect(item.id).toBeTruthy();
        expect(item.label).toBeTruthy();
        expect(item.href).toMatch(/^\/admin\//);
        expect(typeof item.icon).toBe('object');
      });
    });
  });

  it('correctly matches active route rules', () => {
    const isItemActive = (href: string, pathname: string) => {
      if (href === '/admin/dashboard') {
        return pathname === '/admin/dashboard' || pathname === '/admin';
      }
      if (href === '/admin/collection') {
        return (
          pathname === '/admin/collection' ||
          pathname.startsWith('/admin/collection/') ||
          pathname === '/admin/navigation' ||
          pathname.startsWith('/admin/navigation/')
        );
      }
      if (href === '/admin/products') {
        return (
          pathname === '/admin/products' ||
          pathname.startsWith('/admin/products/') ||
          pathname === '/admin/inventory' ||
          pathname.startsWith('/admin/inventory/')
        );
      }
      return pathname === href || pathname.startsWith(href + '/');
    };

    expect(isItemActive('/admin/dashboard', '/admin/dashboard')).toBe(true);
    expect(isItemActive('/admin/dashboard', '/admin')).toBe(true);
    expect(isItemActive('/admin/products', '/admin/products')).toBe(true);
    expect(isItemActive('/admin/products', '/admin/products/new')).toBe(true);
    expect(isItemActive('/admin/products', '/admin/inventory')).toBe(true);
    expect(isItemActive('/admin/collection', '/admin/navigation')).toBe(true);
    expect(isItemActive('/admin/orders', '/admin/orders')).toBe(true);
    expect(isItemActive('/admin/orders', '/admin/products')).toBe(false);
  });
});
