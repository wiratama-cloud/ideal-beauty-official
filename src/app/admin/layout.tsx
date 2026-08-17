export const dynamic = 'force-dynamic';

import { requireAdminAccess } from '@/lib/services/access';
import { redirect } from 'next/navigation';
import AdminLayoutShell from '@/components/admin/AdminLayoutShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let isAuthorized = false;
  try {
    await requireAdminAccess();
    isAuthorized = true;
  } catch {
    isAuthorized = false;
  }

  if (!isAuthorized) {
    redirect('/login');
  }

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
