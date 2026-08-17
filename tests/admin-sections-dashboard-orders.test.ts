import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Admin Sections, Orders, and Dashboard Atelier Light Standardization', () => {
  it('AdminSectionsView uses Atelier Light theme with standard container constraints', () => {
    const filePath = path.join(process.cwd(), 'src/components/admin/AdminSectionsView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Standardized container
    expect(content).toContain('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6');

    // Hero banner converted to Atelier Light
    expect(content).toContain('bg-white text-neutral-900 p-6 sm:p-8 space-y-6 shadow-2xs rounded-xs border border-neutral-200');
    expect(content).not.toContain('bg-neutral-900 text-white p-6 sm:p-8 space-y-6 shadow-md rounded-sm border border-neutral-800');

    // Section cards and items using rounded-xs and shadow-2xs
    expect(content).toContain('rounded-xs shadow-2xs');
    expect(content).not.toContain('rounded-sm');
  });

  it('AdminDashboardView uses standardized container and Atelier Light metric cards', () => {
    const filePath = path.join(process.cwd(), 'src/components/admin/AdminDashboardView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Standardized container
    expect(content).toContain('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6');

    // Top Metric cards with Atelier Light tokens
    expect(content).toContain('bg-white border border-neutral-200 p-5 space-y-2 rounded-xs shadow-2xs');

    // Category breakdown cards
    expect(content).toContain('bg-white border border-neutral-200 p-6 sm:p-8 space-y-4 rounded-xs shadow-2xs');

    // Quick action banner
    expect(content).toContain('bg-neutral-900 text-white p-6 sm:p-8 rounded-xs shadow-2xs border border-neutral-800');
  });

  it('AdminOrdersView and child components adhere to standardized spacing and card tokens', () => {
    const viewPath = path.join(process.cwd(), 'src/components/admin/AdminOrdersView.tsx');
    const viewContent = fs.readFileSync(viewPath, 'utf-8');
    expect(viewContent).toContain('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6');

    const metricsPath = path.join(process.cwd(), 'src/components/admin/orders/OrderMetricsBar.tsx');
    const metricsContent = fs.readFileSync(metricsPath, 'utf-8');
    expect(metricsContent).toContain('bg-white border border-neutral-200 p-4 rounded-xs shadow-2xs');

    const toolbarPath = path.join(process.cwd(), 'src/components/admin/orders/OrderFilterToolbar.tsx');
    const toolbarContent = fs.readFileSync(toolbarPath, 'utf-8');
    expect(toolbarContent).toContain('bg-white border border-neutral-200 rounded-xs');

    const tablePath = path.join(process.cwd(), 'src/components/admin/orders/OrderTable.tsx');
    const tableContent = fs.readFileSync(tablePath, 'utf-8');
    expect(tableContent).toContain('bg-white border border-neutral-200 rounded-xs');
    expect(tableContent).toContain('rounded-xs overflow-hidden');

    const drawerPath = path.join(process.cwd(), 'src/components/admin/orders/OrderDetailDrawer.tsx');
    const drawerContent = fs.readFileSync(drawerPath, 'utf-8');
    expect(drawerContent).toContain('bg-white shadow-2xl');
    expect(drawerContent).toContain('rounded-xs');
  });
});
