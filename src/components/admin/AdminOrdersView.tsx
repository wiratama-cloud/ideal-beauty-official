'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import {
  ShoppingBag,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Truck,
  AlertTriangle,
  Tag,
  Edit2,
  Package,
  XCircle,
  Filter,
} from 'lucide-react';
import {
  updateRentalStatusAction,
  updateOrderStatusAction,
  updateOrderShippingInfoAction,
} from '@/app/actions/admin';
import AdminHeader from '@/components/admin/AdminHeader';

interface AdminOrdersViewProps {
  orders: any[];
}

export default function AdminOrdersView({ orders: initialOrders }: AdminOrdersViewProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'SALES' | 'RENTALS' | 'OVERDUE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isPending, startTransition] = useTransition();

  // Courier & Tracking Modal / Inline State
  const [editingShippingOrderId, setEditingShippingOrderId] = useState<string | null>(null);
  const [courierNameInput, setCourierNameInput] = useState('');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper to check if a rental item is overdue
  const isItemOverdue = (item: any) => {
    if (item.type !== 'RENTAL' || !item.rentEndDate) return false;
    if (item.rentalStatus === 'RETURNED') return false;
    const endDate = new Date(item.rentEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  };

  const getOverdueDays = (rentEndDate: string) => {
    const endDate = new Date(rentEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(today.getTime() - endDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filtering Logic
  const filteredOrders = orders.filter((order) => {
    // Tab Filter
    if (activeTab === 'SALES') {
      const hasSaleItems = order.items.some((i: any) => i.type === 'SALE');
      if (!hasSaleItems) return false;
    } else if (activeTab === 'RENTALS') {
      const hasRentalItems = order.items.some((i: any) => i.type === 'RENTAL');
      if (!hasRentalItems) return false;
    } else if (activeTab === 'OVERDUE') {
      const hasOverdueItems = order.items.some((i: any) => isItemOverdue(i));
      if (!hasOverdueItems) return false;
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

  const handleRentalStatusChange = (orderItemId: string, newStatus: any) => {
    startTransition(async () => {
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
      }
    });
  };

  const handleOrderStatusChange = (orderId: string, newStatus: string) => {
    startTransition(async () => {
      try {
        const updated = await updateOrderStatusAction(orderId, newStatus);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o)));
      } catch (err) {
        console.error('Failed to update order status:', err);
      }
    });
  };

  const openShippingModal = (order: any) => {
    setEditingShippingOrderId(order.id);
    setCourierNameInput(order.courierName || 'JNE Express');
    setTrackingNumberInput(order.trackingNumber || '');
  };

  const handleSaveShippingInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShippingOrderId) return;

    startTransition(async () => {
      try {
        const updated = await updateOrderShippingInfoAction(
          editingShippingOrderId,
          courierNameInput,
          trackingNumberInput
        );
        setOrders((prev) =>
          prev.map((o) =>
            o.id === editingShippingOrderId
              ? { ...o, courierName: updated.courierName, trackingNumber: updated.trackingNumber }
              : o
          )
        );
        setEditingShippingOrderId(null);
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
        {/* Navigation Tabs */}
        <div className="bg-white border border-neutral-200 rounded-xs p-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {(
              [
                { id: 'ALL', label: 'All Orders' },
                { id: 'SALES', label: 'Sales / Purchases' },
                { id: 'RENTALS', label: 'Rentals Tracker' },
                { id: 'OVERDUE', label: 'Overdue / Attention Needed' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-[10px] uppercase tracking-wider font-semibold rounded-xs transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-black text-white'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Status Dropdown Filter */}
            <div className="flex items-center space-x-1 border border-neutral-200 rounded-xs px-2 py-1.5 bg-neutral-50">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-[10px] font-mono uppercase text-neutral-800 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                <option value="PAID">PAID</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="bg-white p-4 border border-neutral-200 rounded-xs flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by Order ID, Customer Name, Email, or Tracking Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-xs text-xs focus:outline-hidden focus:border-black"
            />
          </div>
        </div>

        {/* Orders Listing */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-12 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="font-serif text-lg text-neutral-800">No Orders Found</h3>
            <p className="text-neutral-400 text-xs">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const completedPaymentsTotal = order.payments
                ?.filter((p: any) => p.status === 'COMPLETED')
                .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

              const remainingBalance = Number(order.totalAmount) - completedPaymentsTotal;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-neutral-200 rounded-xs p-6 space-y-6 shadow-2xs hover:border-neutral-300 transition-colors"
                >
                  {/* Order Header & Controls */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-neutral-100 pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-serif text-base font-semibold text-neutral-900">
                          Order #{order.id}
                        </span>
                        {order.voucher && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-purple-50 text-purple-700 font-mono text-[10px] rounded-xs font-medium">
                            <Tag className="w-2.5 h-2.5" />
                            <span>Voucher: {order.voucher.code}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-500 font-mono text-[11px] mt-0.5">
                        Customer: <strong className="text-neutral-800">{order.user?.name || 'Guest'}</strong> (
                        {order.user?.email}) &bull; Date:{' '}
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
                          onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
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
                        {order.status === 'PAID' || order.status === 'COMPLETED' ? (
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
                    </div>
                  </div>

                  {/* Courier & Tracking Section */}
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
                      onClick={() => openShippingModal(order)}
                      className="flex items-center space-x-1 text-[10px] uppercase tracking-wider font-semibold text-neutral-700 hover:text-black transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Tracking</span>
                    </button>
                  </div>

                  {/* Order Items & Rental Timelines */}
                  <div className="divide-y divide-neutral-100 space-y-4">
                    {order.items.map((item: any) => {
                      const product = item.variant?.product;
                      const image = product?.images?.[0] || '/images/products/default-product.jpg';
                      const overdue = isItemOverdue(item);

                      return (
                        <div
                          key={item.id}
                          className="pt-4 first:pt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="relative w-16 aspect-[3/4] bg-neutral-100 flex-shrink-0 border border-neutral-200">
                              <Image
                                src={image}
                                alt={product?.name || ''}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="space-y-1">
                              <h3 className="font-serif text-sm text-neutral-900 font-medium">{product?.name}</h3>
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
                                onChange={(e) => handleRentalStatusChange(item.id, e.target.value)}
                                className="bg-white border border-neutral-300 p-1.5 text-xs font-mono text-neutral-900 focus:outline-hidden"
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

                  {/* Order Financial Footer */}
                  <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-neutral-600">
                        Total Order: <strong>{formatIDR(Number(order.totalAmount))}</strong>
                      </span>
                      {Number(order.discountAmount) > 0 && (
                        <span className="text-purple-700 font-medium bg-purple-50 px-2 py-0.5 rounded-xs border border-purple-200">
                          Discount Applied: -{formatIDR(Number(order.discountAmount))}
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
        )}
      </main>

      {/* Courier & Tracking Modal */}
      {editingShippingOrderId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-xs shadow-xl border border-neutral-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="font-serif text-lg font-light text-neutral-900">Update Courier & Tracking</h3>
              <button
                onClick={() => setEditingShippingOrderId(null)}
                className="text-neutral-400 hover:text-black"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveShippingInfo} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                  Courier Name
                </label>
                <input
                  type="text"
                  value={courierNameInput}
                  onChange={(e) => setCourierNameInput(e.target.value)}
                  placeholder="e.g. JNE Express / Private Atelier Courier"
                  className="w-full border border-neutral-200 rounded-xs p-2 text-xs focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  placeholder="e.g. JNE1234567890"
                  className="w-full border border-neutral-200 rounded-xs p-2 text-xs font-mono focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingShippingOrderId(null)}
                  className="px-4 py-2 border border-neutral-200 text-xs font-medium uppercase tracking-wider rounded-xs text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-black text-white text-xs font-medium uppercase tracking-wider rounded-xs hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
