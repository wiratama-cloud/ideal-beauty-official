import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getUserOrders } from '@/lib/services/order';
import { getLoggedInUserId } from '@/lib/session';
import { Package, Clock, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

export default async function OrderHistoryPage() {
  const userId = await getLoggedInUserId();

  if (!userId) {
    redirect('/login?redirect=/account/orders');
  }

  const orders = await getUserOrders(userId);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-mono px-2.5 py-1 tracking-widest flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Fully Paid</span>
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-mono px-2.5 py-1 tracking-widest flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Partially Paid (Down Payment)</span>
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="bg-blue-100 text-blue-800 text-[10px] uppercase font-mono px-2.5 py-1 tracking-widest flex items-center space-x-1">
            <Package className="w-3 h-3" />
            <span>Dispatched / In Transit</span>
          </span>
        );
      default:
        return (
          <span className="bg-neutral-100 text-neutral-800 text-[10px] uppercase font-mono px-2.5 py-1 tracking-widest flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-neutral-50/50 min-h-screen py-12 font-light text-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-sans block">
            PATRON ACCOUNT PORTAL
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-neutral-900">
            Order History & Tracking ({orders.length})
          </h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-neutral-100 p-12 text-center space-y-4">
            <Package className="w-12 h-12 text-neutral-300 mx-auto" />
            <h2 className="font-serif text-xl text-neutral-800">No Orders Placed Yet</h2>
            <p className="text-neutral-500 font-light text-xs">
              When you reserve haute couture or rental pieces, your orders will appear here for status tracking.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-block bg-black text-white text-xs uppercase tracking-[0.2em] px-8 py-3.5 font-light hover:bg-neutral-800 transition-colors"
              >
                Browse Collections
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const firstItem = order.items[0];
              const product = firstItem?.variant?.product;
              const image =
                product?.images?.[0] ||
                '/images/products/default-product.jpg';

              const completedPaymentsTotal = order.payments
                .filter((p: any) => p.status === 'COMPLETED')
                .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

              const remainingBalance = Number(order.totalAmount) - completedPaymentsTotal;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-neutral-100 p-6 sm:p-8 space-y-6 shadow-sm hover:border-neutral-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-serif text-base font-medium text-neutral-900">
                          Order #{order.id.substring(0, 8)}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-neutral-400 text-[11px] font-mono">
                        Placed on {new Date(order.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                      </p>
                    </div>

                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-black font-medium uppercase tracking-widest text-[10px] flex items-center space-x-1 border-b border-black pb-0.5 hover:text-neutral-600 transition-colors"
                    >
                      <span>View Full Order & Tracking</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Items Preview */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 aspect-[3/4] bg-neutral-100 flex-shrink-0">
                        <Image src={image} alt={product?.name || 'Product'} fill className="object-cover" unoptimized />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-serif text-sm text-neutral-900 font-medium">
                          {product?.name || 'Atelier Masterpiece'}
                        </h3>
                        <p className="text-[11px] text-neutral-500 font-mono">
                          {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'} Total
                        </p>
                      </div>
                    </div>

                    {/* Financial Summary Breakdown */}
                    <div className="text-left sm:text-right font-mono space-y-1">
                      <p className="text-neutral-500 text-[11px]">Total Order Amount:</p>
                      <p className="text-base font-bold text-neutral-900">{formatIDR(Number(order.totalAmount))}</p>
                      {remainingBalance > 0 && (
                        <p className="text-amber-800 text-[10px] bg-amber-50 px-2 py-0.5 inline-block">
                          Balance Pending: {formatIDR(remainingBalance)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
