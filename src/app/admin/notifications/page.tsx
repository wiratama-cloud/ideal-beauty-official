import React from 'react';
import AdminNotificationsView from '@/components/admin/AdminNotificationsView';
import { getAdminNotificationRecipientsAction } from '@/app/actions/admin';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const recipients = await getAdminNotificationRecipientsAction();

  return (
    <div className="bg-neutral-50/50 min-h-screen">
      <AdminNotificationsView initialRecipients={recipients} />
    </div>
  );
}
