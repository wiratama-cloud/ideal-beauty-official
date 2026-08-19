import React from 'react';
import AdminNotificationsView from '@/components/admin/AdminNotificationsView';
import {
  getAdminNotificationRecipientsAction,
  getAdminProductsAction,
  getVouchersAction,
} from '@/app/actions/admin';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const [recipients, products, vouchers] = await Promise.all([
    getAdminNotificationRecipientsAction(),
    getAdminProductsAction(),
    getVouchersAction(),
  ]);

  return (
    <div className="bg-neutral-50/50 min-h-screen">
      <AdminNotificationsView
        initialRecipients={recipients}
        products={products}
        vouchers={vouchers}
      />
    </div>
  );
}
