'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import {
  getVariantRentalAvailabilityAction,
  VariantRentalAvailability,
} from '@/app/actions/rental';

interface RentalAvailabilityCalendarProps {
  variantId: string;
  dailyRate?: number | null;
  initialStartDate?: string;
  initialEndDate?: string;
  onSelectDates: (startDate: string, endDate: string, isValid: boolean) => void;
}

export default function RentalAvailabilityCalendar({
  variantId,
  dailyRate,
  initialStartDate,
  initialEndDate,
  onSelectDates,
}: RentalAvailabilityCalendarProps) {
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<VariantRentalAvailability | null>(null);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedStart, setSelectedStart] = useState<string | null>(initialStartDate || null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(initialEndDate || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!variantId) return;
    let isMounted = true;
    setLoading(true);

    getVariantRentalAvailabilityAction(variantId)
      .then((data) => {
        if (isMounted) {
          setAvailability(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load rental availability:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [variantId]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getDateStatus = (dateStr: string): 'PAST' | 'BOOKED' | 'MAINTENANCE' | 'AVAILABLE' => {
    if (dateStr < todayStr) return 'PAST';

    if (!availability) return 'AVAILABLE';

    const capacity = availability.stockRentTotal || 1;

    const activeBookingsCount = availability.bookedRanges.filter(
      (b) => dateStr >= b.startDate && dateStr <= b.endDate
    ).length;

    const maintenanceCount = availability.maintenanceRanges.filter(
      (m) => dateStr >= m.startDate && dateStr <= m.endDate
    ).length;

    const totalOccupied = activeBookingsCount + maintenanceCount;

    if (totalOccupied < capacity) {
      return 'AVAILABLE';
    }

    if (activeBookingsCount >= capacity) {
      return 'BOOKED';
    } else if (maintenanceCount >= capacity) {
      return 'MAINTENANCE';
    } else {
      return maintenanceCount > 0 ? 'MAINTENANCE' : 'BOOKED';
    }
  };

  const handleDateClick = (dateStr: string, status: string) => {
    if (status === 'PAST' || status === 'BOOKED' || status === 'MAINTENANCE') {
      if (status === 'BOOKED') {
        setErrorMessage('This date is reserved by another patron.');
      } else if (status === 'MAINTENANCE') {
        setErrorMessage('This date is unavailable due to atelier dry cleaning / maintenance.');
      }
      return;
    }

    setErrorMessage(null);

    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(dateStr);
      setSelectedEnd(null);
      onSelectDates(dateStr, '', false);
    } else if (selectedStart && !selectedEnd) {
      if (dateStr < selectedStart) {
        setSelectedStart(dateStr);
        setSelectedEnd(null);
        onSelectDates(dateStr, '', false);
      } else {
        // Validate all dates in between
        let curr = new Date(selectedStart);
        const end = new Date(dateStr);
        let hasCollision = false;

        while (curr <= end) {
          const checkStr = curr.toISOString().split('T')[0];
          const st = getDateStatus(checkStr);
          if (st === 'BOOKED' || st === 'MAINTENANCE') {
            hasCollision = true;
            break;
          }
          curr.setDate(curr.getDate() + 1);
        }

        if (hasCollision) {
          setErrorMessage('Selected rental period includes reserved or maintenance dates.');
          setSelectedEnd(null);
          onSelectDates('', '', false);
        } else {
          setSelectedEnd(dateStr);
          onSelectDates(selectedStart, dateStr, true);
        }
      }
    }
  };

  const handleQuickSelectDays = (days: number) => {
    setErrorMessage(null);
    let startToUse = selectedStart;

    // If no start date or invalid start date, pick today or first available
    if (!startToUse || startToUse < todayStr) {
      startToUse = todayStr;
      let checkDate = new Date();
      while (getDateStatus(startToUse) !== 'AVAILABLE') {
        checkDate.setDate(checkDate.getDate() + 1);
        startToUse = checkDate.toISOString().split('T')[0];
      }
    }

    const startObj = new Date(startToUse);
    const endObj = new Date(startObj);
    endObj.setDate(startObj.getDate() + days - 1);
    const calculatedEndStr = endObj.toISOString().split('T')[0];

    // Validate date range
    let curr = new Date(startToUse);
    let hasCollision = false;
    while (curr <= endObj) {
      const checkStr = curr.toISOString().split('T')[0];
      const st = getDateStatus(checkStr);
      if (st === 'BOOKED' || st === 'MAINTENANCE') {
        hasCollision = true;
        break;
      }
      curr.setDate(curr.getDate() + 1);
    }

    if (hasCollision) {
      setErrorMessage(`A ${days}-day rental from ${startToUse} contains unavailable dates. Please choose another start date.`);
      setSelectedStart(startToUse);
      setSelectedEnd(null);
      onSelectDates(startToUse, '', false);
    } else {
      setSelectedStart(startToUse);
      setSelectedEnd(calculatedEndStr);
      onSelectDates(startToUse, calculatedEndStr, true);
    }
  };

  const handleReset = () => {
    setSelectedStart(null);
    setSelectedEnd(null);
    setErrorMessage(null);
    onSelectDates('', '', false);
  };

  const calculateDays = () => {
    if (!selectedStart || !selectedEnd) return 0;
    const start = new Date(selectedStart);
    const end = new Date(selectedEnd);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const rentalDays = calculateDays();
  const totalPrice = dailyRate ? rentalDays * Number(dailyRate) : 0;

  const formatIDR = (amt: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const formatDateFormatted = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white border border-neutral-200/80 p-5 sm:p-6 space-y-6 font-sans text-xs tracking-wide shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
      {/* Atelier Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-2">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-neutral-400 font-light uppercase block mb-0.5">
            Atelier Rental Scheduler
          </span>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-neutral-900" />
            <h3 className="font-serif text-base text-neutral-900 font-medium tracking-wide">
              Check Availability & Reserve
            </h3>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center space-x-1.5 text-[10px] text-neutral-400 uppercase tracking-widest font-light">
            <RefreshCw className="w-3 h-3 animate-spin text-neutral-500" />
            <span>Checking Atelier Schedules...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1 border border-emerald-200/60 font-medium uppercase tracking-wider rounded-none">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Live Availability Sync</span>
          </div>
        )}
      </div>

      {/* Refined Color Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] py-2.5 px-3 bg-neutral-50/80 border border-neutral-100">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block shadow-xs"></span>
          <span className="text-neutral-800 font-medium tracking-wider uppercase text-[9px]">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-rose-700/80 inline-block"></span>
          <span className="text-neutral-600 font-medium tracking-wider uppercase text-[9px]">Reserved</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-600/80 inline-block"></span>
          <span className="text-neutral-600 font-medium tracking-wider uppercase text-[9px]">Maintenance</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-neutral-300 inline-block"></span>
          <span className="text-neutral-400 font-medium tracking-wider uppercase text-[9px]">Unavailable</span>
        </div>
      </div>

      {/* Quick Duration Preset Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-500 font-light">
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-neutral-400" />
            <span>Quick Rental Duration:</span>
          </span>
          {selectedStart && (
            <button
              type="button"
              onClick={handleReset}
              className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600 transition-colors uppercase font-medium text-[9px]"
            >
              Reset Selection
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {[3, 5, 7, 14].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => handleQuickSelectDays(days)}
              className={`px-3 py-1.5 text-[10px] font-sans uppercase tracking-widest transition-all duration-200 border ${
                rentalDays === days
                  ? 'bg-neutral-900 text-white border-neutral-900 font-medium shadow-xs'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900 hover:text-neutral-900'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Month Header & Navigation */}
      <div className="flex items-center justify-between pt-2 pb-1 border-t border-neutral-100">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 border border-neutral-200 text-neutral-700 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-all duration-200"
          title="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="font-serif text-base font-normal text-neutral-900 tracking-widest">
          {monthNames[month]} <span className="font-sans font-light text-neutral-500 text-sm">{year}</span>
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 border border-neutral-200 text-neutral-700 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-all duration-200"
          title="Next Month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div>
        <div className="grid grid-cols-7 text-center text-[10px] text-neutral-400 font-light tracking-[0.2em] uppercase mb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-10 sm:h-11" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const status = getDateStatus(dayStr);

            const isSelectedStart = dayStr === selectedStart;
            const isSelectedEnd = dayStr === selectedEnd;
            const isInRange =
              selectedStart &&
              selectedEnd &&
              dayStr >= selectedStart &&
              dayStr <= selectedEnd;

            const capacity = availability?.stockRentTotal || 1;
            const activeBookingsCount = availability?.bookedRanges.filter(
              (b) => dayStr >= b.startDate && dayStr <= b.endDate
            ).length || 0;
            const maintenanceCount = availability?.maintenanceRanges.filter(
              (m) => dayStr >= m.startDate && dayStr <= m.endDate
            ).length || 0;
            const totalOccupied = activeBookingsCount + maintenanceCount;
            const remaining = Math.max(0, capacity - totalOccupied);

            let bgClass = '';
            let textClass = 'text-neutral-800';
            let borderClass = 'border-neutral-200';

            if (status === 'PAST') {
              bgClass = 'bg-neutral-50/60 opacity-40 cursor-not-allowed';
              textClass = 'text-neutral-300';
              borderClass = 'border-transparent';
            } else if (status === 'BOOKED') {
              bgClass = 'bg-rose-50/80 text-rose-800/80 cursor-not-allowed line-through decoration-rose-300/80';
              textClass = 'text-rose-900/70';
              borderClass = 'border-rose-100';
            } else if (status === 'MAINTENANCE') {
              bgClass = 'bg-amber-50/80 text-amber-900/80 cursor-not-allowed';
              textClass = 'text-amber-900/70';
              borderClass = 'border-amber-100';
            } else {
              // AVAILABLE
              bgClass = 'bg-white hover:bg-neutral-900 hover:text-white cursor-pointer';
              textClass = 'text-neutral-900 font-medium';
              borderClass = 'border-neutral-200/90 hover:border-neutral-900';
            }

            if (isInRange) {
              bgClass = 'bg-neutral-900/10 text-neutral-900 font-semibold border-y border-neutral-900/30';
              textClass = 'text-neutral-900';
            }

            if (isSelectedStart) {
              bgClass = 'bg-neutral-900 text-white font-serif shadow-sm border-neutral-900 z-10';
              textClass = 'text-white';
            }

            if (isSelectedEnd) {
              bgClass = 'bg-neutral-900 text-white font-serif shadow-sm border-neutral-900 z-10';
              textClass = 'text-white';
            }

            return (
              <button
                key={dayStr}
                type="button"
                onClick={() => handleDateClick(dayStr, status)}
                className={`h-10 sm:h-11 border text-xs font-sans transition-all duration-150 flex flex-col items-center justify-center relative ${bgClass} ${textClass} ${borderClass}`}
              >
                <span>{dayNum}</span>
                {status === 'AVAILABLE' && !isInRange && !isSelectedStart && !isSelectedEnd && (
                  totalOccupied > 0 && capacity > 1 ? (
                    <span className="text-[8px] text-emerald-700 font-normal leading-none -mt-0.5">{remaining} left</span>
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-emerald-500/80 absolute bottom-1"></span>
                  )
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Warning Message */}
      {errorMessage && (
        <div className="p-3 bg-neutral-900 text-white text-[11px] font-light tracking-wider flex items-center space-x-2.5 shadow-sm border border-neutral-800">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selected Period Atelier Summary Card */}
      {selectedStart ? (
        <div className="p-4 bg-neutral-950 text-white space-y-3.5 border border-neutral-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
            <div>
              <span className="text-neutral-400 block text-[9px] uppercase tracking-[0.2em] font-light mb-0.5">
                Selected Booking Period
              </span>
              <span className="font-serif text-sm font-normal text-white tracking-wide">
                {formatDateFormatted(selectedStart)}
                {selectedEnd ? (
                  <>
                    <span className="mx-2 text-neutral-500 font-sans">→</span>
                    {formatDateFormatted(selectedEnd)}
                  </>
                ) : (
                  <span className="text-neutral-400 text-xs italic font-sans ml-2">
                    (Select return date)
                  </span>
                )}
              </span>
            </div>

            {selectedEnd && (
              <div className="text-left sm:text-right">
                <span className="text-neutral-400 block text-[9px] uppercase tracking-[0.2em] font-light mb-0.5">
                  Rental Duration & Fee
                </span>
                <span className="font-serif text-base text-amber-200 font-normal">
                  {rentalDays} {rentalDays === 1 ? 'Day' : 'Days'} ({formatIDR(totalPrice)})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 text-[10px] text-neutral-300 font-light tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Includes complimentary haute couture fitting, eco-friendly dry cleaning & protective garment box.
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-neutral-50 border border-dashed border-neutral-200 text-neutral-500 text-[11px] font-light text-center">
          Click an available date to set your rental start date, or use the quick duration presets above.
        </div>
      )}
    </div>
  );
}
