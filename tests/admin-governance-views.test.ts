import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Admin Governance & Auxiliary Views Harmonization', () => {
  it('AdminAccessView uses standardized container and Atelier Light tokens', () => {
    const filePath = path.join(process.cwd(), 'src/components/admin/AdminAccessView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6');
    expect(content).toContain('bg-white p-5 border border-neutral-200 rounded-xs shadow-2xs');
    expect(content).toContain('bg-white border border-neutral-200 rounded-xs shadow-2xs overflow-hidden');
    expect(content).toContain('bg-neutral-50/80 text-neutral-500 uppercase font-mono text-[10px]');
    expect(content).not.toContain('rounded-sm');
  });

  it('AdminAuditLogsView uses standardized container and Atelier Light tokens', () => {
    const filePath = path.join(process.cwd(), 'src/components/admin/AdminAuditLogsView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6');
    expect(content).toContain('bg-white p-4 sm:p-6 border border-neutral-200 space-y-4 rounded-xs shadow-2xs');
    expect(content).toContain('bg-white border border-neutral-200 rounded-xs overflow-hidden shadow-2xs');
    expect(content).toContain('bg-neutral-50/80 text-[10px] font-mono uppercase tracking-wider');
  });

  it('AdminCalendarView uses standardized container and Atelier Light tokens', () => {
    const filePath = path.join(process.cwd(), 'src/components/admin/AdminCalendarView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6');
    expect(content).toContain('bg-white p-5 border border-neutral-200 shadow-2xs rounded-xs');
    expect(content).toContain('bg-white border border-neutral-200 shadow-2xs rounded-xs overflow-hidden');
    expect(content).toContain('bg-neutral-50/80 border-b border-neutral-200 text-[10px] font-mono');
  });

  it('AdminLedgerView uses standardized container and Atelier Light tokens', () => {
    const filePath = path.join(process.cwd(), 'src/components/admin/AdminLedgerView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6');
    expect(content).toContain('bg-white p-6 sm:p-8 border border-neutral-200 space-y-4 rounded-xs shadow-2xs');
    expect(content).toContain('bg-white border border-neutral-200 rounded-xs overflow-hidden shadow-2xs');
    expect(content).toContain('bg-neutral-50/80 text-[10px] font-mono uppercase tracking-wider');
  });

  it('AdminNotificationsView uses standardized container and Atelier Light tokens', () => {
    const filePath = path.join(process.cwd(), 'src/components/admin/AdminNotificationsView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6');
    expect(content).toContain('bg-white border border-neutral-200 p-5 rounded-xs space-y-1 shadow-2xs');
    expect(content).toContain('bg-white border border-neutral-200 p-6 rounded-xs space-y-6 shadow-2xs');
    expect(content).toContain('bg-white border border-neutral-200 p-6 rounded-xs space-y-4 shadow-2xs');
  });

  it('AdminVouchersView uses standardized container and Atelier Light tokens', () => {
    const filePath = path.join(process.cwd(), 'src/components/admin/AdminVouchersView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6');
    expect(content).toContain('bg-white p-5 border border-neutral-200 rounded-xs shadow-2xs flex items-center justify-between');
    expect(content).toContain('bg-white p-4 border border-neutral-200 rounded-xs shadow-2xs');
    expect(content).toContain('bg-white border border-neutral-200 rounded-xs overflow-hidden shadow-2xs');
    expect(content).toContain('bg-neutral-50/80 border-b border-neutral-200 text-[10px] font-mono');
  });

  it('All 12 admin views consistently employ standard max-w-7xl container constraints', () => {
    const views = [
      'AdminDashboardView.tsx',
      'AdminProductsView.tsx',
      'AdminOrdersView.tsx',
      'AdminCollectionView.tsx',
      'AdminSizeChartsView.tsx',
      'AdminSectionsView.tsx',
      'AdminAccessView.tsx',
      'AdminAuditLogsView.tsx',
      'AdminCalendarView.tsx',
      'AdminLedgerView.tsx',
      'AdminNotificationsView.tsx',
      'AdminVouchersView.tsx',
    ];

    views.forEach((file) => {
      const p = path.join(process.cwd(), 'src/components/admin', file);
      const content = fs.readFileSync(p, 'utf-8');
      expect(content).toContain('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6');
    });
  });
});
