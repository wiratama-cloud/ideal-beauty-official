import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Header Layout & Rearranged Action Items', () => {
  it('should have a 12-column grid layout for header centering', () => {
    const headerPath = path.resolve(__dirname, '../src/components/layout/Header.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf-8');

    // Verify grid layout with 12 columns
    expect(headerContent).toContain('grid grid-cols-12 items-center');

    // Verify logo center spans 6 columns with flex centering
    expect(headerContent).toContain('col-span-6 flex flex-col items-center justify-center text-center');

    // Verify logo text content "IDEAL BEAUTY" and "OFFICIAL"
    expect(headerContent).toContain('IDEAL BEAUTY');
    expect(headerContent).toContain('OFFICIAL');
  });

  it('should contain right action items in order: ADMIN, Liked, Bags, Orders, Profile / Login using icons', () => {
    const headerPath = path.resolve(__dirname, '../src/components/layout/Header.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf-8');

    const actionIconsSection = headerContent.slice(headerContent.indexOf('Action Icons Right'));

    // Check presence of ADMIN link, Liked link, Bags button, Orders link, Profile / Login link
    expect(actionIconsSection).toContain('href="/admin/dashboard"');
    expect(actionIconsSection).toContain('href="/account/wishlist"');
    expect(actionIconsSection).toContain('aria-label="Shopping Cart"');
    expect(actionIconsSection).toContain('href="/account/orders"');
    expect(actionIconsSection).toContain('href="/account"');
    expect(actionIconsSection).toContain('href="/login"');

    // Check relative ordering in code: Liked -> Bags -> Orders -> Login
    const adminIdx = actionIconsSection.indexOf('href="/admin/dashboard"');
    const likedIdx = actionIconsSection.indexOf('href="/account/wishlist"');
    const bagsIdx = actionIconsSection.indexOf('aria-label="Shopping Cart"');
    const ordersIdx = actionIconsSection.indexOf('href="/account/orders"');
    const profileIdx = actionIconsSection.indexOf('href="/account"');
    const loginIdx = actionIconsSection.indexOf('href="/login"');

    expect(adminIdx).toBeLessThan(likedIdx);
    expect(likedIdx).toBeLessThan(bagsIdx);
    expect(bagsIdx).toBeLessThan(ordersIdx);
    expect(ordersIdx).toBeLessThan(profileIdx);
    expect(profileIdx).toBeLessThan(loginIdx);
  });
});
