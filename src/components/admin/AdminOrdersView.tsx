'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingBag, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { updateRentalStatusAction } from '@/app/actions/admin';

interface AdminOrdersViewProps {
  orders: any[];
}

export default function AdminOrdersView({ orders: initialOrders }: AdminOrdersViewProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleRentalStatusChange = async (orderItemId: string, newStatus: any) => {
    setUpdatingItemId(orderItemId);
    try {
      await updateRentalStatusAction(orderItemId, newStatus);
      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          items: order.items.map((item: any) =>
            item.id === orderItemId ? { ...item, rentalStatus: newStatus } : item
          ),
        }))
      );
    } catch (err) {
      console.error('Failed to update rental status:', err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-light text-xs space-y-8">
      <div className="flex items-center space-x-2 text-neutral-500">
        <Link href="/admin/dashboard" className="hover:text-black flex items-center space-x-1 uppercase tracking-widest text-[10px]">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="border-b border-neutral-200 pb-4">
        <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-sans block mb-1">
          ATELIER MANAGEMENT
        </span>
        <h1 className="font-serif text-3xl font-light text-neutral-900">
          Order Fulfillment & Rental Tracking ({orders.length})
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-neutral-100 p-12 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
          <h2 className="font-serif text-xl text-neutral-800">No Orders Available</h2>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const completedPaymentsTotal = order.payments
              .filter((p: any) => p.status === 'COMPLETED')
              .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

            const remainingBalance = Number(order.totalAmount) - completedPaymentsTotal;

            return (
              <div key={order.id} className="bg-white border border-neutral-100 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <span className="font-serif text-base font-medium text-neutral-900">
                      Order #{order.id}
                    </span>
                    <p className="text-neutral-400 font-mono text-[11px] mt-0.5">
                      Customer: {order.user?.name || 'Guest'} ({order.user?.email}) &bull; Date:{' '}
                      {new Date(order.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 font-mono">
                    {order.status === 'PAID' || order.status === 'COMPLETED' ? (
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 uppercase tracking-wider text-[10px] font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PAID IN FULL</span>
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 px-3 py-1 uppercase tracking-wider text-[10px] font-bold flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>PARTIALLY PAID</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Items & Rental Management */}
                <div className="divide-y divide-neutral-100 space-y-4">
                  {order.items.map((item: any) => {
                    const product = item.variant?.product;
                    const image =
                      product?.images?.[0] ||
                      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop';

                    return (
                      <div key={item.id} className="pt-4 first:pt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="relative w-16 aspect-[3/4] bg-neutral-100 flex-shrink-0">
                            <Image src={image} alt={product?.name || ''} fill className="object-cover" unoptimized />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-serif text-sm text-neutral-900 font-medium">{product?.name}</h3>
                            <p className="text-[10px] text-neutral-500 font-mono">
                              Type: <strong className="text-neutral-800">{item.type}</strong> &bull; SKU: {item.variant?.sku}
                            </p>

                            {item.type === 'RENTAL' && item.rentStartDate && item.rentEndDate && (
                              <div className="mt-1 bg-amber-50 text-amber-900 p-2 text-[10px] flex items-center space-x-1">
                                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                                <span>
                                  Schedule: {new Date(item.rentStartDate).toLocaleDateString('id-ID')} &ndash;{' '}
                                  {new Date(item.rentEndDate).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Rental Status Switcher Control */}
                        {item.type === 'RENTAL' && (
                          <div className="space-y-1 bg-neutral-50 p-3 border border-neutral-100">
                            <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-medium">
                              Manage Rental Return Status:
                            </label>
                            <select
                              value={item.rentalStatus}
                              disabled={updatingItemId === item.id}
                              onChange={(e) => handleRentalStatusChange(item.id, e.target.value)}
                              className="bg-white border border-neutral-300 p-2 text-xs font-mono text-neutral-900 focus:outline-none"
                            >
                              <option value="OUT_WITH_CUSTOMER">OUT WITH CUSTOMER</option>
                              <option value="RETURNED">RETURNED IN GOOD CONDITION</option>
                              <option value="LATE">LATE OVERDUE</option>
                              <option value="DAMAGED">DAMAGED / REQUIRES FEE</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-neutral-100 flex justify-between items-center font-mono">
                  <span className="text-neutral-500 text-xs">Total Order Value: {formatIDR(Number(order.totalAmount))}</span>
                  {remainingBalance > 0 && (
                    <span className="text-amber-800 text-[10px] bg-amber-50 px-2 py-1">
                      Pending Balance: {formatIDR(remainingBalance)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
