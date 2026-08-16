import React from 'react';
import { getAdminAccessList } from '@/lib/services/access';
import AdminAccessView from '@/components/admin/AdminAccessView';

export const dynamic = 'force-dynamic';

export default async function AdminAccessPage() {
  const initialAdmins = await getAdminAccessList();

  return (
    <div className="bg-neutral-50/50 min-h-screen">
      <AdminAccessView initialAdmins={initialAdmins} />
    </div>
  );
}
