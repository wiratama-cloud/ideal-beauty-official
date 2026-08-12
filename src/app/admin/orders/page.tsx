import React from 'react';
import { getAllOrdersAdminAction } from '@/app/actions/admin';
import AdminOrdersView from '@/components/admin/AdminOrdersView';

export default async function AdminOrdersPage() {
  const orders = await getAllOrdersAdminAction();

  return (
    <div className="bg-neutral-50/50 min-h-screen">
      <AdminOrdersView orders={orders} />
    </div>
  );
}
