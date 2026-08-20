'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Ticket,
  Copy,
  Check,
  Search,
  Sparkles,
  Calendar,
  Clock,
  ShoppingBag,
  ArrowRight,
  Crown,
  AlertCircle,
  CheckCircle2,
  Tag,
  Loader2,
  RefreshCw,
  History,
  Info,
} from 'lucide-react';
import { checkVoucherAction } from '@/app/actions/account';

export interface PatronVoucherItem {
  id: string;
  code: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  startDate: string | Date | null;
  endDate: string | Date | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  targetType: 'EVENT' | 'CUSTOMER';
  userId: string | null;
  userUsageCount: number;
  isUsed: boolean;
  isExpired: boolean;
  isLimitReached: boolean;
  isStarted: boolean;
  isAvailable: boolean;
  usages?: Array<{
    id: string;
    orderId: string | null;
    discountAmount: number;
    usedAt: string | Date;
  }>;
  createdAt: string | Date;
}

export interface PatronVoucherHistoryItem {
  id: string;
  voucherId: string;
  orderId: string | null;
  discountAmount: number;
  usedAt: string | Date;
  voucher: {
    id: string;
    code: string;
    description: string | null;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    minPurchase: number | null;
    maxDiscount: number | null;
  } | null;
  order: {
    id: string;
    totalAmount: number;
    discountAmount: number;
    status: string;
    createdAt: string | Date;
  } | null;
}

export interface VouchersListClientProps {
  initialVouchers: PatronVoucherItem[];
  initialHistory: PatronVoucherHistoryItem[];
}

export default function VouchersListClient({
  initialVouchers,
  initialHistory,
}: VouchersListClientProps) {
  const [activeTab, setActiveTab] = useState<'available' | 'used_expired' | 'history'>('available');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Voucher Checker state
  const [checkCodeInput, setCheckCodeInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    valid: boolean;
    message?: string;
    voucher?: any;
    targetType?: string;
    reason?: string;
  } | null>(null);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'No expiry date';
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleCopyCode = async (code: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      }
      setCopiedCode(code);
      setTimeout(() => {
        setCopiedCode((current) => (current === code ? null : current));
      }, 2500);
    } catch {
      // Fallback
      setCopiedCode(code);
      setTimeout(() => {
        setCopiedCode(null);
      }, 2500);
    }
  };

  const handleCheckVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = checkCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    setIsChecking(true);
    setCheckResult(null);

    try {
      const res = await checkVoucherAction(cleanCode);
      if (res.success && res.data) {
        setCheckResult(res.data);
      } else {
        setCheckResult({
          valid: false,
          message: res.error || 'Unable to check voucher status at this time.',
        });
      }
    } catch (err: any) {
      setCheckResult({
        valid: false,
        message: err.message || 'An unexpected error occurred while checking voucher.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const availableVouchers = initialVouchers.filter((v) => v.isAvailable);
  const usedOrExpiredVouchers = initialVouchers.filter((v) => !v.isAvailable);

  return (
    <div className="space-y-8">
      {/* Interactive Voucher Code Checker Box */}
      <section className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-amber-500/30 text-white p-6 sm:p-8 rounded-lg shadow-sm">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-300">
              PROMO CODE LOOKUP & VALIDATION
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-white font-light">
            Have an Atelier Promo or VIP Voucher Code?
          </h2>
          <p className="text-xs text-neutral-300 font-light leading-relaxed">
            Enter your promotional code below to check discount eligibility, minimum spend terms, and validity before applying at checkout.
          </p>

          <form onSubmit={handleCheckVoucher} className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="ENTER PROMO CODE (E.g. VIPCOUTURE20)"
                value={checkCodeInput}
                onChange={(e) => setCheckCodeInput(e.target.value.toUpperCase())}
                className="w-full bg-neutral-950/80 border border-neutral-700 focus:border-amber-500 text-white placeholder-neutral-500 px-4 py-3 text-xs uppercase tracking-widest font-mono rounded-md outline-none transition-colors"
              />
              {checkCodeInput && (
                <button
                  type="button"
                  onClick={() => {
                    setCheckCodeInput('');
                    setCheckResult(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-[10px] font-mono"
                >
                  CLEAR
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isChecking || !checkCodeInput.trim()}
              className="inline-flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-6 py-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 shadow-xs"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Validate Code</span>
                </>
              )}
            </button>
          </form>

          {/* Validation Result Box */}
          {checkResult && (
            <div
              className={`mt-4 p-4 rounded-md border text-xs transition-all ${
                checkResult.valid
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  {checkResult.valid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold tracking-wide flex items-center gap-2">
                      <span className="font-mono uppercase text-sm">
                        {checkResult.voucher?.code || checkCodeInput}
                      </span>
                      <span
                        className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-mono font-medium ${
                          checkResult.valid
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {checkResult.valid ? 'Valid & Ready To Use' : 'Not Eligible'}
                      </span>
                    </p>
                    <p className="text-neutral-300 text-[11px]">
                      {checkResult.message || (checkResult.valid ? 'Voucher is active and ready for your next order.' : 'This voucher cannot be applied.')}
                    </p>

                    {checkResult.voucher && (
                      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-neutral-300 border-t border-neutral-700/50 mt-2">
                        <div>
                          Discount:{' '}
                          <strong className="text-amber-300">
                            {checkResult.voucher.discountType === 'PERCENTAGE'
                              ? `${checkResult.voucher.discountValue}% OFF`
                              : `${formatIDR(checkResult.voucher.discountValue)} OFF`}
                          </strong>
                          {checkResult.voucher.maxDiscount && (
                            <span className="text-neutral-400 block text-[10px]">
                              Max Discount: {formatIDR(checkResult.voucher.maxDiscount)}
                            </span>
                          )}
                        </div>
                        <div>
                          Min Spend:{' '}
                          <strong className="text-neutral-200">
                            {checkResult.voucher.minPurchase
                              ? formatIDR(checkResult.voucher.minPurchase)
                              : 'None'}
                          </strong>
                          <span className="text-neutral-400 block text-[10px]">
                            {checkResult.voucher.endDate
                              ? `Expires: ${formatDate(checkResult.voucher.endDate)}`
                              : 'No Expiry'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {checkResult.valid && checkResult.voucher && (
                  <button
                    onClick={() => handleCopyCode(checkResult.voucher.code)}
                    className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider shrink-0 transition-colors"
                  >
                    {copiedCode === checkResult.voucher.code ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Tabs Navigation */}
      <div className="bg-white border border-neutral-200/80 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-0">
          <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.18em] transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'available'
                  ? 'border-amber-600 text-neutral-900 font-medium'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              <Ticket
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                  activeTab === 'available' ? 'text-amber-600' : 'text-neutral-400'
                }`}
              />
              <span>Available ({availableVouchers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('used_expired')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.18em] transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'used_expired'
                  ? 'border-amber-600 text-neutral-900 font-medium'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              <Clock
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                  activeTab === 'used_expired' ? 'text-amber-600' : 'text-neutral-400'
                }`}
              />
              <span>Used & Expired ({usedOrExpiredVouchers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.18em] transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-amber-600 text-neutral-900 font-medium'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              <History
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                  activeTab === 'history' ? 'text-amber-600' : 'text-neutral-400'
                }`}
              />
              <span>History ({initialHistory.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Available Vouchers */}
        {activeTab === 'available' && (
          <div className="space-y-6 pt-2">
            {availableVouchers.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-neutral-300 bg-neutral-50/50 rounded-lg space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center mx-auto">
                  <Ticket className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg text-neutral-900 font-normal">
                    No Active Vouchers Available
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    You currently have no unused promotional or VIP vouchers. Check back soon for seasonal haute couture events or special patron privileges.
                  </p>
                </div>
                <Link
                  href="/products"
                  className="inline-flex items-center space-x-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded text-xs uppercase tracking-wider font-medium transition-colors"
                >
                  <span>Explore Atelier Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableVouchers.map((voucher) => {
                  const isCopied = copiedCode === voucher.code;
                  return (
                    <div
                      key={voucher.id}
                      className="relative bg-gradient-to-br from-white to-amber-50/30 border border-amber-200/90 rounded-lg p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-400/80 transition-all group"
                    >
                      {/* Top Header & Discount */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-1.5">
                            {voucher.targetType === 'CUSTOMER' ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-mono uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300/80 px-2 py-0.5 rounded">
                                <Crown className="w-3 h-3 text-amber-700" />
                                <span>Exclusive VIP Privilege</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-mono uppercase tracking-wider text-neutral-700 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded">
                                <Tag className="w-3 h-3 text-neutral-500" />
                                <span>Storewide Event</span>
                              </span>
                            )}
                          </div>
                          <span className="inline-flex items-center space-x-1 text-[10px] font-mono uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </span>
                        </div>

                        {/* Large Discount Figure */}
                        <div className="space-y-1">
                          <h4 className="font-serif text-2xl sm:text-3xl text-neutral-900 font-normal tracking-tight">
                            {voucher.discountType === 'PERCENTAGE'
                              ? `${voucher.discountValue}% OFF`
                              : `${formatIDR(voucher.discountValue)} OFF`}
                          </h4>
                          {voucher.description && (
                            <p className="text-xs text-neutral-600 font-light leading-relaxed">
                              {voucher.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Promo Code Box with One-Click Copy */}
                      <div className="bg-neutral-50 border border-dashed border-amber-300/80 p-3 rounded flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 block">
                            VOUCHER CODE
                          </span>
                          <span className="text-sm font-mono font-bold text-neutral-900 tracking-wider select-all">
                            {voucher.code}
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopyCode(voucher.code)}
                          className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded text-xs font-mono uppercase tracking-wider transition-all shadow-xs shrink-0 ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-600 hover:bg-amber-700 text-white'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Terms & Validity Breakdown */}
                      <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-500 font-mono space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center space-x-1">
                            <Info className="w-3 h-3 text-neutral-400" />
                            <span>Min. Spend:</span>
                          </span>
                          <span className="text-neutral-900 font-medium">
                            {voucher.minPurchase ? formatIDR(voucher.minPurchase) : 'No Minimum Spend'}
                          </span>
                        </div>

                        {voucher.discountType === 'PERCENTAGE' && voucher.maxDiscount && (
                          <div className="flex items-center justify-between">
                            <span>Max Discount Cap:</span>
                            <span className="text-neutral-900 font-medium">
                              {formatIDR(voucher.maxDiscount)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-neutral-400" />
                            <span>Validity:</span>
                          </span>
                          <span className="text-neutral-900 font-medium">
                            {voucher.endDate ? `Valid until ${formatDate(voucher.endDate)}` : 'Permanent / No Expiry'}
                          </span>
                        </div>
                      </div>

                      {/* Quick Apply CTA */}
                      <div className="pt-2">
                        <Link
                          href="/products"
                          className="w-full flex items-center justify-center space-x-2 py-2 text-xs uppercase tracking-widest text-neutral-700 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-400 rounded transition-colors"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Shop Eligible Collection</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Used & Expired Vouchers */}
        {activeTab === 'used_expired' && (
          <div className="space-y-6 pt-2">
            {usedOrExpiredVouchers.length === 0 ? (
              <div className="text-center py-12 px-4 border border-neutral-200 bg-neutral-50/30 rounded-lg space-y-2">
                <Clock className="w-8 h-8 text-neutral-300 mx-auto" />
                <h3 className="font-serif text-base text-neutral-700 font-normal">
                  No Used or Expired Vouchers
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  You do not have any past redeemed or expired promotional codes on record.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {usedOrExpiredVouchers.map((voucher) => {
                  let statusBadge = (
                    <span className="text-[10px] font-mono uppercase text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
                      Inactive
                    </span>
                  );

                  if (voucher.isUsed) {
                    statusBadge = (
                      <span className="text-[10px] font-mono uppercase text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-medium">
                        Redeemed
                      </span>
                    );
                  } else if (voucher.isExpired) {
                    statusBadge = (
                      <span className="text-[10px] font-mono uppercase text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                        Expired
                      </span>
                    );
                  } else if (voucher.isLimitReached) {
                    statusBadge = (
                      <span className="text-[10px] font-mono uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        Claim Limit Reached
                      </span>
                    );
                  }

                  return (
                    <div
                      key={voucher.id}
                      className="bg-neutral-50/70 border border-neutral-200 rounded-lg p-5 sm:p-6 space-y-4 opacity-80"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-1.5">
                          {voucher.targetType === 'CUSTOMER' ? (
                            <span className="text-[10px] font-mono uppercase text-neutral-600 bg-neutral-200/80 px-2 py-0.5 rounded">
                              VIP Exclusive
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono uppercase text-neutral-600 bg-neutral-200/80 px-2 py-0.5 rounded">
                              Storewide Event
                            </span>
                          )}
                        </div>
                        {statusBadge}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-serif text-xl text-neutral-700 font-normal">
                          {voucher.discountType === 'PERCENTAGE'
                            ? `${voucher.discountValue}% OFF`
                            : `${formatIDR(voucher.discountValue)} OFF`}
                        </h4>
                        {voucher.description && (
                          <p className="text-xs text-neutral-500 font-light">
                            {voucher.description}
                          </p>
                        )}
                      </div>

                      <div className="bg-white border border-neutral-200 p-2.5 rounded flex items-center justify-between">
                        <span className="text-xs font-mono text-neutral-600 uppercase font-semibold">
                          {voucher.code}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {voucher.isUsed ? 'Already Used' : 'Unavailable'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-neutral-200 text-[11px] text-neutral-500 font-mono space-y-1">
                        <div className="flex justify-between">
                          <span>Min Spend:</span>
                          <span>
                            {voucher.minPurchase ? formatIDR(voucher.minPurchase) : 'None'}
                          </span>
                        </div>
                        {voucher.endDate && (
                          <div className="flex justify-between">
                            <span>Expired On:</span>
                            <span>{formatDate(voucher.endDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Redemption History */}
        {activeTab === 'history' && (
          <div className="space-y-4 pt-2">
            {initialHistory.length === 0 ? (
              <div className="text-center py-12 px-4 border border-neutral-200 bg-neutral-50/30 rounded-lg space-y-2">
                <History className="w-8 h-8 text-neutral-300 mx-auto" />
                <h3 className="font-serif text-base text-neutral-700 font-normal">
                  No Redemption History Recorded
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  When you apply promotional codes or VIP vouchers to your haute couture reservations, your savings breakdown will be documented here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-100/70 border-b border-neutral-200 text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                      <th className="py-3 px-4">Date Redeemed</th>
                      <th className="py-3 px-4">Voucher Code</th>
                      <th className="py-3 px-4">Savings Applied</th>
                      <th className="py-3 px-4">Associated Order</th>
                      <th className="py-3 px-4 text-right">Order Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/80 font-mono">
                    {initialHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-neutral-700">
                          {new Date(item.usedAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-neutral-900 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                            {item.voucher?.code || 'PROMO'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-700">
                          -{formatIDR(item.discountAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600">
                          {item.orderId ? (
                            <Link
                              href="/account/orders"
                              className="text-amber-700 hover:underline inline-flex items-center space-x-1"
                            >
                              <span>#{item.orderId.slice(-8).toUpperCase()}</span>
                            </Link>
                          ) : (
                            <span className="text-neutral-400">Direct Checkout</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-neutral-100 text-neutral-700 border border-neutral-200">
                            {item.order?.status || 'COMPLETED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
