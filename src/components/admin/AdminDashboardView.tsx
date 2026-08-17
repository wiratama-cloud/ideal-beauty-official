'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DollarSign, TrendingUp, TrendingDown, Download, ArrowRight } from 'lucide-react';
import { exportLedgerCSVAction } from '@/app/actions/admin';
import AdminHeader from '@/components/admin/AdminHeader';

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
    <div className="min-h-screen bg-neutral-50 pb-16 text-xs">
      <AdminHeader
        title="Atelier Executive Dashboard"
        subtitle="EXECUTIVE FINANCIAL ANALYTICS"
        activeTab="dashboard"
        action={
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="bg-black text-white px-5 py-2.5 uppercase tracking-widest text-[10px] font-medium hover:bg-neutral-800 transition-colors flex items-center space-x-2 rounded-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export Ledger CSV'}</span>
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Income */}
          <div className="bg-white border border-neutral-200 p-5 space-y-2 rounded-xs shadow-2xs hover:border-neutral-300 transition-colors">
            <div className="flex justify-between items-center text-neutral-400">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
                Total Income (Gross)
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-serif font-medium text-neutral-900">{formatIDR(summary.totalIncome)}</p>
            <p className="text-[10px] text-emerald-700 font-mono">Sales & rental receipts</p>
          </div>

          {/* Total Expenses */}
          <div className="bg-white border border-neutral-200 p-5 space-y-2 rounded-xs shadow-2xs hover:border-neutral-300 transition-colors">
            <div className="flex justify-between items-center text-neutral-400">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
                Total Expenses
              </span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-xl font-serif font-medium text-neutral-900">{formatIDR(summary.totalExpense)}</p>
            <p className="text-[10px] text-rose-700 font-mono">Couture COGS, R&D & Operations</p>
          </div>

          {/* Net Profit */}
          <div className="bg-white border border-neutral-200 p-5 space-y-2 rounded-xs shadow-2xs hover:border-neutral-300 transition-colors">
            <div className="flex justify-between items-center text-neutral-400">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
                Net Profit
              </span>
              <DollarSign className="w-4 h-4 text-neutral-800" />
            </div>
            <p className={`text-xl font-serif font-medium ${summary.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
              {formatIDR(summary.netProfit)}
            </p>
            <p className="text-[10px] text-neutral-500 font-mono">Net operating balance</p>
          </div>

          {/* Profit Margin */}
          <div className="bg-white border border-neutral-200 p-5 space-y-2 rounded-xs shadow-2xs hover:border-neutral-300 transition-colors">
            <div className="flex justify-between items-center text-neutral-400">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
                Profit Margin
              </span>
              <span className="font-mono text-xs font-bold text-neutral-900">%</span>
            </div>
            <p className="text-xl font-serif font-medium text-neutral-900">{summary.profitMargin.toFixed(1)}%</p>
            <p className="text-[10px] text-neutral-500 font-mono">Efficiency margin</p>
          </div>
        </div>

        {/* Revenue & Expense Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Breakdown */}
          <div className="bg-white border border-neutral-200 p-6 sm:p-8 space-y-4 rounded-xs shadow-2xs">
            <h2 className="font-serif text-base text-neutral-900 uppercase tracking-widest border-b border-neutral-100 pb-3 flex justify-between items-center">
              <span>Income Stream Breakdown</span>
              <span className="font-mono text-xs font-bold text-emerald-800">{formatIDR(summary.totalIncome)}</span>
            </h2>

            <div className="space-y-2.5 font-mono">
              {Object.entries(summary.incomeByCategory).length === 0 ? (
                <p className="text-neutral-400 text-xs font-sans italic py-4 text-center">No income entries logged yet.</p>
              ) : (
                Object.entries(summary.incomeByCategory).map(([cat, amount]) => (
                  <div key={cat} className="flex justify-between items-center bg-neutral-50/80 border border-neutral-100 p-3 rounded-xs">
                    <span className="font-sans uppercase text-[10px] tracking-wider text-neutral-700">{cat}</span>
                    <span className="text-neutral-900 font-bold">{formatIDR(amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white border border-neutral-200 p-6 sm:p-8 space-y-4 rounded-xs shadow-2xs">
            <h2 className="font-serif text-base text-neutral-900 uppercase tracking-widest border-b border-neutral-100 pb-3 flex justify-between items-center">
              <span>Expense Category Breakdown</span>
              <span className="font-mono text-xs font-bold text-rose-800">{formatIDR(summary.totalExpense)}</span>
            </h2>

            <div className="space-y-2.5 font-mono">
              {Object.entries(summary.expenseByCategory).length === 0 ? (
                <p className="text-neutral-400 text-xs font-sans italic py-4 text-center">No expense entries logged yet.</p>
              ) : (
                Object.entries(summary.expenseByCategory).map(([cat, amount]) => (
                  <div key={cat} className="flex justify-between items-center bg-neutral-50/80 border border-neutral-100 p-3 rounded-xs">
                    <span className="font-sans uppercase text-[10px] tracking-wider text-neutral-700">{cat}</span>
                    <span className="text-neutral-900 font-bold">{formatIDR(amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Admin Quick Action Banner */}
        <div className="bg-neutral-900 text-white p-6 sm:p-8 rounded-xs shadow-2xs border border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-normal text-white">Audit Ledger & Log Custom Expenses</h3>
            <p className="text-neutral-400 text-xs">
              Log raw manufacturing COGS, designer R&D fees, or marketing expenses into the accounting ledger.
            </p>
          </div>

          <Link
            href="/admin/ledger"
            className="bg-white text-neutral-900 px-5 py-3 uppercase tracking-widest font-medium text-[10px] hover:bg-neutral-200 transition-colors flex items-center space-x-2 shrink-0 rounded-xs"
          >
            <span>Open Ledger Form</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
