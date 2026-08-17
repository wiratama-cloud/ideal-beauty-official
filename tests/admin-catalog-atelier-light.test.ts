import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Admin Catalog Atelier Light Design System', () => {
  it('AdminProductsView uses Atelier Light canvas and has no duplicate h1 header', () => {
    const filePath = path.join(process.cwd(), 'src/components/admin/AdminProductsView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Should use bg-neutral-50 container
    expect(content).toContain('bg-neutral-50');
    expect(content).not.toContain('bg-black text-white');

    // Should not contain duplicate in-page h1 heading (handled by AdminHeader / AdminPageHeader)
    expect(content).not.toContain('<h1');
  });

  it('ProductMetricsBar matches Atelier Light card styling', () => {
    const filePath = path.join(process.cwd(), 'src/components/admin/products/ProductMetricsBar.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('bg-white border border-neutral-200');
    expect(content).toContain('font-serif');
    expect(content).not.toContain('bg-neutral-900 border border-neutral-800');
  });

  it('ProductFilterToolbar uses light inputs and buttons', () => {
    const filePath = path.join(process.cwd(), 'src/components/admin/products/ProductFilterToolbar.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('bg-white border border-neutral-200');
    expect(content).not.toContain('bg-neutral-900 border border-neutral-800 rounded-xl');
  });

  it('ProductTable uses light table and border styling', () => {
    const filePath = path.join(process.cwd(), 'src/components/admin/products/ProductTable.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('bg-white border border-neutral-200');
    expect(content).toContain('bg-neutral-50/80');
    expect(content).not.toContain('bg-neutral-950 text-neutral-400');
  });

  it('AdminSizeChartsView uses Atelier Light theme and has no duplicate h1 header', () => {
    const filePath = path.join(process.cwd(), 'src/components/admin/AdminSizeChartsView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('bg-neutral-50');
    expect(content).not.toContain('bg-black text-white');
    expect(content).not.toContain('<h1');
  });

  it('AdminCollectionView uses Atelier Light canvas and light metric cards', () => {
    const filePath = path.join(process.cwd(), 'src/components/admin/AdminCollectionView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('bg-neutral-50');
    expect(content).toContain('bg-white border border-neutral-200');
    expect(content).not.toContain('bg-neutral-900 text-neutral-100 font-sans pb-24');
  });
});
