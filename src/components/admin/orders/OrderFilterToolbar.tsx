'use client';

import React from 'react';
import { Search, Filter } from 'lucide-react';
import { OrderFilterTab } from './types';

interface OrderFilterToolbarProps {
  activeTab: OrderFilterTab;
  onTabChange: (tab: OrderFilterTab) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  resultsCount: number;
}

export default function OrderFilterToolbar({
  activeTab,
  onTabChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  resultsCount,
}: OrderFilterToolbarProps) {
  const tabs: { id: OrderFilterTab; label: string }[] = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'SALES', label: 'Sales / Purchases' },
    { id: 'PREORDERS', label: 'Pre-Orders' },
    { id: 'RENTALS', label: 'Rentals Tracker' },
    { id: 'OVERDUE', label: 'Overdue / Attention Needed' },
    { id: 'UNPAID', label: 'Unpaid / DP Pending' },
  ];

  return (
    <div className="space-y-3">
      {/* Navigation Tabs & Status Filter Row */}
      <div className="bg-white border border-neutral-200 rounded-xs p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-2 text-[10px] uppercase tracking-wider font-semibold rounded-xs transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Status Dropdown Filter */}
          <div className="flex items-center space-x-1 border border-neutral-200 rounded-xs px-2.5 py-1.5 bg-neutral-50">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="bg-transparent text-[10px] font-mono uppercase text-neutral-800 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              <option value="PAID">PAID</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <span className="text-[10px] text-neutral-400 font-mono">
            {resultsCount} {resultsCount === 1 ? 'order' : 'orders'}
          </span>
        </div>
      </div>

      {/* Live Search Toolbar */}
      <div className="bg-white p-3 border border-neutral-200 rounded-xs flex items-center">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name, Email, Courier, or Tracking Number..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-xs text-xs focus:outline-hidden focus:border-black"
          />
        </div>
      </div>
    </div>
  );
}
