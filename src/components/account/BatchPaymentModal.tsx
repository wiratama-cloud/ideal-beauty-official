'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { QrCode, CheckCircle2, Copy, Clock, ShieldCheck, X, CreditCard, Building2, ChevronRight } from 'lucide-react';
import { createFinalPaymentAction, simulatePaymentCompletionAction } from '@/app/actions/checkout';

interface BatchPaymentModalProps {
  selectedOrders: any[];
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export default function BatchPaymentModal({
  selectedOrders,
  onClose,
  onPaymentSuccess,
}: BatchPaymentModalProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'BANK_TRANSFER'>('QRIS');
  const [bankName, setBankName] = useState('BCA');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePayments, setActivePayments] = useState<any[] | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins

  useEffect(() => {
    if (!activePayments || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activePayments, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getOrderRemainingBalance = (order: any) => {
    const completedPaid = (order.payments || [])
      .filter((p: any) => p.status === 'COMPLETED')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    return Math.max(0, Number(order.totalAmount || 0) - completedPaid);
  };

  const totalCombinedBalance = selectedOrders.reduce(
    (sum, order) => sum + getOrderRemainingBalance(order),
    0
  );

  const handleGenerateBatchPayment = async () => {
    if (selectedOrders.length === 0) return;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      // Generate final balance payments for all selected orders
      const payments = await Promise.all(
        selectedOrders.map((order) =>
          createFinalPaymentAction(order.id, paymentMethod, bankName)
        )
      );
      setActivePayments(payments);
    } catch (err: any) {
      console.error('Error generating batch payment:', err);
      setErrorMessage(err.message || 'Failed to generate batch payment. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSimulateBatchPayment = async () => {
    if (!activePayments || activePayments.length === 0) return;
    setIsSimulating(true);
    setErrorMessage(null);

    try {
      await Promise.all(
        activePayments.map((payment) => simulatePaymentCompletionAction(payment.id))
      );
      setIsCompleted(true);
      setTimeout(() => {
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
        router.refresh();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error completing batch payment simulation:', err);
      setErrorMessage(err.message || 'Error processing payment verification.');
    } finally {
      setIsSimulating(false);
    }
  };

  const primaryPayment = activePayments?.[0];

  const handleCopyVA = () => {
    if (primaryPayment?.vaNumber) {
      navigator.clipboard.writeText(primaryPayment.vaNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md font-light text-xs animate-fadeIn">
      <div className="bg-white max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl border border-neutral-200/80 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-black transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 border-b border-neutral-100 pb-5">
          <div className="flex items-center justify-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] uppercase tracking-[0.35em] text-amber-900/80 font-mono">
              HAUTE COUTURE BATCH CHECKOUT
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900">
            {activePayments ? 'Batch Payment Gateway' : 'Consolidated Checkout'}
          </h2>
          <p className="text-neutral-500 text-xs">
            {activePayments
              ? `Processing payment for ${selectedOrders.length} selected orders`
              : `Settle outstanding balances across ${selectedOrders.length} orders simultaneously`}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Selected Orders Breakdown */}
        <div className="bg-neutral-50 p-4 border border-neutral-200/80 space-y-3">
          <div className="flex justify-between items-center text-[11px] uppercase tracking-wider text-neutral-500 font-mono border-b border-neutral-200/60 pb-2">
            <span>Selected Orders ({selectedOrders.length})</span>
            <span>Balance Due</span>
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {selectedOrders.map((order) => {
              const orderBalance = getOrderRemainingBalance(order);
              const firstItem = order.items?.[0]?.variant?.product?.name || 'Atelier Masterpiece';
              return (
                <div key={order.id} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-serif font-medium text-neutral-900">
                      Order #{order.id.substring(0, 8)}
                    </span>
                    <span className="text-[10px] text-neutral-500 block truncate max-w-[200px]">
                      {firstItem} {order.items?.length > 1 ? `+${order.items.length - 1} more` : ''}
                    </span>
                  </div>
                  <span className="font-mono font-medium text-amber-900">
                    {formatIDR(orderBalance)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-neutral-200/60 font-mono text-sm font-bold text-neutral-900">
            <span>Total Combined Amount:</span>
            <span className="text-amber-800 font-serif text-lg">{formatIDR(totalCombinedBalance)}</span>
          </div>
        </div>

        {/* Step 1: Payment Method Selection */}
        {!activePayments && (
          <div className="space-y-5">
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-widest text-neutral-600 font-medium block">
                Select Payment Option
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`p-4 border text-left transition-all flex flex-col justify-between space-y-2 ${
                    paymentMethod === 'QRIS'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  <QrCode className={`w-5 h-5 ${paymentMethod === 'QRIS' ? 'text-amber-400' : 'text-neutral-600'}`} />
                  <div>
                    <div className="font-medium text-xs uppercase tracking-wider">Instant QRIS</div>
                    <div className="text-[10px] opacity-75 mt-0.5">GoPay, OVO, ShopeePay, m-Banking</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-4 border text-left transition-all flex flex-col justify-between space-y-2 ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  <Building2 className={`w-5 h-5 ${paymentMethod === 'BANK_TRANSFER' ? 'text-amber-400' : 'text-neutral-600'}`} />
                  <div>
                    <div className="font-medium text-xs uppercase tracking-wider">Virtual Account</div>
                    <div className="text-[10px] opacity-75 mt-0.5">BCA, Mandiri, BNI, BRI</div>
                  </div>
                </button>
              </div>
            </div>

            {paymentMethod === 'BANK_TRANSFER' && (
              <div className="space-y-2 bg-neutral-50 p-4 border border-neutral-200">
                <label className="text-[10px] uppercase tracking-widest text-neutral-600 font-medium block">
                  Select Destination Bank
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['BCA', 'Mandiri', 'BNI', 'BRI'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setBankName(bank)}
                      className={`py-2 text-[11px] font-mono border text-center transition-all ${
                        bankName === bank
                          ? 'border-black bg-black text-white font-bold'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleGenerateBatchPayment}
              disabled={isGenerating || selectedOrders.length === 0}
              className="w-full bg-black text-white py-4 uppercase tracking-[0.25em] text-xs font-light hover:bg-neutral-800 transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <span>Generating Batch Payment Code...</span>
              ) : (
                <>
                  <span>Proceed to Pay {formatIDR(totalCombinedBalance)}</span>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Payment Verification / Code Display */}
        {activePayments && (
          <>
            {isCompleted ? (
              <div className="py-10 text-center space-y-3 bg-emerald-50 text-emerald-900 border border-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="font-serif text-xl font-normal">All Batch Payments Verified & Settled</h3>
                <p className="text-xs text-emerald-700">
                  {selectedOrders.length} orders updated to fully paid. Updating your order history...
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {paymentMethod === 'QRIS' ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="relative w-52 h-52 sm:w-60 sm:h-60 border-2 border-neutral-900 p-2 bg-white shadow-inner">
                        {primaryPayment?.qrisUrl ? (
                          <Image
                            src={primaryPayment.qrisUrl}
                            alt="Batch Payment QRIS Code"
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <QrCode className="w-24 h-24 text-neutral-300" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-2 text-xs font-mono text-amber-900 bg-amber-50 py-2 px-3 border border-amber-200">
                      <Clock className="w-4 h-4 text-amber-600 animate-spin-slow" />
                      <span>Valid for: {formatTime(timeLeft)}</span>
                    </div>

                    <div className="bg-neutral-50 p-4 space-y-1.5 border border-neutral-200/80 text-[11px] text-neutral-600">
                      <p className="font-medium text-neutral-900 uppercase tracking-wider text-[10px]">
                        Scan to Settle Combined Balance:
                      </p>
                      <p>
                        Scan using any e-wallet or mobile banking app. The QR code covers all {selectedOrders.length} selected orders totalling{' '}
                        <strong className="text-neutral-900 font-mono">{formatIDR(totalCombinedBalance)}</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-neutral-50 p-5 border border-neutral-200 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="uppercase text-neutral-500 font-medium">Bank Virtual Account:</span>
                        <span className="font-bold text-neutral-900">{primaryPayment?.bankName || bankName}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-3.5 border border-neutral-200">
                        <span className="font-mono text-lg font-bold tracking-wider text-neutral-900">
                          {primaryPayment?.vaNumber || '880019283748291'}
                        </span>
                        <button
                          onClick={handleCopyVA}
                          className="flex items-center space-x-1.5 text-[10px] uppercase tracking-widest bg-neutral-900 text-white px-3 py-1.5 hover:bg-neutral-700 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copied ? 'Copied!' : 'Copy VA'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sandbox Simulation Button */}
                <div className="pt-3 border-t border-neutral-100 space-y-3">
                  <button
                    onClick={handleSimulateBatchPayment}
                    disabled={isSimulating}
                    className="w-full bg-neutral-900 text-white py-3.5 uppercase tracking-[0.2em] font-light hover:bg-black transition-all flex items-center justify-center space-x-2"
                  >
                    {isSimulating ? (
                      <span>Verifying Batch Settlement...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Confirm Payment Received (Sandbox)</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-neutral-400 text-center font-sans">
                    Real payment webhooks automatically confirm settlements in production.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
