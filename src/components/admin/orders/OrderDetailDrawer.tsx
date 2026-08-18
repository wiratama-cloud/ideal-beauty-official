'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
  User,
  MapPin,
  Package,
  CreditCard,
  Truck,
  Calendar,
  AlertTriangle,
  Tag,
  Clock,
} from 'lucide-react';
import { RentalStatus } from '@prisma/client';
import {
  OrderSerialized,
  formatIDR,
  isItemOverdue,
  getOverdueDays,
  calculateCompletedPayments,
  calculateRemainingBalance,
} from './types';
import { getOptimizedImageUrl } from '@/lib/utils/image-url';

interface OrderDetailDrawerProps {
  order: OrderSerialized | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrderStatus: (orderId: string, status: string) => Promise<void> | void;
  onUpdateRentalStatus: (orderItemId: string, status: RentalStatus | string) => Promise<void> | void;
  onUpdateShippingInfo: (orderId: string, courierName: string, trackingNumber: string) => Promise<void> | void;
  isPending?: boolean;
}

export default function OrderDetailDrawer({
  order,
  isOpen,
  onClose,
  onUpdateOrderStatus,
  onUpdateRentalStatus,
  onUpdateShippingInfo,
  isPending = false,
}: OrderDetailDrawerProps) {
  const [prevOrderId, setPrevOrderId] = useState<string | null>(null);
  const [courierInput, setCourierInput] = useState('');
  const [trackingInput, setTrackingInput] = useState('');

  if (order && order.id !== prevOrderId) {
    setPrevOrderId(order.id);
    setCourierInput(order.courierName || 'JNE Express');
    setTrackingInput(order.trackingNumber || '');
  }

  if (!isOpen || !order) return null;

  const steps = [
    { key: 'PLACED', label: 'Placed' },
    { key: 'PAYMENT', label: 'Payment Confirmed' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'PARTIALLY_PAID':
      case 'PAID':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIndex = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  const completedPaymentsTotal = calculateCompletedPayments(order.payments);
  const remainingBalance = calculateRemainingBalance(order.totalAmount, order.payments);

  const handleSaveShipping = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateShippingInfo(order.id, courierInput, trackingInput);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-900 text-white">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-serif text-lg font-light tracking-wide">
                Order #{order.id}
              </h2>
              {order.voucher && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-purple-900/60 text-purple-200 font-mono text-[10px] rounded-xs border border-purple-700">
                  <Tag className="w-2.5 h-2.5" />
                  <span>{order.voucher.code}</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString('id-ID')}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-neutral-800">
          {/* Order Timeline Stepper */}
          <div className="bg-neutral-50 p-4 rounded-xs border border-neutral-200/80 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
                Order Timeline Progress
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-neutral-500 font-mono">Quick Status:</span>
                <select
                  value={order.status}
                  disabled={isPending}
                  onChange={(e) => onUpdateOrderStatus(order.id, e.target.value)}
                  className="bg-white border border-neutral-300 rounded-xs font-mono text-[10px] font-bold uppercase px-2 py-1 text-neutral-900 focus:outline-hidden"
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
            </div>

            {isCancelled ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xs font-mono text-center font-semibold">
                ORDER CANCELLED
              </div>
            ) : (
              <div className="flex items-center justify-between relative pt-2">
                {steps.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step.key} className="flex-1 text-center relative z-10">
                      <div
                        className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center font-mono text-[10px] font-bold border transition-colors ${
                          isCompleted
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-neutral-400 border-neutral-300'
                        } ${isCurrent ? 'ring-2 ring-black ring-offset-2' : ''}`}
                      >
                        {idx + 1}
                      </div>
                      <span
                        className={`block text-[9px] uppercase tracking-wider mt-1.5 font-medium ${
                          isCompleted ? 'text-neutral-900 font-semibold' : 'text-neutral-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer & Shipping Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="bg-white border border-neutral-200 p-4 rounded-xs space-y-2">
              <div className="flex items-center space-x-1.5 text-neutral-900 font-semibold border-b border-neutral-100 pb-2">
                <User className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-[10px] uppercase tracking-wider">Customer Details</span>
              </div>
              <div className="font-mono text-[11px] space-y-1 pt-1">
                <p>
                  <span className="text-neutral-400">Name: </span>
                  <strong className="text-neutral-900">{order.user?.name || 'Guest Checkout'}</strong>
                </p>
                <p>
                  <span className="text-neutral-400">Email: </span>
                  <span className="text-neutral-800">{order.user?.email || 'N/A'}</span>
                </p>
                <p>
                  <span className="text-neutral-400">Phone: </span>
                  <span className="text-neutral-800">
                    {order.user?.phone || order.shippingAddress?.phone || 'N/A'}
                  </span>
                </p>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white border border-neutral-200 p-4 rounded-xs space-y-2">
              <div className="flex items-center space-x-1.5 text-neutral-900 font-semibold border-b border-neutral-100 pb-2">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-[10px] uppercase tracking-wider">Shipping Address</span>
              </div>
              {order.shippingAddress ? (
                <div className="font-mono text-[11px] space-y-1 pt-1 text-neutral-800">
                  <p className="font-semibold text-neutral-900">
                    {order.shippingAddress.recipientName} ({order.shippingAddress.phone})
                  </p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.province}{' '}
                    {order.shippingAddress.postalCode}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-neutral-400 font-mono pt-1">No shipping address recorded</p>
              )}
            </div>
          </div>

          {/* Itemized Breakdown */}
          <div className="bg-white border border-neutral-200 p-4 rounded-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center space-x-1.5 text-neutral-900 font-semibold">
                <Package className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-[10px] uppercase tracking-wider">Itemized Breakdown</span>
              </div>
              <span className="font-mono text-[10px] text-neutral-400">
                {order.items?.length || 0} items
              </span>
            </div>

            <div className="divide-y divide-neutral-100 space-y-3">
              {order.items?.map((item) => {
                const product = item.variant?.product;
                const image = getOptimizedImageUrl(product?.images?.[0], 256);
                const overdue = isItemOverdue(item);

                return (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="relative w-12 aspect-[3/4] bg-neutral-100 flex-shrink-0 border border-neutral-200 rounded-xs overflow-hidden">
                        <Image
                          src={image}
                          alt={product?.name || ''}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif text-xs font-medium text-neutral-900">
                          {product?.name || 'Product'}
                        </h4>
                        <p className="text-[10px] text-neutral-500 font-mono">
                          SKU: <strong className="text-neutral-800">{item.variant?.sku}</strong> &bull; Qty: {item.quantity}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded-xs ${
                              item.type === 'RENTAL'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            {item.type}
                          </span>
                          <span className="font-mono text-[10px] font-semibold text-neutral-800">
                            {formatIDR(item.priceAtTime)}
                          </span>
                        </div>

                        {/* Rental Timelines & Status Selector */}
                        {item.type === 'RENTAL' && (
                          <div className="mt-2 space-y-2 bg-amber-50/60 p-2.5 rounded-xs border border-amber-200/80">
                            {item.rentStartDate && item.rentEndDate && (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-mono text-amber-900 flex items-center space-x-1">
                                  <Calendar className="w-3 h-3 text-amber-700" />
                                  <span>
                                    {new Date(item.rentStartDate).toLocaleDateString('id-ID')} &ndash;{' '}
                                    {new Date(item.rentEndDate).toLocaleDateString('id-ID')}
                                  </span>
                                </span>

                                {overdue && (
                                  <span className="bg-red-100 text-red-800 border border-red-300 px-1.5 py-0.5 text-[9px] font-bold flex items-center space-x-1 rounded-xs">
                                    <AlertTriangle className="w-3 h-3 text-red-600" />
                                    <span>{getOverdueDays(item.rentEndDate)} DAYS OVERDUE</span>
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center space-x-2">
                              <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold font-mono">
                                Return Status:
                              </span>
                              <select
                                value={item.rentalStatus}
                                disabled={isPending}
                                onChange={(e) => onUpdateRentalStatus(item.id, e.target.value)}
                                className="bg-white border border-amber-300 text-[10px] font-mono text-neutral-900 p-1 rounded-xs focus:outline-hidden"
                              >
                                <option value="OUT_WITH_CUSTOMER">OUT WITH CUSTOMER</option>
                                <option value="RETURNED">RETURNED IN GOOD CONDITION</option>
                                <option value="LATE">LATE OVERDUE</option>
                                <option value="DAMAGED">DAMAGED / REQUIRES FEE</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {(item.isPreOrder || item.variant?.isPreOrder) && (
                          <div className="mt-2 space-y-1 bg-purple-50/60 p-2.5 rounded-xs border border-purple-200/80">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-mono text-purple-900 flex items-center space-x-1 font-semibold">
                                <Clock className="w-3 h-3 text-purple-700" />
                                <span>PRE-ORDER ITEM</span>
                              </span>
                              {item.variant?.preOrderNote && (
                                <span className="text-[10px] text-purple-700 font-mono">
                                  {item.variant.preOrderNote}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs font-semibold text-neutral-900">
                      {formatIDR(item.priceAtTime * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment History & Financial Log */}
          <div className="bg-white border border-neutral-200 p-4 rounded-xs space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center space-x-1.5 text-neutral-900 font-semibold">
                <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-[10px] uppercase tracking-wider">Payment History & Log</span>
              </div>
            </div>

            {order.payments && order.payments.length > 0 ? (
              <div className="divide-y divide-neutral-100 font-mono text-[11px] space-y-2">
                {order.payments.map((p) => (
                  <div key={p.id} className="pt-2 first:pt-0 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-neutral-800">{p.type}</span>
                        <span
                          className={`px-1.5 py-0.2 text-[9px] font-bold uppercase rounded-xs ${
                            p.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Method: {p.paymentMethod} &bull; Date:{' '}
                        {new Date(p.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="font-semibold text-neutral-900">{formatIDR(p.amount)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-neutral-400 font-mono">No payment records found.</p>
            )}

            {/* Financial Summary */}
            <div className="pt-3 border-t border-neutral-200 font-mono text-xs space-y-1.5 bg-neutral-50 p-3 rounded-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Total Order Amount:</span>
                <span>{formatIDR(order.totalAmount)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-purple-700">
                  <span>Discount Applied:</span>
                  <span>-{formatIDR(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>Total Paid (Completed):</span>
                <span>{formatIDR(completedPaymentsTotal)}</span>
              </div>
              {remainingBalance > 0 ? (
                <div className="flex justify-between text-amber-800 font-bold bg-amber-100/80 p-1.5 rounded-xs mt-1">
                  <span>Remaining Balance Due:</span>
                  <span>{formatIDR(remainingBalance)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-emerald-800 font-bold bg-emerald-100/80 p-1.5 rounded-xs mt-1">
                  <span>Payment Status:</span>
                  <span>PAID IN FULL</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping & Tracking Form */}
          <div className="bg-white border border-neutral-200 p-4 rounded-xs space-y-3">
            <div className="flex items-center space-x-1.5 text-neutral-900 font-semibold border-b border-neutral-100 pb-2">
              <Truck className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-[10px] uppercase tracking-wider">Courier & Shipping Info</span>
            </div>

            <form onSubmit={handleSaveShipping} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                    Courier Name
                  </label>
                  <input
                    type="text"
                    value={courierInput}
                    onChange={(e) => setCourierInput(e.target.value)}
                    placeholder="e.g. JNE Express"
                    className="w-full border border-neutral-200 rounded-xs p-2 focus:outline-hidden focus:border-black text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="e.g. JNE987654321"
                    className="w-full border border-neutral-200 rounded-xs p-2 focus:outline-hidden focus:border-black text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-black text-white text-xs font-medium uppercase tracking-wider rounded-xs hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Updating...' : 'Save Shipping Info'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
