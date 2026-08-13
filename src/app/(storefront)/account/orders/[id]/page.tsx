import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { getOrderById } from '@/lib/services/order';
import { getLoggedInUserId } from '@/lib/session';
import OrderDetailView from '@/components/account/OrderDetailView';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const userId = await getLoggedInUserId();

  if (!userId) {
    redirect(`/login?redirect=${encodeURIComponent(`/account/orders/${id}`)}`);
  }

  const order = await getOrderById(id);

  if (!order || order.userId !== userId) {
    notFound();
  }

  return (
    <div className="bg-neutral-50/50 min-h-screen">
      <OrderDetailView order={order} />
    </div>
  );
}
