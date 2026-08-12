'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { QrCode, CheckCircle2, Copy, Clock, ShieldCheck, X } from 'lucide-react';
import { simulatePaymentCompletionAction } from '@/app/actions/checkout';

interface QRISModalProps {
  payment: {
    id: string;
    orderId: string;
    amount: any;
    qrisUrl?: string | null;
    vaNumber?: string | null;
    bankName?: string | null;
    paymentMethod?: string | null;
  };
  onClose?: () => void;
}

export default function QRISModal({ payment, onClose }: QRISModalProps) {
  const router = useRouter();
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

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

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      await simulatePaymentCompletionAction(payment.id);
      setIsCompleted(true);
      setTimeout(() => {
        router.push(`/account/orders/${payment.orderId}`);
      }, 2000);
    } catch (err) {
      console.error('Error completing payment', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopyVA = () => {
    if (payment.vaNumber) {
      navigator.clipboard.writeText(payment.vaNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-light text-xs">
      <div className="bg-white max-w-lg w-full p-6 sm:p-8 relative shadow-2xl space-y-6">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center space-y-1">
          <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-sans block">
            INDONESIA PAYMENT GATEWAY
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-light text-neutral-900">
            {payment.paymentMethod === 'QRIS' ? 'Scan Dynamic QRIS' : 'Bank Virtual Account'}
          </h2>
          <p className="text-neutral-500 font-mono text-sm pt-1">
            Amount: <span className="font-bold text-neutral-900">{formatIDR(Number(payment.amount))}</span>
          </p>
        </div>

        {isCompleted ? (
          <div className="py-12 text-center space-y-4 bg-emerald-50 text-emerald-900 border border-emerald-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="font-serif text-lg font-normal">Payment Verified & Settled</h3>
            <p className="text-xs text-emerald-700">Redirecting to your order confirmation & tracking...</p>
          </div>
        ) : (
          <>
            {payment.paymentMethod === 'QRIS' ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative w-48 h-48 sm:w-60 sm:h-60 border-2 border-neutral-900 p-2 bg-white">
                    {payment.qrisUrl ? (
                      <Image
                        src={payment.qrisUrl}
                        alt="QRIS Code"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <QrCode className="w-20 h-20 text-neutral-300" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2 text-xs font-mono text-amber-800 bg-amber-50 py-2 px-3">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Valid for: {formatTime(timeLeft)}</span>
                </div>

                <div className="bg-neutral-50 p-4 space-y-2 border border-neutral-100 text-[11px] text-neutral-600">
                  <p className="font-medium text-neutral-900">How to pay via QRIS:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open GoPay, OVO, ShopeePay, Dana, BCA Mobile, or Livin by Mandiri.</li>
                    <li>Select &quot;Scan QR&quot; and point camera at QR code above.</li>
                    <li>Confirm payment amount: <strong>{formatIDR(Number(payment.amount))}</strong>.</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="uppercase text-neutral-500 font-medium">Bank Name:</span>
                    <span className="font-bold text-neutral-900">{payment.bankName || 'BCA'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 border border-neutral-200">
                    <span className="font-mono text-base font-bold tracking-wider text-neutral-900">
                      {payment.vaNumber || '880019283748291'}
                    </span>
                    <button
                      onClick={handleCopyVA}
                      className="flex items-center space-x-1 text-[10px] uppercase tracking-widest text-neutral-600 hover:text-black"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sandbox Simulation Trigger */}
            <div className="pt-2 border-t border-neutral-100 space-y-3">
              <button
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="w-full bg-black text-white py-3.5 uppercase tracking-[0.2em] font-light hover:bg-neutral-800 transition-colors flex items-center justify-center space-x-2"
              >
                {isSimulating ? (
                  <span>Verifying Payment...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Confirm Payment Received (Sandbox)</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-neutral-400 text-center font-sans">
                Real webhook notifications automatically process when paying via live gateway.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
