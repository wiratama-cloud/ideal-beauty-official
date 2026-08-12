'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DollarSign, TrendingUp, TrendingDown, Download, FileText, ShoppingBag, ArrowRight } from 'lucide-react';
import { exportLedgerCSVAction } from '@/app/actions/admin';

interface AdminDashboardViewProps {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    profitMargin: number;
    incomeByCategory: Record<string, number>;
    expenseByCategory: Record<string, number>;
    totalEntriesCount: number;
  };
}

export default function AdminDashboardView({ summary }: AdminDashboardViewProps) {
  const [isExporting, setIsExporting] = useState(false);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csvContent = await exportLedgerCSVAction();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ideal_beauty_ledger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-light text-xs space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-sans block mb-1">
            EXECUTIVE FINANCIAL ANALYTICS
          </span>
          <h1 className="font-serif text-3xl font-light text-neutral-900">Atelier Admin Dashboard</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/orders"
            className="bg-white border border-neutral-300 text-neutral-800 px-4 py-2.5 uppercase tracking-widest text-[10px] hover:border-black transition-colors flex items-center space-x-2"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Manage Orders & Rentals</span>
          </Link>

          <Link
            href="/admin/ledger"
            className="bg-white border border-neutral-300 text-neutral-800 px-4 py-2.5 uppercase tracking-widest text-[10px] hover:border-black transition-colors flex items-center space-x-2"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ledger Audit Trail</span>
          </Link>

          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="bg-black text-white px-5 py-2.5 uppercase tracking-widest text-[10px] hover:bg-neutral-800 transition-colors flex items-center space-x-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export Ledger CSV'}</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income */}
        <div className="bg-white border border-neutral-100 p-6 space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="uppercase tracking-widest text-[10px] font-medium text-neutral-500">Total Income (Gross)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-mono text-xl font-bold text-neutral-900">{formatIDR(summary.totalIncome)}</p>
          <p className="text-[10px] text-emerald-700">Sales & rental receipts</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border border-neutral-100 p-6 space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="uppercase tracking-widest text-[10px] font-medium text-neutral-500">Total Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <p className="font-mono text-xl font-bold text-neutral-900">{formatIDR(summary.totalExpense)}</p>
          <p className="text-[10px] text-rose-700">Couture COGS, R&D & Operations</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white border border-neutral-100 p-6 space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="uppercase tracking-widest text-[10px] font-medium text-neutral-500">Net Profit</span>
            <DollarSign className="w-4 h-4 text-neutral-800" />
          </div>
          <p className={`font-mono text-xl font-bold ${summary.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
            {formatIDR(summary.netProfit)}
          </p>
          <p className="text-[10px] text-neutral-500">Net operating balance</p>
        </div>

        {/* Profit Margin */}
        <div className="bg-white border border-neutral-100 p-6 space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="uppercase tracking-widest text-[10px] font-medium text-neutral-500">Profit Margin</span>
            <span className="font-mono text-xs font-bold text-neutral-900">%</span>
          </div>
          <p className="font-mono text-xl font-bold text-neutral-900">{summary.profitMargin.toFixed(1)}%</p>
          <p className="text-[10px] text-neutral-500">Efficiency margin</p>
        </div>
      </div>

      {/* Revenue & Expense Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Income Breakdown */}
        <div className="bg-white border border-neutral-100 p-6 sm:p-8 space-y-4">
          <h2 className="font-serif text-base text-neutral-900 uppercase tracking-widest border-b border-neutral-100 pb-3 flex justify-between items-center">
            <span>Income Stream Breakdown</span>
            <span className="font-mono text-xs font-bold text-emerald-800">{formatIDR(summary.totalIncome)}</span>
          </h2>

          <div className="space-y-3 font-mono">
            {Object.entries(summary.incomeByCategory).length === 0 ? (
              <p className="text-neutral-400 text-xs font-sans italic">No income entries logged yet.</p>
            ) : (
              Object.entries(summary.incomeByCategory).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between items-center bg-neutral-50 p-3">
                  <span className="font-sans uppercase text-[10px] tracking-wider text-neutral-700">{cat}</span>
                  <span className="text-neutral-900 font-bold">{formatIDR(amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white border border-neutral-100 p-6 sm:p-8 space-y-4">
          <h2 className="font-serif text-base text-neutral-900 uppercase tracking-widest border-b border-neutral-100 pb-3 flex justify-between items-center">
            <span>Expense Category Breakdown</span>
            <span className="font-mono text-xs font-bold text-rose-800">{formatIDR(summary.totalExpense)}</span>
          </h2>

          <div className="space-y-3 font-mono">
            {Object.entries(summary.expenseByCategory).length === 0 ? (
              <p className="text-neutral-400 text-xs font-sans italic">No expense entries logged yet.</p>
            ) : (
              Object.entries(summary.expenseByCategory).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between items-center bg-neutral-50 p-3">
                  <span className="font-sans uppercase text-[10px] tracking-wider text-neutral-700">{cat}</span>
                  <span className="text-neutral-900 font-bold">{formatIDR(amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Admin Quick Action Banner */}
      <div className="bg-neutral-900 text-white p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-normal">Audit Ledger & Log Custom Expenses</h3>
          <p className="text-neutral-400 text-xs">
            Log raw manufacturing COGS, designer R&D fees, or marketing expenses into the accounting ledger.
          </p>
        </div>

        <Link
          href="/admin/ledger"
          className="bg-white text-black px-6 py-3.5 uppercase tracking-[0.2em] font-light text-[10px] hover:bg-neutral-200 transition-colors flex items-center space-x-2 flex-shrink-0"
        >
          <span>Open Ledger Form</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
