'use client';

import React, { useState } from 'react';
import { Search, Eye, Filter, ShieldCheck, Code, RefreshCw, X } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import { getAuditLogsAction } from '@/app/actions/admin';

interface AdminAuditLogsViewProps {
  initialLogs: any[];
  initialTotal: number;
}

export default function AdminAuditLogsView({
  initialLogs,
  initialTotal,
}: AdminAuditLogsViewProps) {
  const [logs, setLogs] = useState<any[]>(initialLogs);
  const [total, setTotal] = useState<number>(initialTotal);
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [loading, setLoading] = useState(false);

  // Selected log details modal
  const [activeJsonModal, setActiveJsonModal] = useState<any | null>(null);

  const fetchLogs = async (searchTerm = search, entityFilter = selectedEntity) => {
    setLoading(true);
    try {
      const res = await getAuditLogsAction({
        search: searchTerm,
        entity: entityFilter,
        limit: 100,
      });
      setLogs(res.logs);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(search, selectedEntity);
  };

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEntity = e.target.value;
    setSelectedEntity(newEntity);
    fetchLogs(search, newEntity);
  };

  const formatDate = (dateString: string | Date) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const entityOptions = [
    { value: 'ALL', label: 'All Entities' },
    { value: 'ORDER', label: 'Order' },
    { value: 'ORDER_ITEM', label: 'Order Item' },
    { value: 'PRODUCT', label: 'Product' },
    { value: 'PRODUCT_VARIANT', label: 'Product Variant' },
    { value: 'INVENTORY', label: 'Inventory' },
    { value: 'LANDING_SECTION', label: 'Landing Section' },
    { value: 'LANDING_SECTION_ITEM', label: 'Landing Section Item' },
    { value: 'LEDGER', label: 'Ledger' },
    { value: 'VOUCHER', label: 'Voucher' },
    { value: 'NAV_CATEGORY', label: 'Nav Category' },
  ];

  return (
    <div className="space-y-8 pb-12 font-light text-xs">
      <AdminHeader
        title={`Audit Logs & System Activity (${total})`}
        subtitle="SECURITY & OPERATIONAL MUTATION AUDIT TRAIL"
        activeTab="audit-logs"
        action={
          <button
            onClick={() => fetchLogs(search, selectedEntity)}
            disabled={loading}
            className="bg-neutral-100 text-neutral-800 border border-neutral-300 px-4 py-2 uppercase tracking-widest text-[10px] hover:bg-neutral-200 transition-colors flex items-center space-x-2 rounded-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Search & Filter Bar */}
        <div className="bg-white p-4 sm:p-6 border border-neutral-200 space-y-4 shadow-2xs">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search action, entity ID, user name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-neutral-300 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-black font-mono text-xs"
              />
            </div>

            <div className="flex items-center space-x-2 sm:w-64">
              <Filter className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <select
                value={selectedEntity}
                onChange={handleEntityChange}
                className="w-full py-2 px-3 border border-neutral-300 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-black text-xs"
              >
                {entityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-6 py-2 text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white border border-neutral-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400 font-sans">
                      <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                      No audit log entries recorded.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50/80 transition-colors text-neutral-800">
                      <td className="py-3 px-4 text-neutral-500 text-[11px] whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider bg-neutral-100 text-neutral-900 border border-neutral-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-600 font-sans font-medium text-[11px]">
                        {log.entity}
                      </td>
                      <td className="py-3 px-4 text-neutral-500 text-[11px] max-w-[160px] truncate" title={log.entityId}>
                        {log.entityId}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="text-neutral-900 font-medium text-[11px]">{log.userName}</div>
                        <div className="text-neutral-400 text-[10px]">{log.userEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => setActiveJsonModal(log)}
                          className="inline-flex items-center space-x-1 text-neutral-700 hover:text-black hover:underline text-[11px]"
                        >
                          <Code className="w-3.5 h-3.5" />
                          <span>View JSON</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* JSON Modal */}
      {activeJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 w-full max-w-2xl shadow-2xl overflow-hidden rounded-xs flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-neutral-800" />
                <h3 className="font-mono text-xs uppercase tracking-wider font-semibold text-neutral-900">
                  Audit Details: {activeJsonModal.action}
                </h3>
              </div>
              <button
                onClick={() => setActiveJsonModal(null)}
                className="text-neutral-400 hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-neutral-50 p-3 border border-neutral-200 font-sans">
                <div><span className="text-neutral-400">Log ID:</span> {activeJsonModal.id}</div>
                <div><span className="text-neutral-400">Timestamp:</span> {formatDate(activeJsonModal.createdAt)}</div>
                <div><span className="text-neutral-400">Entity:</span> {activeJsonModal.entity} ({activeJsonModal.entityId})</div>
                <div><span className="text-neutral-400">User:</span> {activeJsonModal.userName} ({activeJsonModal.userEmail})</div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-sans font-semibold block mb-1">
                  Mutation Payload / Details JSON
                </span>
                <pre className="bg-neutral-900 text-neutral-100 p-4 overflow-x-auto text-[11px] leading-relaxed rounded-xs">
                  {JSON.stringify(activeJsonModal.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-neutral-200 bg-neutral-50 flex justify-end">
              <button
                onClick={() => setActiveJsonModal(null)}
                className="bg-black text-white px-5 py-1.5 uppercase text-[10px] tracking-widest hover:bg-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
