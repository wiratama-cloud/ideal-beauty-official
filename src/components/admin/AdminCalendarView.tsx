'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Wrench,
  Clock,
  User,
  ShoppingBag,
  X,
  Sparkles,
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  createRentalBlockAction,
  deleteRentalBlockAction,
} from '@/app/actions/rental';

interface RentalBlock {
  id: string;
  variantId: string;
  startDate: string;
  endDate: string;
  reason: string;
  notes?: string | null;
}

interface OrderItemRental {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  priceAtTime: number;
  rentStartDate: string | null;
  rentEndDate: string | null;
  rentalStatus: string;
  order: {
    id: string;
    status: string;
    totalAmount: number;
    user?: { name?: string | null; email?: string | null } | null;
    shippingAddress?: { recipientName?: string | null } | null;
  };
}

interface ProductVariant {
  id: string;
  sku: string;
  attributes: any;
  priceRent: number | null;
  stockRentTotal: number;
  stockRentAvailable: number;
  stockTotal: number;
  stockAvailable: number;
  rentalBlocks: RentalBlock[];
  orderItems: OrderItemRental[];
}

interface ProductWithCalendar {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  variants: ProductVariant[];
}

interface AdminCalendarViewProps {
  initialProducts: ProductWithCalendar[];
}

export default function AdminCalendarView({ initialProducts }: AdminCalendarViewProps) {
  const [products, setProducts] = useState<ProductWithCalendar[]>(initialProducts);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State for Maintenance Block
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [reasonInput, setReasonInput] = useState('MAINTENANCE');
  const [notesInput, setNotesInput] = useState('');
  const [isSavingBlock, setIsSavingBlock] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);

  // Detail Popover / Modal State
  const [detailItem, setDetailItem] = useState<{
    type: 'BOOKING' | 'MAINTENANCE';
    title: string;
    subtitle: string;
    startDate: string;
    endDate: string;
    notes?: string;
    blockId?: string;
  } | null>(null);

  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]));

  // Flatten variants for selection modal
  const allVariants = products.flatMap((p) =>
    p.variants.map((v) => ({
      variantId: v.id,
      productName: p.name,
      sku: v.sku,
      attr: JSON.stringify(v.attributes).replace(/["{}]/g, ' '),
    }))
  );

  // Compute metrics
  let totalActiveBookings = 0;
  let totalMaintenanceBlocks = 0;
  let totalRentalFleet = 0;

  products.forEach((p) => {
    p.variants.forEach((v) => {
      totalRentalFleet += v.stockRentTotal || v.stockTotal || 0;
      totalActiveBookings += v.orderItems.length;
      totalMaintenanceBlocks += v.rentalBlocks.length;
    });
  });

  const handleOpenModal = (vId?: string) => {
    setSelectedVariantId(vId || allVariants[0]?.variantId || '');
    const todayStr = new Date().toISOString().split('T')[0];
    const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setStartDateInput(todayStr);
    setEndDateInput(nextWeekStr);
    setReasonInput('MAINTENANCE');
    setNotesInput('');
    setModalErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId) {
      setModalErrorMessage('Please select a product variant.');
      return;
    }
    if (!startDateInput || !endDateInput) {
      setModalErrorMessage('Please enter valid start and end dates.');
      return;
    }

    setIsSavingBlock(true);
    setModalErrorMessage(null);

    try {
      const created = await createRentalBlockAction({
        variantId: selectedVariantId,
        startDate: startDateInput,
        endDate: endDateInput,
        reason: reasonInput,
        notes: notesInput,
      });

      // Update state
      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          variants: p.variants.map((v) =>
            v.id === selectedVariantId
              ? {
                  ...v,
                  rentalBlocks: [...v.rentalBlocks, created],
                }
              : v
          ),
        }))
      );

      setIsModalOpen(false);
    } catch (err: any) {
      setModalErrorMessage(err.message || 'Failed to create maintenance block.');
    } finally {
      setIsSavingBlock(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    setDeletingBlockId(blockId);
    try {
      await deleteRentalBlockAction(blockId);

      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          variants: p.variants.map((v) => ({
            ...v,
            rentalBlocks: v.rentalBlocks.filter((b) => b.id !== blockId),
          })),
        }))
      );

      setDetailItem(null);
    } catch (err) {
      console.error('Failed to delete rental block:', err);
    } finally {
      setDeletingBlockId(null);
    }
  };

  // Filter products & variants
  const filteredProducts = products
    .map((p) => {
      const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesProductQuery = !q || p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q));

      const matchingVariants = p.variants.filter((v) => {
        return !q || matchesProductQuery || v.sku.toLowerCase().includes(q);
      });

      if (matchesCategory && matchingVariants.length > 0) {
        return {
          ...p,
          variants: matchingVariants,
        };
      }
      return null;
    })
    .filter(Boolean) as ProductWithCalendar[];

  const formatIDR = (amt: number | null) => {
    if (!amt) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  return (
    <div className="min-h-screen bg-neutral-100 font-sans text-xs">
      <AdminHeader
        title="Rental Calendar & Maintenance Console"
        subtitle="Atelier Rental Fleet Tracker"
        activeTab="calendar"
        action={
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="bg-black text-white px-4 py-2.5 uppercase tracking-widest text-[10px] hover:bg-neutral-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Maintenance Block</span>
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 border border-neutral-200 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-full">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-medium">
                Active Rental Orders
              </span>
              <span className="font-serif text-2xl font-light text-neutral-900">{totalActiveBookings}</span>
            </div>
          </div>

          <div className="bg-white p-5 border border-neutral-200 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-medium">
                Scheduled Maintenance / Cleaning
              </span>
              <span className="font-serif text-2xl font-light text-neutral-900">{totalMaintenanceBlocks}</span>
            </div>
          </div>

          <div className="bg-white p-5 border border-neutral-200 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-medium">
                Total Rental Fleet Units
              </span>
              <span className="font-serif text-2xl font-light text-neutral-900">{totalRentalFleet}</span>
            </div>
          </div>
        </div>

        {/* Filters & Month Picker */}
        <div className="bg-white p-5 border border-neutral-200 space-y-4 shadow-xs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search product or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-black font-sans"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:border-black font-sans"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="flex items-center space-x-3 bg-neutral-50 border border-neutral-200 p-1.5 rounded-xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-neutral-200 text-neutral-700 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-serif text-sm font-medium text-neutral-900 min-w-[120px] text-center">
                {monthNames[month]} {year}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-neutral-200 text-neutral-700 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-neutral-100 text-[10px] uppercase tracking-wider text-neutral-600 font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded-xs inline-block"></span>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-rose-600 text-white rounded-xs inline-block"></span>
              <span>Customer Rental Booking</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-amber-500 text-white rounded-xs inline-block"></span>
              <span>Maintenance / Cleaning Block</span>
            </div>
          </div>
        </div>

        {/* Variant Schedule Grid */}
        <div className="bg-white border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] text-neutral-500 uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[200px] font-medium sticky left-0 bg-neutral-50 shadow-xs z-10">
                    Product / Variant SKU
                  </th>
                  <th className="py-3 px-3 w-24 text-center font-medium">Fleet Size</th>
                  <th className="py-3 px-3 w-28 text-right font-medium">Rent Rate</th>
                  {Array.from({ length: daysInMonth }).map((_, idx) => (
                    <th key={idx} className="py-3 px-1 w-8 text-center font-mono font-normal">
                      {idx + 1}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.map((product) =>
                  product.variants.map((variant) => {
                    const attrText =
                      typeof variant.attributes === 'object' && variant.attributes !== null
                        ? Object.entries(variant.attributes)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' ')
                        : String(variant.attributes || '');

                    return (
                      <tr key={variant.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-3 px-4 sticky left-0 bg-white shadow-xs z-10">
                          <div className="font-serif text-sm font-medium text-neutral-900">{product.name}</div>
                          <div className="text-[10px] font-mono text-neutral-500 flex items-center space-x-2">
                            <span className="font-bold text-neutral-800">{variant.sku}</span>
                            <span>&bull;</span>
                            <span>{attrText}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center font-mono text-[11px] text-neutral-700">
                          <span className="font-bold text-emerald-800">{variant.stockRentAvailable}</span> / {variant.stockRentTotal || variant.stockTotal || 1}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-[11px] text-neutral-900 font-semibold">
                          {formatIDR(variant.priceRent)}
                        </td>

                        {/* Calendar Day Cells */}
                        {Array.from({ length: daysInMonth }).map((_, idx) => {
                          const dayNum = idx + 1;
                          const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

                          const capacity = variant.stockRentTotal || variant.stockTotal || 1;

                          const dayBookings = variant.orderItems.filter(
                            (oi) => oi.rentStartDate && oi.rentEndDate && dayStr >= oi.rentStartDate && dayStr <= oi.rentEndDate
                          );

                          const dayBlocks = variant.rentalBlocks.filter(
                            (b) => dayStr >= b.startDate && dayStr <= b.endDate
                          );

                          const totalOccupied = dayBookings.length + dayBlocks.length;

                          if (totalOccupied >= capacity) {
                            const primaryBooking = dayBookings[0];
                            const primaryBlock = dayBlocks[0];

                            if (dayBookings.length >= capacity || (dayBookings.length > 0 && dayBlocks.length === 0)) {
                              return (
                                <td
                                  key={idx}
                                  className="p-0.5 text-center cursor-pointer"
                                  onClick={() =>
                                    setDetailItem({
                                      type: 'BOOKING',
                                      title: `Order #${primaryBooking.order.id.slice(0, 8)} (${dayBookings.length}/${capacity} rented)`,
                                      subtitle: `Customer: ${primaryBooking.order.shippingAddress?.recipientName || primaryBooking.order.user?.name || 'Customer'}`,
                                      startDate: primaryBooking.rentStartDate!,
                                      endDate: primaryBooking.rentEndDate!,
                                      notes: `Status: ${primaryBooking.rentalStatus || 'ACTIVE'}. ${dayBookings.length} active rental orders on this date.`,
                                    })
                                  }
                                  title={`Fully Booked (${dayBookings.length}/${capacity} units)`}
                                >
                                  <div className="h-7 w-full bg-rose-600 text-white flex flex-col items-center justify-center font-mono text-[9px] font-bold rounded-xs shadow-2xs">
                                    <span>{dayNum}</span>
                                    {capacity > 1 && <span className="text-[7px] leading-none opacity-90">{dayBookings.length}/{capacity}</span>}
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={idx}
                                className="p-0.5 text-center cursor-pointer"
                                onClick={() =>
                                  setDetailItem({
                                    type: 'MAINTENANCE',
                                    title: `Maintenance / Cleaning (${primaryBlock?.reason || 'BLOCKED'})`,
                                    subtitle: `SKU: ${variant.sku} (${totalOccupied}/${capacity} occupied)`,
                                    startDate: primaryBlock ? primaryBlock.startDate : dayStr,
                                    endDate: primaryBlock ? primaryBlock.endDate : dayStr,
                                    notes: primaryBlock?.notes || `${totalOccupied} of ${capacity} units unavailable.`,
                                    blockId: primaryBlock?.id,
                                  })
                                }
                                title={`Blocked / Maintenance (${totalOccupied}/${capacity} units)`}
                              >
                                <div className="h-7 w-full bg-amber-500 text-white flex flex-col items-center justify-center font-mono text-[9px] font-bold rounded-xs shadow-2xs">
                                  <span>{dayNum}</span>
                                  {capacity > 1 && <span className="text-[7px] leading-none opacity-90">{totalOccupied}/{capacity}</span>}
                                </div>
                              </td>
                            );
                          }

                          if (totalOccupied > 0) {
                            const primaryBooking = dayBookings[0];
                            const primaryBlock = dayBlocks[0];

                            return (
                              <td
                                key={idx}
                                className="p-0.5 text-center cursor-pointer"
                                onClick={() => {
                                  if (primaryBooking) {
                                    setDetailItem({
                                      type: 'BOOKING',
                                      title: `Order #${primaryBooking.order.id.slice(0, 8)} (${totalOccupied}/${capacity} rented)`,
                                      subtitle: `Customer: ${primaryBooking.order.shippingAddress?.recipientName || primaryBooking.order.user?.name || 'Customer'}`,
                                      startDate: primaryBooking.rentStartDate!,
                                      endDate: primaryBooking.rentEndDate!,
                                      notes: `Status: ${primaryBooking.rentalStatus || 'ACTIVE'}. ${capacity - totalOccupied} of ${capacity} units still available for rent.`,
                                    });
                                  } else if (primaryBlock) {
                                    setDetailItem({
                                      type: 'MAINTENANCE',
                                      title: `Maintenance (${primaryBlock.reason})`,
                                      subtitle: `SKU: ${variant.sku} (${totalOccupied}/${capacity} occupied)`,
                                      startDate: primaryBlock.startDate,
                                      endDate: primaryBlock.endDate,
                                      notes: primaryBlock.notes || `${capacity - totalOccupied} of ${capacity} units still available.`,
                                      blockId: primaryBlock.id,
                                    });
                                  }
                                }}
                                title={`Partially Rented (${totalOccupied}/${capacity} occupied - ${capacity - totalOccupied} available)`}
                              >
                                <div className="h-7 w-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex flex-col items-center justify-center font-mono text-[9px] font-bold rounded-xs">
                                  <span>{dayNum}</span>
                                  <span className="text-[7px] leading-none text-emerald-700 font-normal">{totalOccupied}/{capacity}</span>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td key={idx} className="p-0.5 text-center">
                              <div className="h-7 w-full bg-emerald-50/60 text-emerald-900 border border-emerald-100 flex items-center justify-center font-mono text-[10px]">
                                {dayNum}
                              </div>
                            </td>
                          );
                        })}

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(variant.id)}
                            className="text-[10px] uppercase tracking-wider text-black border-b border-black hover:opacity-60 transition-opacity whitespace-nowrap"
                          >
                            Block Dates
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Popover / Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 space-y-4 border border-neutral-300 shadow-xl">
            <div className="flex justify-between items-start border-b border-neutral-100 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-sans block">
                  {detailItem.type === 'BOOKING' ? 'Customer Order Booking' : 'Maintenance / Dry Cleaning'}
                </span>
                <h3 className="font-serif text-lg font-medium text-neutral-900">{detailItem.title}</h3>
                <p className="text-xs text-neutral-600 font-sans mt-0.5">{detailItem.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="p-1 text-neutral-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-neutral-50 p-3 border border-neutral-200 space-y-1">
                <div className="text-neutral-500 text-[10px] uppercase">Schedule Period</div>
                <div className="text-neutral-900 font-bold">
                  {detailItem.startDate} → {detailItem.endDate}
                </div>
              </div>

              {detailItem.notes && (
                <div className="bg-neutral-50 p-3 border border-neutral-200 space-y-1 font-sans">
                  <div className="text-neutral-500 text-[10px] uppercase font-mono">Notes</div>
                  <div className="text-neutral-800">{detailItem.notes}</div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              {detailItem.blockId && (
                <button
                  type="button"
                  disabled={deletingBlockId === detailItem.blockId}
                  onClick={() => handleDeleteBlock(detailItem.blockId!)}
                  className="bg-rose-600 text-white px-3 py-2 text-[10px] uppercase tracking-wider font-medium hover:bg-rose-700 transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingBlockId === detailItem.blockId ? 'Deleting...' : 'Remove Block'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="bg-neutral-200 text-neutral-800 px-4 py-2 text-[10px] uppercase tracking-wider font-medium hover:bg-neutral-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Maintenance Block Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateBlock} className="bg-white max-w-lg w-full p-6 space-y-5 border border-neutral-300 shadow-xl font-sans">
            <div className="flex justify-between items-start border-b border-neutral-100 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 block">
                  Atelier Inventory Control
                </span>
                <h3 className="font-serif text-xl font-light text-neutral-900">Schedule Maintenance Block</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalErrorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalErrorMessage}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                  Product Variant
                </label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2.5 text-xs font-sans focus:outline-none focus:border-black"
                >
                  {allVariants.map((v) => (
                    <option key={v.variantId} value={v.variantId}>
                      {v.productName} ({v.sku}) - {v.attr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    className="w-full bg-white border border-neutral-300 p-2 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDateInput}
                    min={startDateInput}
                    onChange={(e) => setEndDateInput(e.target.value)}
                    className="w-full bg-white border border-neutral-300 p-2 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                  Block Reason
                </label>
                <select
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2.5 text-xs font-sans focus:outline-none focus:border-black"
                >
                  <option value="MAINTENANCE">General Atelier Maintenance</option>
                  <option value="DRY_CLEANING">Dry Cleaning & Pressing</option>
                  <option value="DAMAGED">Under Repair / Tailoring</option>
                  <option value="BLACKOUT">VIP Photoshoot / Press Reserve</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g., Scheduled dry cleaning at French Cleaners Senopati"
                  className="w-full bg-white border border-neutral-300 p-2.5 text-xs font-sans focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 uppercase tracking-wider text-[10px] hover:bg-neutral-100"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSavingBlock}
                className="bg-black text-white px-5 py-2 uppercase tracking-wider text-[10px] font-medium hover:bg-neutral-800 disabled:opacity-50"
              >
                {isSavingBlock ? 'Saving...' : 'Create Block'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
