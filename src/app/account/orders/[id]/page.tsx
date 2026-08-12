import React from 'react';
import { notFound } from 'next/navigation';
import { getOrderById } from '@/lib/services/order';
import OrderDetailView from '@/components/account/OrderDetailView';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="bg-neutral-50/50 min-h-screen">
      <OrderDetailView order={order} />
    </div>
  );
}
