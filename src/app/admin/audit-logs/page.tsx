import React from 'react';
import { getAuditLogs } from '@/lib/services/audit';
import AdminAuditLogsView from '@/components/admin/AdminAuditLogsView';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  const { logs, total } = await getAuditLogs({ limit: 100 });

  return (
    <div className="bg-neutral-50/50 min-h-screen">
      <AdminAuditLogsView initialLogs={logs} initialTotal={total} />
    </div>
  );
}
