import React from 'react';
import { getFinancialSummary } from '@/lib/services/ledger';
import AdminDashboardView from '@/components/admin/AdminDashboardView';

export default async function AdminDashboardPage() {
  const summary = await getFinancialSummary();

  return (
    <div className="bg-neutral-50/50 min-h-screen">
      <AdminDashboardView summary={summary} />
    </div>
  );
}
