import React from 'react';
import { getAdminRentalCalendarDataAction } from '@/app/actions/rental';
import AdminCalendarView from '@/components/admin/AdminCalendarView';

export const dynamic = 'force-dynamic';

export default async function AdminCalendarPage() {
  const initialProducts = await getAdminRentalCalendarDataAction();

  return <AdminCalendarView initialProducts={initialProducts} />;
}
