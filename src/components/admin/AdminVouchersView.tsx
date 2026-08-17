'use client';

import React, { useState, useTransition } from 'react';
import AdminHeader from './AdminHeader';
import {
  Plus,
  Ticket,
  UserCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Tag,
  DollarSign,
  Users,
} from 'lucide-react';
import {
  createVoucherAction,
  toggleVoucherStatusAction,
  deleteVoucherAction,
} from '@/app/actions/admin';

interface Customer {
  id: string;
  name: string | null;
  email: string;
}

interface Voucher {
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
  user?: { id: string; name: string | null; email: string } | null;
  _count?: { usages: number; orders: number };
  createdAt: string | Date;
}

interface AdminVouchersViewProps {
  initialVouchers: Voucher[];
  customers: Customer[];
}

export default function AdminVouchersView({ initialVouchers, customers }: AdminVouchersViewProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTarget, setFilterTarget] = useState<'ALL' | 'EVENT' | 'CUSTOMER'>('ALL');
  const [isPending, startTransition] = useTransition();

  // Form State
  const [targetType, setTargetType] = useState<'EVENT' | 'CUSTOMER'>('EVENT');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number | ''>('');
  const [minPurchase, setMinPurchase] = useState<number | ''>('');
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('');
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.user && v.user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTarget = filterTarget === 'ALL' || v.targetType === filterTarget;
    return matchesSearch && matchesTarget;
  });

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code.trim()) {
      setErrorMsg('Voucher code is required.');
      return;
    }

    if (!discountValue || Number(discountValue) <= 0) {
      setErrorMsg('Valid discount value is required.');
      return;
    }

    if (targetType === 'CUSTOMER' && !selectedUserId) {
      setErrorMsg('Please select a customer for customer-bound voucher.');
      return;
    }

    startTransition(async () => {
      try {
        const newVoucher = await createVoucherAction({
          code,
          description: description || undefined,
          discountType,
          discountValue: Number(discountValue),
          minPurchase: minPurchase !== '' ? Number(minPurchase) : null,
          maxDiscount: maxDiscount !== '' ? Number(maxDiscount) : null,
          usageLimit: usageLimit !== '' ? Number(usageLimit) : null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          targetType,
          userId: targetType === 'CUSTOMER' ? selectedUserId : null,
        });

        setVouchers((prev) => [newVoucher, ...prev]);
        setIsModalOpen(false);
        resetForm();
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to create voucher.');
      }
    });
  };

  const resetForm = () => {
    setCode('');
    setDescription('');
    setDiscountType('PERCENTAGE');
    setDiscountValue('');
    setMinPurchase('');
    setMaxDiscount('');
    setUsageLimit('');
    setStartDate('');
    setEndDate('');
    setSelectedUserId('');
    setTargetType('EVENT');
    setErrorMsg(null);
  };

  const handleToggleStatus = (id: string) => {
    startTransition(async () => {
      try {
        const updated = await toggleVoucherStatusAction(id);
        setVouchers((prev) => prev.map((v) => (v.id === id ? { ...v, isActive: updated.isActive } : v)));
      } catch (err: any) {
        alert(err.message || 'Failed to toggle status.');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return;

    startTransition(async () => {
      try {
        await deleteVoucherAction(id);
        setVouchers((prev) => prev.filter((v) => v.id !== id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete voucher.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 font-light text-xs">
      <AdminHeader
        title="Vouchers & Promo Management"
        subtitle="MARKETING & CUSTOMER INCENTIVES"
        activeTab="vouchers"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-black hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xs text-[10px] uppercase tracking-widest font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Voucher</span>
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* KPI Header Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 border border-neutral-200 rounded-xs shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                Total Vouchers
              </span>
              <span className="text-2xl font-serif text-neutral-900">{vouchers.length}</span>
            </div>
            <div className="p-3 bg-neutral-100 rounded-full text-neutral-700">
              <Ticket className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 border border-neutral-200 rounded-xs shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                Active Campaigns
              </span>
              <span className="text-2xl font-serif text-emerald-700">
                {vouchers.filter((v) => v.isActive).length}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 border border-neutral-200 rounded-xs shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                Total Redemptions
              </span>
              <span className="text-2xl font-serif text-amber-700">
                {vouchers.reduce((acc, curr) => acc + (curr.usageCount || 0), 0)}
              </span>
            </div>
            <div className="p-3 bg-amber-50 rounded-full text-amber-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white p-4 border border-neutral-200 rounded-xs shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-xs text-xs focus:outline-hidden focus:border-black font-mono"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
            <span className="text-[10px] font-mono text-neutral-400 font-semibold uppercase tracking-wider whitespace-nowrap mr-1">
              Target:
            </span>
            {(['ALL', 'EVENT', 'CUSTOMER'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterTarget(t)}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider font-medium rounded-xs transition-colors whitespace-nowrap ${
                  filterTarget === t
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {t === 'ALL' ? 'All Types' : t === 'EVENT' ? 'Event Codes' : 'VIP Customer Bound'}
              </button>
            ))}
          </div>
        </div>

        {/* Vouchers Table */}
        <div className="bg-white border border-neutral-200 rounded-xs overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                  <th className="py-3 px-4">Voucher Code</th>
                  <th className="py-3 px-4">Target / Recipient</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min Spend</th>
                  <th className="py-3 px-4">Usage / Limit</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400 font-light">
                      No vouchers match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-neutral-900">
                        <div className="flex items-center space-x-1.5">
                          <Tag className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{v.code}</span>
                        </div>
                        {v.description && (
                          <span className="block text-[10px] text-neutral-400 font-sans font-normal mt-0.5">
                            {v.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {v.targetType === 'EVENT' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-xs bg-amber-50 text-amber-700 text-[10px] uppercase tracking-wider font-medium">
                            <Tag className="w-2.5 h-2.5" />
                            <span>Public Event Code</span>
                          </span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-xs bg-purple-50 text-purple-700 text-[10px] uppercase tracking-wider font-medium w-fit mb-0.5">
                              <UserCheck className="w-2.5 h-2.5" />
                              <span>Customer VIP</span>
                            </span>
                            <span className="text-neutral-700 font-medium">{v.user?.name || v.user?.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-neutral-900">
                        {v.discountType === 'PERCENTAGE' ? (
                          <span>
                            {v.discountValue}% OFF
                            {v.maxDiscount && (
                              <span className="text-[10px] text-neutral-400 block font-normal">
                                Cap: IDR {Number(v.maxDiscount).toLocaleString('id-ID')}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span>IDR {Number(v.discountValue).toLocaleString('id-ID')} OFF</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600">
                        {v.minPurchase ? `IDR ${Number(v.minPurchase).toLocaleString('id-ID')}` : 'No minimum'}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        {v.usageLimit ? (
                          <span className={v.usageCount >= v.usageLimit ? 'text-red-600' : 'text-neutral-800'}>
                            {v.usageCount} / {v.usageLimit}
                          </span>
                        ) : (
                          <span className="text-neutral-700">{v.usageCount} (Unlimited)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[10px] text-neutral-500">
                        {v.endDate ? (
                          <div>
                            <span>Exp: {new Date(v.endDate).toLocaleDateString('id-ID')}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-medium">No Expiry</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(v.id)}
                          disabled={isPending}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xs text-[10px] uppercase tracking-wider font-medium transition-colors ${
                            v.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                          }`}
                        >
                          {v.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          <span>{v.isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(v.id)}
                          disabled={isPending}
                          className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                          title="Delete Voucher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Generator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-xs shadow-xl border border-neutral-200 overflow-hidden my-8">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold block">
                  Promotions Engine
                </span>
                <h3 className="font-serif text-xl font-light text-neutral-900">Generate Voucher</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-black transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Target Type Selector */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1.5">
                  Voucher Target Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('EVENT')}
                    className={`py-2 px-3 text-xs uppercase tracking-wider font-medium rounded-xs border transition-colors ${
                      targetType === 'EVENT'
                        ? 'bg-black text-white border-black'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    Event / Public Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('CUSTOMER')}
                    className={`py-2 px-3 text-xs uppercase tracking-wider font-medium rounded-xs border transition-colors ${
                      targetType === 'CUSTOMER'
                        ? 'bg-black text-white border-black'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    Customer VIP Bound
                  </button>
                </div>
              </div>

              {/* Customer Picker if CUSTOMER bound */}
              {targetType === 'CUSTOMER' && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                    Select Customer Account *
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full border border-neutral-200 rounded-xs p-2 text-xs focus:outline-hidden focus:border-black"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name ? `${c.name} (${c.email})` : c.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Voucher Code & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                    Voucher Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SUMMER2025"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                    className="w-full border border-neutral-200 rounded-xs p-2 text-xs uppercase font-mono font-semibold focus:outline-hidden focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Summer Atelier Promo"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-neutral-200 rounded-xs p-2 text-xs focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              {/* Discount Rules */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full border border-neutral-200 rounded-xs p-2 text-xs focus:outline-hidden focus:border-black"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (IDR)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    placeholder={discountType === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 50000'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value !== '' ? Number(e.target.value) : '')}
                    required
                    min={1}
                    className="w-full border border-neutral-200 rounded-xs p-2 text-xs focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              {/* Restrictions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                    Min Purchase (IDR)
                  </label>
                  <input
                    type="number"
                    placeholder="Optional, e.g. 100000"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full border border-neutral-200 rounded-xs p-2 text-xs focus:outline-hidden focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                    Max Discount Cap (IDR)
                  </label>
                  <input
                    type="number"
                    placeholder="Optional (for %)"
                    value={maxDiscount}
                    disabled={discountType === 'FIXED_AMOUNT'}
                    onChange={(e) => setMaxDiscount(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full border border-neutral-200 rounded-xs p-2 text-xs focus:outline-hidden focus:border-black disabled:bg-neutral-100"
                  />
                </div>
              </div>

              {/* Usage Limit & Dates */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full border border-neutral-200 rounded-xs p-2 text-xs focus:outline-hidden focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-neutral-200 rounded-xs p-2 text-xs focus:outline-hidden focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-neutral-200 rounded-xs p-2 text-xs focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 flex justify-end space-x-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 text-xs font-medium uppercase tracking-wider rounded-xs text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-black text-white text-xs font-medium uppercase tracking-wider rounded-xs hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isPending ? 'Generating...' : 'Create Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
