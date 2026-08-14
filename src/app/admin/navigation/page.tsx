import { redirect } from 'next/navigation';

export default function AdminNavigationRedirectPage() {
  redirect('/admin/collection');
}
