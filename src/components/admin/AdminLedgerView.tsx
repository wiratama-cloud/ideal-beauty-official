'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Download, FileSpreadsheet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { logExpenseAction, exportLedgerCSVAction } from '@/app/actions/admin';
import AdminHeader from '@/components/admin/AdminHeader';

interface AdminLedgerViewProps {
  entries: any[];
}

export default function AdminLedgerView({ entries: initialEntries }: AdminLedgerViewProps) {
  const [entries, setEntries] = useState(initialEntries);

  const [form, setForm] = useState({
    amount: '',
    description: '',
    expenseCategory: 'DESIGN_RND' as 'DESIGN_RND' | 'MANUFACTURING_COGS' | 'OPERATIONAL' | 'MARKETING',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;

    setIsSubmitting(true);
    try {
      const newEntry = await logExpenseAction({
        amount: parseFloat(form.amount),
        description: form.description,
        expenseCategory: form.expenseCategory,
      });

      setEntries([newEntry, ...entries]);
      setForm({
        amount: '',
        description: '',
        expenseCategory: 'DESIGN_RND',
      });
    } catch (err) {
      console.error('Failed to log expense:', err);
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="space-y-8 pb-12 font-light text-xs">
      <AdminHeader
        title={`Financial Ledger Audit Trail (${entries.length})`}
        subtitle="DOUBLE-ENTRY ACCOUNTING AUDIT LOG"
        activeTab="ledger"
        action={
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="bg-black text-white px-5 py-2.5 uppercase tracking-widest text-[10px] hover:bg-neutral-800 transition-colors flex items-center space-x-2 rounded-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export Ledger CSV'}</span>
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

      {/* Expense Entry Form */}
      <div className="bg-white p-6 sm:p-8 border border-neutral-100 space-y-4 shadow-sm">
        <div className="flex items-center space-x-2 text-neutral-900 uppercase tracking-widest font-medium border-b border-neutral-100 pb-3">
          <PlusCircle className="w-4 h-4 text-neutral-800" />
          <span>Record Production COGS / R&D Expense Entry</span>
        </div>

        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-3">
            <label className="block text-neutral-600 mb-1 text-[11px]">Expense Category</label>
            <select
              value={form.expenseCategory}
              onChange={(e) => setForm({ ...form, expenseCategory: e.target.value as any })}
              className="w-full border border-neutral-300 p-2.5 bg-white text-neutral-900 font-mono text-xs focus:outline-none"
            >
              <option value="DESIGN_RND">DESIGN & R&D</option>
              <option value="MANUFACTURING_COGS">MANUFACTURING COGS</option>
              <option value="OPERATIONAL">OPERATIONAL OVERHEAD</option>
              <option value="MARKETING">MARKETING & RUNWAY SHOWS</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-neutral-600 mb-1 text-[11px]">Amount (IDR)</label>
            <input
              type="number"
              required
              placeholder="e.g. 2500000"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full border border-neutral-300 p-2.5 bg-white text-neutral-900 font-mono text-xs focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-neutral-600 mb-1 text-[11px]">Description & Purpose</label>
            <input
              type="text"
              required
              placeholder="e.g. Silk fabric procurement for bridal lehengas"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-neutral-300 p-2.5 bg-white text-neutral-900 text-xs focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white p-2.5 uppercase tracking-widest text-[10px] hover:bg-neutral-800 transition-colors font-light"
            >
              {isSubmitting ? 'Logging...' : 'Log Expense'}
            </button>
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-neutral-100 overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-widest text-neutral-500 font-medium">
              <th className="p-4">Entry Date</th>
              <th className="p-4">Type</th>
              <th className="p-4">Category</th>
              <th className="p-4">Description</th>
              <th className="p-4 text-right">Amount (IDR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-400 font-sans italic">
                  No ledger audit entries recorded.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const isIncome = entry.type === 'INCOME';
                const categoryLabel = isIncome
                  ? entry.incomeCategory || 'SALES_REVENUE'
                  : entry.expenseCategory || 'OPERATIONAL';

                return (
                  <tr key={entry.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="p-4 text-neutral-500">
                      {new Date(entry.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-4">
                      {isIncome ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] uppercase tracking-widest flex items-center w-max space-x-1">
                          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                          <span>INCOME</span>
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 text-[9px] uppercase tracking-widest flex items-center w-max space-x-1">
                          <ArrowDownRight className="w-3 h-3 text-rose-600" />
                          <span>EXPENSE</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-sans text-neutral-700 font-medium uppercase text-[10px]">
                      {categoryLabel}
                    </td>
                    <td className="p-4 font-sans text-neutral-800">{entry.description}</td>
                    <td className={`p-4 text-right font-bold ${isIncome ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {isIncome ? '+' : '-'}{formatIDR(Number(entry.amount))}
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
  );
}
