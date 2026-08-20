'use client';

import React from 'react';
import { Calendar, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import RentalAvailabilityCalendar from '../RentalAvailabilityCalendar';
import { formatIDR } from '@/lib/utils/product-stock';

export interface ProductRentalSectionProps {
  variantId: string;
  dailyRate?: number | null;
  rentStartDate?: string;
  rentEndDate?: string;
  isRentalDatesValid?: boolean;
  onSelectDates: (startDate: string, endDate: string, isValid: boolean) => void;
  className?: string;
}

export default function ProductRentalSection({
  variantId,
  dailyRate,
  rentStartDate,
  rentEndDate,
  isRentalDatesValid,
  onSelectDates,
  className = '',
}: ProductRentalSectionProps) {
  // Calculate rental duration in days
  let rentalDurationDays = 0;
  let estimatedTotalRental = 0;
  let estimatedDeposit = 0;

  if (rentStartDate && rentEndDate && isRentalDatesValid && dailyRate) {
    const start = new Date(rentStartDate);
    const end = new Date(rentEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    rentalDurationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    estimatedTotalRental = rentalDurationDays * dailyRate;
    // Standard security deposit calculation (e.g. equal to 1-day rate or fixed percentage)
    estimatedDeposit = Math.round(dailyRate * 1.5);
  }

  return (
    <div className={`space-y-4 rounded-xs border border-neutral-200 bg-neutral-50/50 p-4 sm:p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200/80 pb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-neutral-900" />
          <h3 className="font-serif text-sm sm:text-base font-medium text-neutral-900">
            Bespoke Rental Reservation
          </h3>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded-xs">
          Live Calendar
        </span>
      </div>

      {/* Date Range Selection & Cost Breakdown */}
      {rentStartDate && rentEndDate && isRentalDatesValid ? (
        <div className="bg-white border border-neutral-200 p-3.5 rounded-xs space-y-2 text-xs">
          <div className="flex justify-between items-center text-neutral-800">
            <span className="text-neutral-500 font-sans">Selected Period:</span>
            <span className="font-mono font-medium text-neutral-900">
              {rentStartDate} &rarr; {rentEndDate} ({rentalDurationDays} {rentalDurationDays === 1 ? 'day' : 'days'})
            </span>
          </div>

          {dailyRate ? (
            <div className="flex justify-between items-center text-neutral-800 pt-1 border-t border-neutral-100">
              <span className="text-neutral-500 font-sans">Estimated Rental Fee:</span>
              <span className="font-mono font-semibold text-neutral-900">
                {formatIDR(estimatedTotalRental)}
              </span>
            </div>
          ) : null}

          <div className="flex items-center space-x-1.5 text-[11px] text-emerald-800 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-emerald-700" />
            <span>Includes insured delivery, complimentary post-event dry cleaning & fit guarantee.</span>
          </div>
        </div>
      ) : (
        <div className="flex items-start space-x-2 bg-amber-50/80 border border-amber-200/70 p-3 rounded-xs text-[11px] text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <span>
            Please select your desired start and return dates on the interactive calendar below to reserve this piece.
          </span>
        </div>
      )}

      {/* Interactive Calendar */}
      <div className="bg-white rounded-xs border border-neutral-200/80 p-2 sm:p-3 overflow-hidden shadow-2xs">
        <RentalAvailabilityCalendar
          key={variantId}
          variantId={variantId}
          dailyRate={dailyRate}
          initialStartDate={rentStartDate}
          initialEndDate={rentEndDate}
          onSelectDates={onSelectDates}
        />
      </div>

      {/* Luxury Rental Guarantees */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-500 pt-2">
        <div className="flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
          <span>Hand-steamed & sanitized before dispatch</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
          <span>100% Refundable security deposit</span>
        </div>
      </div>
    </div>
  );
}
