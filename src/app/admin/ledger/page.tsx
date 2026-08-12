import React from 'react';
import { getLedgerEntries } from '@/lib/services/ledger';
import AdminLedgerView from '@/components/admin/AdminLedgerView';

export default async function AdminLedgerPage() {
  const entries = await getLedgerEntries();

  return (
    <div className="bg-neutral-50/50 min-h-screen">
      <AdminLedgerView entries={entries} />
    </div>
  );
}
