'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, CheckCircle2, Clock, Calendar, ArrowLeft, ShieldCheck, QrCode } from 'lucide-react';
import { createFinalPaymentAction } from '@/app/actions/checkout';
import QRISModal from '@/components/checkout/QRISModal';
import { getOptimizedImageUrl } from '@/lib/utils/image-url';

interface OrderDetailViewProps {
  order: any;
}

export default function OrderDetailView({ order }: OrderDetailViewProps) {
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [activePayment, setActivePayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'BANK_TRANSFER'>('QRIS');

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const completedPaymentsTotal = order.payments
    .filter((p: any) => p.status === 'COMPLETED')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const remainingBalance = Number(order.totalAmount) - completedPaymentsTotal;

  const handlePayFinalBalance = async () => {
    setIsCreatingPayment(true);
    try {
      const payment = await createFinalPaymentAction(order.id, paymentMethod);
      setActivePayment(payment);
    } catch (err) {
      console.error('Error creating final balance payment:', err);
    } finally {
      setIsCreatingPayment(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-light text-xs space-y-8">
      <div className="flex items-center space-x-2 text-neutral-500">
        <Link href="/account/orders" className="hover:text-black flex items-center space-x-1 uppercase tracking-widest text-[10px]">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="bg-white border border-neutral-100 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-sans block">
            ORDER SUMMARY & TRACKING
          </span>
          <h1 className="font-serif text-2xl font-normal text-neutral-900">Order #{order.id}</h1>
          <p className="text-neutral-400 font-mono text-[11px]">
            Placed on {new Date(order.createdAt).toLocaleDateString('id-ID', { dateStyle: 'full' })}
          </p>
        </div>

        <div className="flex items-center space-x-3 font-mono">
          <span className="text-neutral-500 uppercase font-sans text-[10px]">Status:</span>
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

      {/* Courier & Shipping Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 border border-neutral-100 space-y-3">
          <div className="flex items-center space-x-2 text-neutral-900 uppercase tracking-widest font-medium border-b border-neutral-100 pb-2">
            <Truck className="w-4 h-4 text-neutral-700" />
            <span>Courier Dispatch & Tracking</span>
          </div>
          <p className="text-neutral-600">
            Courier Service: <strong className="text-neutral-900">{order.courierName || 'JNE Express / Atelier Private Courier'}</strong>
          </p>
          <p className="text-neutral-600">
            Tracking Code:{' '}
            <strong className="font-mono text-neutral-900 bg-neutral-100 px-2 py-0.5">
              {order.trackingNumber || `IB-ID-2026-${order.id.substring(0, 6).toUpperCase()}`}
            </strong>
          </p>
          <p className="text-[11px] text-neutral-400">Complimentary insured delivery with signature confirmation.</p>
        </div>

        <div className="bg-white p-6 border border-neutral-100 space-y-3">
          <div className="flex items-center space-x-2 text-neutral-900 uppercase tracking-widest font-medium border-b border-neutral-100 pb-2">
            <ShieldCheck className="w-4 h-4 text-neutral-700" />
            <span>Shipping Recipient</span>
          </div>
          {order.shippingAddress ? (
            <div className="space-y-1 text-neutral-700">
              <p className="font-medium text-neutral-900">{order.shippingAddress.recipientName} ({order.shippingAddress.phone})</p>
              <p>{order.shippingAddress.addressLine1}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}</p>
            </div>
          ) : (
            <p className="text-neutral-400">Address recorded on file.</p>
          )}
        </div>
      </div>

      {/* Order Items Table */}
      <div className="bg-white border border-neutral-100 p-6 sm:p-8 space-y-6">
        <h2 className="font-serif text-lg text-neutral-900 uppercase tracking-widest border-b border-neutral-100 pb-3">
          Ensemble Items ({order.items.length})
        </h2>

        <div className="divide-y divide-neutral-100 space-y-4">
          {order.items.map((item: any) => {
            const product = item.variant?.product;
            const attrs = item.variant?.attributes;
            const image = getOptimizedImageUrl(product?.images?.[0], 256);

            return (
              <div key={item.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 aspect-[3/4] bg-neutral-100 flex-shrink-0 rounded-xs overflow-hidden">
                    <Image
                      src={image}
                      alt={product?.name || ''}
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== '/images/products/default-product.jpg') {
                          target.src = '/images/products/default-product.jpg';
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-sm text-neutral-900 font-medium">{product?.name}</h3>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                      Type: <span className="font-bold text-neutral-800">{item.type}</span> &bull; SKU: {item.variant?.sku}
                    </p>
                    {attrs && (
                      <p className="text-[10px] text-neutral-400 font-mono">
                        Attributes: {attrs.size ? `Size ${attrs.size}` : ''} {attrs.color ? `Color ${attrs.color}` : ''}
                      </p>
                    )}

                    {item.type === 'RENTAL' && item.rentStartDate && item.rentEndDate && (
                      <div className="mt-2 bg-amber-50 text-amber-900 p-2 text-[10px] flex items-center space-x-1 border border-amber-200">
                        <Calendar className="w-3.5 h-3.5 text-amber-700" />
                        <span>
                          Rental Schedule: {new Date(item.rentStartDate).toLocaleDateString('id-ID')} &ndash;{' '}
                          {new Date(item.rentEndDate).toLocaleDateString('id-ID')} ({item.rentalStatus})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <p className="text-xs font-bold text-neutral-900">{formatIDR(Number(item.priceAtTime) * item.quantity)}</p>
                  <p className="text-[10px] text-neutral-400">Qty: {item.quantity}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Ledger & Final Balance Trigger */}
      <div className="bg-white border border-neutral-100 p-6 sm:p-8 space-y-6">
        <h2 className="font-serif text-lg text-neutral-900 uppercase tracking-widest border-b border-neutral-100 pb-3">
          Payment Ledger & Balance Settlement
        </h2>

        <div className="space-y-3 font-mono">
          <div className="flex justify-between text-neutral-600">
            <span>Total Order Amount:</span>
            <span>{formatIDR(Number(order.totalAmount))}</span>
          </div>
          <div className="flex justify-between text-emerald-800 bg-emerald-50 p-2">
            <span>Completed Payments Received:</span>
            <span>{formatIDR(completedPaymentsTotal)}</span>
          </div>

          <div className="flex justify-between text-neutral-900 font-bold text-sm pt-2 border-t border-neutral-200">
            <span>Remaining Balance Due:</span>
            <span>{formatIDR(remainingBalance)}</span>
          </div>
        </div>

        {/* Previous Payment Transactions Audit Trail */}
        <div className="pt-4 border-t border-neutral-100 space-y-2">
          <p className="font-medium text-neutral-900 uppercase tracking-widest text-[10px]">Payment Audit History:</p>
          <div className="space-y-2">
            {order.payments.map((p: any) => (
              <div key={p.id} className="p-3 bg-neutral-50 border border-neutral-100 flex justify-between items-center text-[11px] font-mono">
                <div>
                  <span className="font-sans font-medium text-neutral-900 uppercase mr-2">{p.type}</span>
                  <span className="text-neutral-500">Method: {p.paymentMethod || 'QRIS'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-neutral-900">{formatIDR(Number(p.amount))}</span>
                  <span
                    className={`px-2 py-0.5 uppercase tracking-widest text-[9px] ${
                      p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pay Final Balance Action (if remaining balance > 0) */}
        {remainingBalance > 0 && (
          <div className="pt-6 border-t border-neutral-200 bg-neutral-900 text-white p-6 space-y-4">
            <div>
              <h3 className="font-serif text-base uppercase tracking-widest font-normal">
                Settle Remaining Final Balance
              </h3>
              <p className="text-neutral-300 text-xs mt-1">
                Your down payment reserved your ensemble. Pay the final balance of{' '}
                <strong className="text-white font-mono">{formatIDR(remainingBalance)}</strong> prior to dispatch.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`px-4 py-2 uppercase text-[10px] tracking-widest border transition-all ${
                    paymentMethod === 'QRIS' ? 'bg-white text-black border-white' : 'border-neutral-700 text-neutral-300'
                  }`}
                >
                  QRIS
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`px-4 py-2 uppercase text-[10px] tracking-widest border transition-all ${
                    paymentMethod === 'BANK_TRANSFER' ? 'bg-white text-black border-white' : 'border-neutral-700 text-neutral-300'
                  }`}
                >
                  Virtual Account
                </button>
              </div>

              <button
                onClick={handlePayFinalBalance}
                disabled={isCreatingPayment}
                className="w-full sm:w-auto flex-1 bg-white text-black py-3.5 uppercase tracking-[0.2em] font-light hover:bg-neutral-200 transition-colors flex items-center justify-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span>{isCreatingPayment ? 'Generating Payment...' : `Pay Balance ${formatIDR(remainingBalance)}`}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {activePayment && (
        <QRISModal payment={activePayment} onClose={() => setActivePayment(null)} />
      )}
    </div>
  );
}
