import React from 'react';
import AdminVouchersView from '@/components/admin/AdminVouchersView';
import { getVouchersAction, getCustomersAction } from '@/app/actions/admin';

export const dynamic = 'force-dynamic';

export default async function AdminVouchersPage() {
  const [vouchers, customers] = await Promise.all([
    getVouchersAction(),
    getCustomersAction(),
  ]);

  return <AdminVouchersView initialVouchers={vouchers as any} customers={customers as any} />;
}
