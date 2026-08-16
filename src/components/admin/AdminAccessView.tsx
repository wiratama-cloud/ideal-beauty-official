'use client';

import React, { useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Search,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Loader2,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { addAdminAccessAction, removeAdminAccessAction } from '@/app/actions/admin';

export interface AdminAccessItem {
  id: string;
  email: string;
  role: string;
  addedBy: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  isPrimary?: boolean;
}

interface AdminAccessViewProps {
  initialAdmins: AdminAccessItem[];
}

export default function AdminAccessView({ initialAdmins }: AdminAccessViewProps) {
  const [admins, setAdmins] = useState<AdminAccessItem[]>(initialAdmins);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminAccessItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const filteredAdmins = admins.filter((admin) =>
    admin.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    (admin.addedBy && admin.addedBy.toLowerCase().includes(searchQuery.toLowerCase().trim()))
  );

  const primaryAdmin = admins.find((a) => a.isPrimary);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.trim()) {
      setAddError('Email address is required.');
      return;
    }

    setAddLoading(true);
    setAddError(null);

    try {
      const result = await addAdminAccessAction(newEmail.trim());
      setAdmins((prev) => {
        const exists = prev.some((a) => a.id === result.id || a.email.toLowerCase() === result.email.toLowerCase());
        if (exists) {
          return prev.map((a) => (a.email.toLowerCase() === result.email.toLowerCase() ? result : a));
        }
        return [result, ...prev];
      });
      setNewEmail('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add admin access.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await removeAdminAccessAction(deleteTarget.id);
      setAdmins((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to revoke admin access.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <AdminHeader
        title="Access Control"
        subtitle="Manage administrator access permissions, whitelist email addresses, and team roles"
        activeTab="access"
        action={
          <button
            onClick={() => {
              setAddError(null);
              setNewEmail('');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-neutral-900 text-white hover:bg-black font-medium text-xs rounded-sm transition-all shadow-xs flex items-center space-x-2"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Grant Admin Access</span>
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Analytics & Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 border border-neutral-200 rounded-sm shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-2xs font-mono uppercase text-neutral-400 tracking-wider font-medium">
                Total Administrators
              </p>
              <h3 className="text-2xl font-serif font-medium text-neutral-900 mt-1">
                {admins.length} <span className="text-xs font-sans text-neutral-500 font-normal">Active</span>
              </h3>
            </div>
            <div className="p-3 bg-neutral-100 text-neutral-800 rounded-full">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 border border-neutral-200 rounded-sm shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-2xs font-mono uppercase text-neutral-400 tracking-wider font-medium">
                Primary Root Admin
              </p>
              <h3 className="text-sm font-medium text-neutral-900 mt-1 truncate max-w-[200px]" title={primaryAdmin?.email}>
                {primaryAdmin?.email || 'System Root'}
              </h3>
              <p className="text-[10px] text-amber-600 font-mono mt-0.5 flex items-center space-x-1">
                <Lock className="w-3 h-3 inline" />
                <span>Deletion Protected</span>
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 border border-neutral-200 rounded-sm shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-2xs font-mono uppercase text-neutral-400 tracking-wider font-medium">
                Access Verification
              </p>
              <h3 className="text-sm font-medium text-emerald-700 mt-1 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Strict Whitelist Active</span>
              </h3>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                Enforced on /admin actions & routes
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Access List Table Container */}
        <div className="bg-white border border-neutral-200 rounded-sm shadow-2xs overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search administrators by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-neutral-300 rounded-sm focus:outline-none focus:border-neutral-900 transition-colors"
              />
            </div>
            <div className="text-2xs text-neutral-500 font-mono">
              Showing {filteredAdmins.length} of {admins.length} entries
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 text-neutral-600 uppercase font-mono text-[10px] tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Administrator Email</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Added By</th>
                  <th className="py-3 px-4 font-semibold">Date Granted</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700">
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400 font-light">
                      No administrator accounts found matching "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => {
                    const isPrimary = admin.isPrimary;
                    const dateFormatted = new Date(admin.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <tr key={admin.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-neutral-900">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="font-mono text-xs">{admin.email}</span>
                            <button
                              onClick={() => handleCopyEmail(admin.email)}
                              className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded transition-colors"
                              title="Copy Email"
                            >
                              {copiedEmail === admin.email ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {isPrimary && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                                Primary Admin
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-mono font-medium bg-neutral-100 text-neutral-800 uppercase">
                            {admin.role || 'ADMIN'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center space-x-1 text-emerald-700 text-2xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Authorized</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-2xs text-neutral-500">
                          {admin.addedBy || 'SYSTEM'}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-500 font-mono text-2xs">
                          {dateFormatted}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isPrimary ? (
                            <span
                              className="inline-flex items-center space-x-1 text-2xs text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-sm border border-neutral-200 font-mono cursor-not-allowed"
                              title="Protected primary admin email cannot be revoked"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Protected</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget(admin);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-sm text-2xs font-medium transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Revoke Access</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Grant Admin Access Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-sm shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-black p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 text-neutral-900 mb-4">
              <div className="p-2 bg-neutral-900 text-white rounded-sm">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-medium text-base">Grant Admin Access</h3>
                <p className="text-2xs text-neutral-500">Whitelist an email address for admin portal access</p>
              </div>
            </div>

            {addError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-2xs font-mono uppercase tracking-wider text-neutral-600 mb-1">
                  Team Member Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. manager@idealbeautyofficial.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-sm focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  User will be granted full administrative privileges upon logging in with this email.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs rounded-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-1.5 bg-neutral-900 text-white hover:bg-black text-xs font-medium rounded-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {addLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Granting...</span>
                    </>
                  ) : (
                    <span>Confirm & Grant</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Access Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-sm shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setDeleteTarget(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-black p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 text-red-700 mb-4">
              <div className="p-2 bg-red-100 rounded-sm">
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-serif font-medium text-base text-neutral-900">Revoke Admin Access</h3>
                <p className="text-2xs text-neutral-500">Remove portal access permissions</p>
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-xs text-neutral-700 leading-relaxed mb-6">
              Are you sure you want to revoke admin access for{' '}
              <strong className="font-mono text-neutral-900">{deleteTarget.email}</strong>?
              This team member will immediately lose access to all admin portal features.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs rounded-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveAdmin}
                disabled={deleteLoading}
                className="px-4 py-1.5 bg-red-600 text-white hover:bg-red-700 text-xs font-medium rounded-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Revoking...</span>
                  </>
                ) : (
                  <span>Revoke Access</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
