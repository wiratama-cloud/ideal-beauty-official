'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/cart/CartContext';
import { submitCheckoutAction } from '@/app/actions/checkout';
import QRISModal from '@/components/checkout/QRISModal';
import { CreditCard, QrCode, Building2, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function CheckoutPage() {
  const { cart, subtotal } = useCart();

  const [address, setAddress] = useState({
    recipientName: 'Ayu Lestari',
    phone: '+6281234567890',
    addressLine1: 'Jl. Senopati No. 45, Kebayoran Baru',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12190',
  });

  const [paymentType, setPaymentType] = useState<'DOWN_PAYMENT' | 'FULL_PAYMENT'>('FULL_PAYMENT');
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'BANK_TRANSFER' | 'CREDIT_CARD'>('QRIS');
  const [bankName, setBankName] = useState('BCA');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePayment, setActivePayment] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const items = cart?.items || [];
  const hasRentalItems = items.some((item: any) => item.type === 'RENTAL');

  const effectivePaymentType = hasRentalItems ? 'FULL_PAYMENT' : paymentType;
  const initialAmountDue = effectivePaymentType === 'DOWN_PAYMENT' ? subtotal * 0.5 : subtotal;

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await submitCheckoutAction({
        shippingAddress: address,
        paymentType: effectivePaymentType,
        paymentMethod,
        bankName,
      });

      setActivePayment(res.payment);
    } catch (err: any) {
      console.error('Error placing order:', err);
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !activePayment) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4 font-light text-xs">
        <h2 className="font-serif text-2xl text-neutral-900">Your Shopping Bag is Empty</h2>
        <p className="text-neutral-500">Add luxury haute couture pieces to your cart before checking out.</p>
        <div className="pt-4">
          <Link
            href="/products"
            className="inline-block bg-black text-white px-8 py-3.5 uppercase tracking-widest hover:bg-neutral-800 transition-colors"
          >
            Explore Catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50/50 min-h-screen py-12 font-light text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center space-x-2 text-neutral-500">
          <Link href="/products" className="hover:text-black flex items-center space-x-1 uppercase tracking-widest text-[10px]">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        <div className="text-center mb-12 space-y-2">
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-sans block">
            SECURE ATELIER CHECKOUT
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-neutral-900">Order Reservation</h1>
        </div>

        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 text-xs text-center font-sans">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleOrderSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Delivery Address & Payment Options */}
          <div className="lg:col-span-7 space-y-8">
            {/* Shipping Address */}
            <div className="bg-white p-6 sm:p-8 border border-neutral-100 space-y-6">
              <h2 className="font-serif text-lg text-neutral-900 uppercase tracking-widest border-b border-neutral-100 pb-3">
                1. Delivery & Recipient Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-600 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={address.recipientName}
                    onChange={(e) => setAddress({ ...address, recipientName: e.target.value })}
                    className="w-full border border-neutral-300 p-2.5 bg-white text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full border border-neutral-300 p-2.5 bg-white text-neutral-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-neutral-600 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={address.addressLine1}
                    onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                    className="w-full border border-neutral-300 p-2.5 bg-white text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full border border-neutral-300 p-2.5 bg-white text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1">Province & Postal Code</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={address.province}
                      onChange={(e) => setAddress({ ...address, province: e.target.value })}
                      className="w-full border border-neutral-300 p-2.5 bg-white text-neutral-900"
                    />
                    <input
                      type="text"
                      required
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      className="w-full border border-neutral-300 p-2.5 bg-white text-neutral-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Schedule (Down Payment vs Full) */}
            <div className="bg-white p-6 sm:p-8 border border-neutral-100 space-y-6">
              <h2 className="font-serif text-lg text-neutral-900 uppercase tracking-widest border-b border-neutral-100 pb-3">
                2. Payment Plan Options
              </h2>

              {hasRentalItems && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-sans">
                  Note: Your bag contains rental item(s). Rentals require 100% full payment upon checkout.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentType('FULL_PAYMENT')}
                  className={`p-4 border text-left transition-all ${
                    effectivePaymentType === 'FULL_PAYMENT'
                      ? 'border-black bg-neutral-900 text-white'
                      : 'border-neutral-200 text-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  <div className="font-medium uppercase tracking-wider">Full Payment (100%)</div>
                  <div className="text-[11px] opacity-80 mt-1 font-mono">{formatIDR(subtotal)}</div>
                  <div className="text-[10px] opacity-60 mt-1">Settle entire order balance immediately.</div>
                </button>

                <button
                  type="button"
                  disabled={hasRentalItems}
                  onClick={() => !hasRentalItems && setPaymentType('DOWN_PAYMENT')}
                  className={`p-4 border text-left transition-all ${
                    hasRentalItems
                      ? 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-60'
                      : effectivePaymentType === 'DOWN_PAYMENT'
                      ? 'border-black bg-neutral-900 text-white'
                      : 'border-neutral-200 text-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  <div className="font-medium uppercase tracking-wider">Down Payment (50% Deposit)</div>
                  <div className="text-[11px] opacity-80 mt-1 font-mono">
                    {hasRentalItems ? 'N/A for Rentals' : `${formatIDR(subtotal * 0.5)} now`}
                  </div>
                  <div className="text-[10px] opacity-60 mt-1">
                    {hasRentalItems
                      ? 'Rental items must be paid in full.'
                      : 'Reserve bespoke piece now, pay balance prior to dispatch.'}
                  </div>
                </button>
              </div>
            </div>

            {/* Indonesian Payment Methods */}
            <div className="bg-white p-6 sm:p-8 border border-neutral-100 space-y-6">
              <h2 className="font-serif text-lg text-neutral-900 uppercase tracking-widest border-b border-neutral-100 pb-3">
                3. Indonesian Payment Method
              </h2>

              <div className="space-y-3">
                {/* QRIS Option */}
                <label
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${
                    paymentMethod === 'QRIS' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input type="radio" name="payMethod" checked={paymentMethod === 'QRIS'} readOnly className="accent-black" />
                    <QrCode className="w-5 h-5 text-neutral-800" />
                    <div>
                      <p className="font-medium uppercase tracking-wider text-neutral-900">QRIS Instant Scan</p>
                      <p className="text-[10px] text-neutral-500">GoPay, OVO, ShopeePay, Dana, BCA Mobile, Livin</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 uppercase tracking-widest font-mono">
                    Instant
                  </span>
                </label>

                {/* Bank Virtual Account Option */}
                <div
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-4 border cursor-pointer transition-all space-y-3 ${
                    paymentMethod === 'BANK_TRANSFER' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input type="radio" name="payMethod" checked={paymentMethod === 'BANK_TRANSFER'} readOnly className="accent-black" />
                      <Building2 className="w-5 h-5 text-neutral-800" />
                      <div>
                        <p className="font-medium uppercase tracking-wider text-neutral-900">Bank Virtual Account</p>
                        <p className="text-[10px] text-neutral-500">BCA, Mandiri, BNI, BRI Automatic Verification</p>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === 'BANK_TRANSFER' && (
                    <div className="pt-2 flex space-x-2">
                      {['BCA', 'MANDIRI', 'BNI', 'BRI'].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBankName(bank);
                          }}
                          className={`px-3 py-1.5 text-[10px] border uppercase font-mono ${
                            bankName === bank ? 'bg-black text-white border-black' : 'bg-white border-neutral-300 text-neutral-700'
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Credit Card */}
                <label
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${
                    paymentMethod === 'CREDIT_CARD' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input type="radio" name="payMethod" checked={paymentMethod === 'CREDIT_CARD'} readOnly className="accent-black" />
                    <CreditCard className="w-5 h-5 text-neutral-800" />
                    <div>
                      <p className="font-medium uppercase tracking-wider text-neutral-900">Credit / Debit Card</p>
                      <p className="text-[10px] text-neutral-500">Visa, Mastercard, JCB Secured by Midtrans</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 border border-neutral-100 space-y-6 sticky top-28">
              <h2 className="font-serif text-lg text-neutral-900 uppercase tracking-widest border-b border-neutral-100 pb-3">
                Order Summary ({items.length})
              </h2>

              <div className="divide-y divide-neutral-100 space-y-4 max-h-80 overflow-y-auto pr-1">
                {items.map((item: any) => {
                  const product = item.variant?.product;
                  const unitPrice =
                    item.type === 'RENTAL' ? Number(item.variant?.priceRent || 0) : Number(item.variant?.priceSale || 0);

                  const image = product?.images?.[0] || '/images/products/default-product.jpg';

                  return (
                    <div key={item.id} className="pt-4 first:pt-0 flex space-x-3">
                      <div className="relative w-16 aspect-[3/4] bg-neutral-100 flex-shrink-0">
                        <Image src={image} alt={product?.name || ''} fill className="object-cover" unoptimized />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-serif font-medium text-neutral-900 line-clamp-1">{product?.name}</p>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
                          Type: {item.type} &bull; Qty: {item.quantity}
                        </p>
                        <p className="font-mono text-xs text-neutral-900">{formatIDR(unitPrice * item.quantity)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-neutral-100 pt-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span className="font-sans uppercase tracking-wider text-[10px]">Order Subtotal</span>
                  <span>{formatIDR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span className="font-sans uppercase tracking-wider text-[10px]">Express Courier Shipping</span>
                  <span className="text-emerald-700 font-sans uppercase text-[10px]">Complimentary</span>
                </div>

                {effectivePaymentType === 'DOWN_PAYMENT' && (
                  <div className="flex justify-between text-amber-800 bg-amber-50 p-2 text-[11px]">
                    <span className="font-sans uppercase">Remaining Balance Later</span>
                    <span>{formatIDR(subtotal * 0.5)}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-900 font-bold text-sm pt-3 border-t border-neutral-200">
                  <span className="font-sans uppercase tracking-widest text-xs font-normal">Amount Due Now</span>
                  <span>{formatIDR(initialAmountDue)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-4 uppercase tracking-[0.2em] font-light hover:bg-neutral-800 transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Place Order & Pay {formatIDR(initialAmountDue)}</span>
                  </>
                )}
              </button>

              <div className="text-[10px] text-neutral-400 text-center font-sans space-y-1">
                <p>🔒 256-Bit SSL Encrypted Payment</p>
                <p>Stock is reserved immediately upon placement.</p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* QRIS / Payment Modal Overlay */}
      {activePayment && (
        <QRISModal payment={activePayment} onClose={() => setActivePayment(null)} />
      )}
    </div>
  );
}
