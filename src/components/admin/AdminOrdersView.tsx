'use client';

import React, { useState, useTransition } from 'react';
import {
  updateRentalStatusAction,
  updateOrderStatusAction,
  updateOrderShippingInfoAction,
} from '@/app/actions/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import OrderMetricsBar from './orders/OrderMetricsBar';
import OrderFilterToolbar from './orders/OrderFilterToolbar';
import OrderTable from './orders/OrderTable';
import OrderDetailDrawer from './orders/OrderDetailDrawer';
import ShippingInfoModal from './orders/ShippingInfoModal';
import { OrderStatus, RentalStatus } from '@prisma/client';
import {
  OrderSerialized,
  OrderFilterTab,
  isItemOverdue,
  calculateRemainingBalance,
} from './orders/types';

interface AdminOrdersViewProps {
  orders: OrderSerialized[];
}

export default function AdminOrdersView({ orders: initialOrders }: AdminOrdersViewProps) {
  const [orders, setOrders] = useState<OrderSerialized[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<OrderFilterTab>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isPending, startTransition] = useTransition();

  // Slide-over Drawer Inspector & Shipping Modal State
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<OrderSerialized | null>(null);
  const [editingShippingOrder, setEditingShippingOrder] = useState<OrderSerialized | null>(null);

  // Filtering Logic
  const filteredOrders = orders.filter((order) => {
    // Tab Filter
    if (activeTab === 'SALES') {
      const hasSaleItems = order.items?.some((i) => i.type === 'SALE');
      if (!hasSaleItems) return false;
    } else if (activeTab === 'PREORDERS') {
      const hasPreOrderItems = order.items?.some((i) => i.isPreOrder || i.variant?.isPreOrder);
      if (!hasPreOrderItems) return false;
    } else if (activeTab === 'RENTALS') {
      const hasRentalItems = order.items?.some((i) => i.type === 'RENTAL');
      if (!hasRentalItems) return false;
    } else if (activeTab === 'OVERDUE') {
      const hasOverdueItems = order.items?.some((i) => isItemOverdue(i));
      if (!hasOverdueItems) return false;
    } else if (activeTab === 'UNPAID') {
      const isUnpaidStatus = ['PENDING', 'PARTIALLY_PAID'].includes(order.status);
      const hasRemaining = calculateRemainingBalance(order.totalAmount, order.payments) > 0;
      if (!isUnpaidStatus && !hasRemaining) return false;
    }

    // Status Filter
    if (statusFilter !== 'ALL' && order.status !== statusFilter) {
      return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchCustomer =
        (order.user?.name && order.user.name.toLowerCase().includes(q)) ||
        (order.user?.email && order.user.email.toLowerCase().includes(q));
      const matchTracking =
        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(q)) ||
        (order.courierName && order.courierName.toLowerCase().includes(q));
      if (!matchId && !matchCustomer && !matchTracking) return false;
    }

    return true;
  });

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    startTransition(async () => {
      try {
        const updated = await updateOrderStatusAction(orderId, newStatus as OrderStatus);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o))
        );
        if (selectedOrderForDrawer && selectedOrderForDrawer.id === orderId) {
          setSelectedOrderForDrawer((prev) =>
            prev ? { ...prev, status: updated.status } : null
          );
        }
      } catch (err) {
        console.error('Failed to update order status:', err);
      }
    });
  };

  const handleUpdateRentalStatus = (orderItemId: string, newStatus: RentalStatus | string) => {
    startTransition(async () => {
      try {
        await updateRentalStatusAction(
          orderItemId,
          newStatus as 'OUT_WITH_CUSTOMER' | 'RETURNED' | 'LATE' | 'DAMAGED'
        );
        setOrders((prev) =>
          prev.map((order) => ({
            ...order,
            items: order.items?.map((item) =>
              item.id === orderItemId ? { ...item, rentalStatus: newStatus as RentalStatus } : item
            ),
          }))
        );
        if (selectedOrderForDrawer) {
          setSelectedOrderForDrawer((prev) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.map((item) =>
                    item.id === orderItemId ? { ...item, rentalStatus: newStatus as RentalStatus } : item
                  ),
                }
              : null
          );
        }
      } catch (err) {
        console.error('Failed to update rental status:', err);
      }
    });
  };

  const handleUpdateShippingInfo = (orderId: string, courierName: string, trackingNumber: string) => {
    startTransition(async () => {
      try {
        const updated = await updateOrderShippingInfoAction(orderId, courierName, trackingNumber);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, courierName: updated.courierName, trackingNumber: updated.trackingNumber }
              : o
          )
        );
        if (selectedOrderForDrawer && selectedOrderForDrawer.id === orderId) {
          setSelectedOrderForDrawer((prev) =>
            prev
              ? { ...prev, courierName: updated.courierName, trackingNumber: updated.trackingNumber }
              : null
          );
        }
        setEditingShippingOrder(null);
      } catch (err) {
        console.error('Failed to update shipping info:', err);
      }
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 text-xs">
      <AdminHeader
        title={`Order Fulfillment & Rental Hub (${orders.length})`}
        subtitle="ATELIER ORDERS & RENTAL TIMELINES"
        activeTab="orders"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Top Operations Executive Metrics Bar */}
        <OrderMetricsBar orders={orders} />

        {/* Filter Navigation Tabs and Live Search */}
        <OrderFilterToolbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          resultsCount={filteredOrders.length}
        />

        {/* Orders Listing Table / Cards */}
        <OrderTable
          orders={filteredOrders}
          onSelectOrder={(order) => setSelectedOrderForDrawer(order)}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdateRentalStatus={handleUpdateRentalStatus}
          onEditShipping={(order) => setEditingShippingOrder(order)}
          isPending={isPending}
        />
      </main>

      {/* Slide-over Order Detail Inspector Drawer */}
      <OrderDetailDrawer
        order={selectedOrderForDrawer}
        isOpen={Boolean(selectedOrderForDrawer)}
        onClose={() => setSelectedOrderForDrawer(null)}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onUpdateRentalStatus={handleUpdateRentalStatus}
        onUpdateShippingInfo={handleUpdateShippingInfo}
        isPending={isPending}
      />

      {/* Shipping Update Modal */}
      <ShippingInfoModal
        order={editingShippingOrder}
        isOpen={Boolean(editingShippingOrder)}
        onClose={() => setEditingShippingOrder(null)}
        onSave={handleUpdateShippingInfo}
        isPending={isPending}
      />
    </div>
  );
}
