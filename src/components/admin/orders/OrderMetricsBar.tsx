'use client';

import React from 'react';
import {
  ShoppingBag,
  DollarSign,
  Calendar,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import {
  OrderSerialized,
  formatIDR,
  isItemOverdue,
  calculateRemainingBalance,
  calculateCompletedPayments,
} from './types';

interface OrderMetricsBarProps {
  orders: OrderSerialized[];
}

export default function OrderMetricsBar({ orders }: OrderMetricsBarProps) {
  const totalOrders = orders.length;

  // Total Revenue: sum of all completed payments across orders
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + calculateCompletedPayments(order.payments);
  }, 0);

  // Active Rentals: count of rental items currently out with customer or late
  let activeRentalsCount = 0;
  // Overdue Rentals: count of items overdue
  let overdueRentalsCount = 0;

  orders.forEach((order) => {
    order.items?.forEach((item) => {
      if (item.type === 'RENTAL') {
        if (item.rentalStatus === 'OUT_WITH_CUSTOMER' || item.rentalStatus === 'LATE') {
          activeRentalsCount++;
        }
        if (isItemOverdue(item)) {
          overdueRentalsCount++;
        }
      }
    });
  });

  // Pending Fulfillment or Unpaid orders count
  const pendingFulfillmentCount = orders.filter((order) => {
    const isPendingStatus = ['PENDING', 'PARTIALLY_PAID', 'PROCESSING'].includes(order.status);
    const hasRemaining = calculateRemainingBalance(order.totalAmount, order.payments) > 0;
    return isPendingStatus || hasRemaining;
  }).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* Total Orders */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xs shadow-2xs hover:border-neutral-300 transition-colors">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
            Total Orders
          </span>
          <ShoppingBag className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="text-xl font-serif font-medium text-neutral-900">{totalOrders}</div>
        <p className="text-[10px] text-neutral-500 font-mono mt-1">All time fulfillment</p>
      </div>

      {/* Total Revenue */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xs shadow-2xs hover:border-neutral-300 transition-colors">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
            Total Revenue
          </span>
          <DollarSign className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-lg sm:text-xl font-serif font-medium text-emerald-900 truncate">
          {formatIDR(totalRevenue)}
        </div>
        <p className="text-[10px] text-emerald-700 font-mono mt-1">Confirmed payments</p>
      </div>

      {/* Active Rentals */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xs shadow-2xs hover:border-neutral-300 transition-colors">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
            Active Rentals
          </span>
          <Calendar className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-xl font-serif font-medium text-amber-900">{activeRentalsCount}</div>
        <p className="text-[10px] text-neutral-500 font-mono mt-1">Currently with customer</p>
      </div>

      {/* Overdue Rentals */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xs shadow-2xs hover:border-neutral-300 transition-colors">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
            Overdue Rentals
          </span>
          <AlertTriangle className="w-4 h-4 text-red-600" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-xl font-serif font-medium text-red-700">{overdueRentalsCount}</span>
          {overdueRentalsCount > 0 && (
            <span className="text-[10px] font-mono text-red-600 font-semibold bg-red-50 px-1.5 py-0.5 rounded-xs">
              ACTION NEEDED
            </span>
          )}
        </div>
        <p className="text-[10px] text-neutral-500 font-mono mt-1">Return dates passed</p>
      </div>

      {/* Pending / Unpaid */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xs shadow-2xs hover:border-neutral-300 transition-colors col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
            Pending / Unpaid
          </span>
          <Clock className="w-4 h-4 text-neutral-500" />
        </div>
        <div className="text-xl font-serif font-medium text-neutral-900">
          {pendingFulfillmentCount}
        </div>
        <p className="text-[10px] text-neutral-500 font-mono mt-1">Awaiting status / balance</p>
      </div>
    </div>
  );
}
