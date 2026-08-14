'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Clock,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Filter,
  CheckSquare,
  Square,
  CreditCard,
  Sparkles,
  ShoppingBag,
  Layers,
  X,
} from 'lucide-react';
import BatchPaymentModal from './BatchPaymentModal';

interface OrdersListClientProps {
  orders: any[];
}

type StatusFilter = 'ALL' | 'PENDING' | 'SHIPPED' | 'COMPLETED';

export default function OrdersListClient({ orders }: OrdersListClientProps) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('ALL');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCompletedPaymentsTotal = (order: any) => {
    return (order.payments || [])
      .filter((p: any) => p.status === 'COMPLETED')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  };

  const getRemainingBalance = (order: any) => {
    const paid = getCompletedPaymentsTotal(order);
    return Math.max(0, Number(order.totalAmount || 0) - paid);
  };

  const isPendingPayment = (order: any) => {
    const balance = getRemainingBalance(order);
    return balance > 0 && order.status !== 'CANCELLED';
  };

  const isShipped = (order: any) => {
    return order.status === 'SHIPPED' || order.status === 'PROCESSING';
  };

  const isCompleted = (order: any) => {
    return (order.status === 'COMPLETED' || order.status === 'PAID') && getRemainingBalance(order) === 0;
  };

  // Filter orders based on active tab
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      switch (activeFilter) {
        case 'PENDING':
          return isPendingPayment(order);
        case 'SHIPPED':
          return isShipped(order);
        case 'COMPLETED':
          return isCompleted(order);
        case 'ALL':
        default:
          return true;
      }
    });
  }, [orders, activeFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      ALL: orders.length,
      PENDING: orders.filter(isPendingPayment).length,
      SHIPPED: orders.filter(isShipped).length,
      COMPLETED: orders.filter(isCompleted).length,
    };
  }, [orders]);

  // Checkbox Selection Helpers
  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const pendingOrders = useMemo(() => {
    return orders.filter(isPendingPayment);
  }, [orders]);

  const selectAllPending = () => {
    const pendingIds = pendingOrders.map((o) => o.id);
    setSelectedOrderIds(pendingIds);
  };

  const clearSelection = () => {
    setSelectedOrderIds([]);
  };

  // Selected orders list and total balance due calculation
  const selectedOrders = useMemo(() => {
    return orders.filter((o) => selectedOrderIds.includes(o.id));
  }, [orders, selectedOrderIds]);

  const totalSelectedBalance = useMemo(() => {
    return selectedOrders.reduce((sum, order) => sum + getRemainingBalance(order), 0);
  }, [selectedOrders]);

  const getStatusBadge = (status: string, remainingBalance: number) => {
    if (remainingBalance === 0 && (status === 'PAID' || status === 'COMPLETED')) {
      return (
        <span className="bg-emerald-100/80 text-emerald-900 border border-emerald-200 text-[10px] uppercase font-mono px-2.5 py-1 tracking-widest flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Fully Paid</span>
        </span>
      );
    }
    if (remainingBalance > 0) {
      return (
        <span className="bg-amber-100/80 text-amber-900 border border-amber-200 text-[10px] uppercase font-mono px-2.5 py-1 tracking-widest flex items-center space-x-1">
          <Clock className="w-3 h-3 text-amber-700" />
          <span>Pending Balance ({formatIDR(remainingBalance)})</span>
        </span>
      );
    }
    if (status === 'SHIPPED') {
      return (
        <span className="bg-blue-100/80 text-blue-900 border border-blue-200 text-[10px] uppercase font-mono px-2.5 py-1 tracking-widest flex items-center space-x-1">
          <Package className="w-3 h-3 text-blue-700" />
          <span>In Transit / Dispatched</span>
        </span>
      );
    }
    return (
      <span className="bg-neutral-100 text-neutral-800 text-[10px] uppercase font-mono px-2.5 py-1 tracking-widest flex items-center space-x-1">
        <AlertCircle className="w-3 h-3" />
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div className="space-y-8 relative">
      {/* Status Filter Tabs & Action Toolbar */}
      <div className="bg-white border border-neutral-200/80 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <span className="text-neutral-400 text-xs flex items-center space-x-1 mr-2 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span className="uppercase text-[10px] tracking-widest font-mono">Filter:</span>
          </span>

          {[
            { key: 'ALL', label: 'All Orders' },
            { key: 'PENDING', label: 'Pending Payment' },
            { key: 'SHIPPED', label: 'In Transit' },
            { key: 'COMPLETED', label: 'Completed' },
          ].map((tab) => {
            const count = counts[tab.key as StatusFilter];
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key as StatusFilter)}
                className={`px-3.5 py-2 text-xs uppercase tracking-[0.15em] transition-all whitespace-nowrap flex items-center space-x-1.5 border ${
                  isActive
                    ? 'border-neutral-900 bg-neutral-900 text-white font-medium shadow-xs'
                    : 'border-neutral-200 bg-neutral-50/50 text-neutral-600 hover:border-neutral-400 hover:bg-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Batch Selection Helpers */}
        {pendingOrders.length > 0 && (
          <div className="flex items-center space-x-3 text-xs w-full md:w-auto justify-end border-t md:border-t-0 border-neutral-100 pt-3 md:pt-0">
            <button
              onClick={
                selectedOrderIds.length === pendingOrders.length ? clearSelection : selectAllPending
              }
              className="text-neutral-700 hover:text-black font-mono text-[11px] uppercase tracking-wider flex items-center space-x-1.5 underline decoration-amber-500 underline-offset-4"
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {selectedOrderIds.length === pendingOrders.length
                  ? 'Deselect All'
                  : `Select All Unpaid (${pendingOrders.length})`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-neutral-200/80 p-12 text-center space-y-4 shadow-xs">
          <Package className="w-12 h-12 text-neutral-300 mx-auto" />
          <h2 className="font-serif text-xl text-neutral-800 font-light">
            No Orders Found ({activeFilter.replace('_', ' ')})
          </h2>
          <p className="text-neutral-500 font-light text-xs max-w-md mx-auto">
            {activeFilter === 'ALL'
              ? 'When you reserve haute couture or rental pieces, your orders will appear here for status tracking.'
              : `You currently have no orders matching the "${activeFilter.toLowerCase()}" filter.`}
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
        /* Orders List */
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const firstItem = order.items?.[0];
            const product = firstItem?.variant?.product;
            const image = product?.images?.[0] || '/images/products/default-product.jpg';
            const remainingBalance = getRemainingBalance(order);
            const isSelected = selectedOrderIds.includes(order.id);

            return (
              <div
                key={order.id}
                className={`bg-white border p-6 sm:p-8 space-y-6 shadow-xs transition-all relative ${
                  isSelected
                    ? 'border-neutral-900 bg-amber-50/20 ring-1 ring-neutral-900'
                    : 'border-neutral-200/80 hover:border-neutral-400'
                }`}
              >
                {/* Header Row: Checkbox, Order ID, Date, Status, Link */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-100 pb-4">
                  <div className="flex items-start sm:items-center space-x-3">
                    {/* Multi-select Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelectOrder(order.id)}
                      className="mt-0.5 sm:mt-0 text-neutral-700 hover:text-black transition-colors focus:outline-none"
                      title={isSelected ? 'Deselect order' : 'Select order for batch checkout'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-amber-600 fill-amber-100" />
                      ) : (
                        <Square className="w-5 h-5 text-neutral-300 hover:text-neutral-600" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="font-serif text-base font-medium text-neutral-900">
                          Order #{order.id.substring(0, 8)}
                        </span>
                        {getStatusBadge(order.status, remainingBalance)}
                      </div>
                      <p className="text-neutral-400 text-[11px] font-mono">
                        Placed on{' '}
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          dateStyle: 'long',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    {remainingBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderIds([order.id]);
                          setIsBatchModalOpen(true);
                        }}
                        className="bg-amber-600 text-white text-[10px] uppercase font-mono tracking-widest px-3 py-1.5 hover:bg-amber-700 transition-colors flex items-center space-x-1"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Pay Balance</span>
                      </button>
                    )}

                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-black font-medium uppercase tracking-widest text-[10px] flex items-center space-x-1 border-b border-black pb-0.5 hover:text-neutral-600 transition-colors whitespace-nowrap"
                    >
                      <span>View Full Order</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 aspect-[3/4] bg-neutral-100 flex-shrink-0 border border-neutral-200">
                      <Image
                        src={image}
                        alt={product?.name || 'Product'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif text-sm text-neutral-900 font-medium">
                        {product?.name || 'Atelier Masterpiece'}
                      </h3>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        {order.items?.length || 1}{' '}
                        {order.items?.length === 1 ? 'Piece' : 'Pieces Total'}
                      </p>
                      {firstItem?.type === 'RENTAL' && (
                        <span className="inline-block bg-amber-100 text-amber-900 text-[9px] uppercase font-mono px-2 py-0.5 font-medium">
                          Couture Rental
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Summary Breakdown */}
                  <div className="text-left sm:text-right font-mono space-y-1">
                    <p className="text-neutral-500 text-[11px]">Total Order Amount:</p>
                    <p className="text-base font-bold text-neutral-900">
                      {formatIDR(Number(order.totalAmount))}
                    </p>
                    {remainingBalance > 0 ? (
                      <p className="text-amber-900 text-[10px] bg-amber-50 border border-amber-200 px-2 py-0.5 inline-block">
                        Outstanding Balance: <strong>{formatIDR(remainingBalance)}</strong>
                      </p>
                    ) : (
                      <p className="text-emerald-800 text-[10px] bg-emerald-50 px-2 py-0.5 inline-block">
                        Payment Complete
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Batch Action Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-3xl bg-neutral-900 text-white p-4 sm:p-5 shadow-2xl border border-neutral-700 flex flex-col sm:flex-row justify-between items-center gap-4 animate-slideUp">
          <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-serif text-sm sm:text-base font-light">
                {selectedOrders.length} {selectedOrders.length === 1 ? 'Order' : 'Orders'} Selected
              </span>
            </div>

            <div className="h-4 w-[1px] bg-neutral-700 hidden sm:block" />

            <div className="font-mono text-xs text-amber-300">
              <span>Total Due: </span>
              <strong className="text-sm font-bold text-white">
                {formatIDR(totalSelectedBalance)}
              </strong>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={clearSelection}
              className="text-neutral-400 hover:text-white text-xs font-mono uppercase tracking-widest px-3 py-2 flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="bg-amber-600 text-white text-xs uppercase tracking-[0.2em] font-medium px-5 py-3 hover:bg-amber-500 transition-all shadow-md flex items-center space-x-2 whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4" />
              <span>Checkout Selected ({selectedOrders.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Batch Payment Modal */}
      {isBatchModalOpen && selectedOrders.length > 0 && (
        <BatchPaymentModal
          selectedOrders={selectedOrders}
          onClose={() => setIsBatchModalOpen(false)}
          onPaymentSuccess={() => {
            clearSelection();
          }}
        />
      )}
    </div>
  );
}
