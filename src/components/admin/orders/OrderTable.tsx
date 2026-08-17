'use client';

import React from 'react';
import Image from 'next/image';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  Edit2,
  Calendar,
  AlertTriangle,
  Tag,
  Eye,
} from 'lucide-react';
import { RentalStatus } from '@prisma/client';
import {
  OrderSerialized,
  formatIDR,
  isItemOverdue,
  getOverdueDays,
  calculateRemainingBalance,
} from './types';

interface OrderTableProps {
  orders: OrderSerialized[];
  onSelectOrder: (order: OrderSerialized) => void;
  onUpdateOrderStatus: (orderId: string, status: string) => Promise<void> | void;
  onUpdateRentalStatus: (orderItemId: string, status: RentalStatus | string) => Promise<void> | void;
  onEditShipping: (order: OrderSerialized) => void;
  isPending?: boolean;
}

export default function OrderTable({
  orders,
  onSelectOrder,
  onUpdateOrderStatus,
  onUpdateRentalStatus,
  onEditShipping,
  isPending = false,
}: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 p-12 text-center space-y-3 rounded-xs">
        <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
        <h3 className="font-serif text-lg text-neutral-800 font-light">No Orders Found</h3>
        <p className="text-neutral-400 text-xs font-mono">
          Try adjusting your filter tabs, status, or search keywords.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => {
        const remainingBalance = calculateRemainingBalance(order.totalAmount, order.payments);

        return (
          <div
            key={order.id}
            className="bg-white border border-neutral-200 rounded-xs p-5 md:p-6 space-y-5 shadow-2xs hover:border-neutral-300 transition-colors"
          >
            {/* Header Row */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-neutral-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-base font-semibold text-neutral-900">
                    Order #{order.id}
                  </span>
                  {order.voucher && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-purple-50 text-purple-700 font-mono text-[10px] rounded-xs font-medium border border-purple-200">
                      <Tag className="w-2.5 h-2.5" />
                      <span>Voucher: {order.voucher.code}</span>
                    </span>
                  )}
                </div>
                <p className="text-neutral-500 font-mono text-[11px] mt-0.5">
                  Customer: <strong className="text-neutral-800">{order.user?.name || 'Guest'}</strong> (
                  {order.user?.email || 'No email'}) &bull; Date:{' '}
                  {new Date(order.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Order Status Dropdown */}
                <div className="flex items-center space-x-1.5 bg-neutral-50 border border-neutral-200 px-2.5 py-1 rounded-xs">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
                    Status:
                  </span>
                  <select
                    value={order.status}
                    disabled={isPending}
                    onChange={(e) => onUpdateOrderStatus(order.id, e.target.value)}
                    className="bg-transparent font-mono text-[10px] font-bold uppercase text-neutral-900 focus:outline-hidden"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                    <option value="PAID">PAID</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                {/* Payment Status Badge */}
                <div className="font-mono">
                  {order.status === 'PAID' || order.status === 'COMPLETED' || remainingBalance === 0 ? (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xs uppercase tracking-wider text-[10px] font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>PAID IN FULL</span>
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-xs uppercase tracking-wider text-[10px] font-bold flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>PARTIALLY PAID</span>
                    </span>
                  )}
                </div>

                {/* Inspect Drawer Trigger */}
                <button
                  onClick={() => onSelectOrder(order)}
                  className="flex items-center space-x-1 px-3 py-1 bg-black text-white rounded-xs text-[10px] uppercase tracking-wider font-medium hover:bg-neutral-800 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  <span>Inspect Order</span>
                </button>
              </div>
            </div>

            {/* Courier & Shipping Bar */}
            <div className="bg-neutral-50 p-3 rounded-xs border border-neutral-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center space-x-2 font-mono text-[11px]">
                <Truck className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                <div>
                  <span className="text-neutral-500">Shipping Info: </span>
                  <strong className="text-neutral-800">{order.courierName || 'Courier Not Assigned'}</strong>
                  {order.trackingNumber ? (
                    <span className="ml-2 text-emerald-700 font-semibold">
                      (Tracking: #{order.trackingNumber})
                    </span>
                  ) : (
                    <span className="ml-2 text-neutral-400 font-normal">(No Tracking Number)</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onEditShipping(order)}
                className="flex items-center space-x-1 text-[10px] uppercase tracking-wider font-semibold text-neutral-700 hover:text-black transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Tracking</span>
              </button>
            </div>

            {/* Order Items & Rental Workflows */}
            <div className="divide-y divide-neutral-100 space-y-4">
              {order.items?.map((item) => {
                const product = item.variant?.product;
                const image = product?.images?.[0] || '/images/products/default-product.jpg';
                const overdue = isItemOverdue(item);

                return (
                  <div
                    key={item.id}
                    className="pt-4 first:pt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative w-14 aspect-[3/4] bg-neutral-100 flex-shrink-0 border border-neutral-200 rounded-xs overflow-hidden">
                        <Image
                          src={image}
                          alt={product?.name || ''}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-serif text-sm text-neutral-900 font-medium">
                          {product?.name || 'Product'}
                        </h3>
                        <p className="text-[10px] text-neutral-500 font-mono">
                          Type: <strong className="text-neutral-800">{item.type}</strong> &bull; SKU:{' '}
                          {item.variant?.sku} &bull; Qty: {item.quantity}
                        </p>

                        {item.type === 'RENTAL' && item.rentStartDate && item.rentEndDate && (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <div className="bg-amber-50 text-amber-900 px-2 py-1 text-[10px] flex items-center space-x-1 rounded-xs border border-amber-200">
                              <Calendar className="w-3 h-3 text-amber-700" />
                              <span>
                                Rental: {new Date(item.rentStartDate).toLocaleDateString('id-ID')} &ndash;{' '}
                                {new Date(item.rentEndDate).toLocaleDateString('id-ID')}
                              </span>
                            </div>

                            {overdue && (
                              <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 text-[10px] font-bold flex items-center space-x-1 rounded-xs">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                <span>OVERDUE ({getOverdueDays(item.rentEndDate)} DAYS LATE)</span>
                              </span>
                            )}
                          </div>
                        )}

                        {(item.isPreOrder || item.variant?.isPreOrder) && (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 rounded-xs">
                              <Clock className="w-3 h-3 text-purple-700" />
                              <span>PRE-ORDER</span>
                            </span>
                            {item.variant?.preOrderNote && (
                              <span className="text-[10px] text-neutral-600 font-mono">
                                {item.variant.preOrderNote}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rental Return Status Dropdown */}
                    {item.type === 'RENTAL' && (
                      <div className="space-y-1 bg-neutral-50 p-2.5 border border-neutral-200 rounded-xs">
                        <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                          Rental Return Status:
                        </label>
                        <select
                          value={item.rentalStatus}
                          disabled={isPending}
                          onChange={(e) => onUpdateRentalStatus(item.id, e.target.value)}
                          className="bg-white border border-neutral-300 p-1.5 text-xs font-mono text-neutral-900 focus:outline-hidden rounded-xs"
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

            {/* Financial Summary Footer */}
            <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-neutral-600">
                  Total Order: <strong>{formatIDR(order.totalAmount)}</strong>
                </span>
                {Number(order.discountAmount) > 0 && (
                  <span className="text-purple-700 font-medium bg-purple-50 px-2 py-0.5 rounded-xs border border-purple-200">
                    Discount Applied: -{formatIDR(order.discountAmount)}
                  </span>
                )}
              </div>

              {remainingBalance > 0 && (
                <span className="text-amber-800 font-semibold bg-amber-50 px-2.5 py-1 rounded-xs border border-amber-200">
                  Remaining Balance: {formatIDR(remainingBalance)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
