'use client';

import React from 'react';
import AdminPageHeader, { BreadcrumbItem } from './AdminPageHeader';

export interface AdminHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  activeTab?:
    | 'dashboard'
    | 'products'
    | 'size-charts'
    | 'sections'
    | 'navigation'
    | 'collection'
    | 'orders'
    | 'calendar'
    | 'vouchers'
    | 'notifications'
    | 'ledger'
    | 'audit-logs'
    | 'access'
    | string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * AdminHeader - Backward-compatible wrapper delegating page header rendering
 * to the standardized AdminPageHeader. Layout and sidebar management are now
 * centralized within AdminLayoutShell in src/app/admin/layout.tsx.
 */
export default function AdminHeader({
  title,
  subtitle,
  breadcrumbs,
  badge,
  action,
  children,
  className,
}: AdminHeaderProps) {
  return (
    <AdminPageHeader
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      badge={badge}
      action={action}
      className={className}
    >
      {children}
    </AdminPageHeader>
  );
}

export { AdminPageHeader };
