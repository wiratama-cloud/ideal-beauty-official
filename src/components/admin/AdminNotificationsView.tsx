'use client';

import React, { useState, useMemo } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Bell,
  Send,
  Users,
  UserCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Smartphone,
  ExternalLink,
  Loader2,
  RefreshCw,
  Info,
  ShieldCheck,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  sendAdminPushNotificationAction,
  getAdminNotificationRecipientsAction,
} from '@/app/actions/admin';
import Link from 'next/link';

export interface NotificationRecipient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  hasFcmToken: boolean;
  createdAt: Date | string;
}

interface AdminNotificationsViewProps {
  initialRecipients: NotificationRecipient[];
}

const TEMPLATES = [
  {
    label: '✨ New Arrivals',
    title: '✨ Exclusive Collection Launch',
    body: 'Discover our newest collection of luxury bridal and evening gowns. Tap to explore the atelier collection!',
    url: '/products',
  },
  {
    label: '📦 Order Updates',
    title: '📦 Order Status Update',
    body: 'Your recent couture order has been updated. Tap to track your shipping and delivery status.',
    url: '/account/orders',
  },
  {
    label: '🎟️ VIP Promo Voucher',
    title: '🎟️ Exclusive VIP Promotion',
    body: 'Enjoy exclusive rental discounts on your next booking with Ideal Beauty Atelier. View your vouchers now!',
    url: '/account/vouchers',
  },
];

export default function AdminNotificationsView({
  initialRecipients,
}: AdminNotificationsViewProps) {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>(initialRecipients);
  const [targetType, setTargetType] = useState<'ALL' | 'SELECTED'>('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tokenFilter, setTokenFilter] = useState<'ALL' | 'WITH_TOKEN' | 'WITHOUT_TOKEN'>('ALL');
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    details?: unknown;
  } | null>(null);

  // Statistics
  const totalUsers = recipients.length;
  const subscribedUsers = useMemo(
    () => recipients.filter((r) => r.hasFcmToken),
    [recipients]
  );
  const subscribedCount = subscribedUsers.length;
  const unsubscribedCount = totalUsers - subscribedCount;
  const subscriptionRate = totalUsers > 0 ? Math.round((subscribedCount / totalUsers) * 100) : 0;

  // Filtered recipient list for table
  const filteredRecipients = useMemo(() => {
    return recipients.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.phone && r.phone.includes(q));

      if (!matchesSearch) return false;

      if (tokenFilter === 'WITH_TOKEN') return r.hasFcmToken;
      if (tokenFilter === 'WITHOUT_TOKEN') return !r.hasFcmToken;
      return true;
    });
  }, [recipients, searchQuery, tokenFilter]);

  // Selected recipient statistics
  const selectedSubscribedCount = useMemo(() => {
    const selectedSet = new Set(selectedUserIds);
    return recipients.filter((r) => selectedSet.has(r.id) && r.hasFcmToken).length;
  }, [recipients, selectedUserIds]);

  const handleRefreshRecipients = async () => {
    setIsRefreshing(true);
    try {
      const data = await getAdminNotificationRecipientsAction();
      setRecipients(data);
    } catch (err) {
      console.error('Failed to refresh recipients:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredRecipients.map((r) => r.id);
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleSelectSubscribedFiltered = () => {
    const filteredSubscribedIds = filteredRecipients
      .filter((r) => r.hasFcmToken)
      .map((r) => r.id);
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...filteredSubscribedIds])));
  };

  const handleClearSelection = () => {
    setSelectedUserIds([]);
  };

  const handleApplyTemplate = (tpl: (typeof TEMPLATES)[0]) => {
    setTitle(tpl.title);
    setBody(tpl.body);
    setUrl(tpl.url);
    setStatusResult(null);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusResult(null);

    if (!title.trim()) {
      setStatusResult({
        type: 'error',
        message: 'Please enter a notification title.',
      });
      return;
    }

    if (!body.trim()) {
      setStatusResult({
        type: 'error',
        message: 'Please enter a notification message body.',
      });
      return;
    }

    if (targetType === 'SELECTED' && selectedUserIds.length === 0) {
      setStatusResult({
        type: 'error',
        message: 'Please select at least one customer recipient.',
      });
      return;
    }

    if (targetType === 'ALL' && subscribedCount === 0) {
      setStatusResult({
        type: 'warning',
        message: 'No registered customers have active push notification tokens at this time.',
      });
      return;
    }

    if (targetType === 'SELECTED' && selectedSubscribedCount === 0) {
      setStatusResult({
        type: 'warning',
        message:
          'None of the selected customers have active push notification tokens registered.',
      });
      return;
    }

    setIsSending(true);

    try {
      const result = await sendAdminPushNotificationAction({
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || undefined,
        targetType,
        userIds: targetType === 'SELECTED' ? selectedUserIds : undefined,
      });

      if (result.successCount > 0) {
        setStatusResult({
          type: 'success',
          message: `Broadcast sent successfully to ${result.successCount} recipient${
            result.successCount > 1 ? 's' : ''
          }.${result.failureCount > 0 ? ` (${result.failureCount} failed)` : ''}`,
          details: result,
        });
      } else if (result.eligibleTokensCount === 0) {
        setStatusResult({
          type: 'warning',
          message: 'No active push notification tokens were available for the chosen recipients.',
          details: result,
        });
      } else {
        setStatusResult({
          type: 'error',
          message: result.message || 'Failed to dispatch notification broadcast. Please check server logs.',
          details: result,
        });
      }
    } catch (error: unknown) {
      console.error('Failed to send push notification:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while sending notification.';
      setStatusResult({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 font-light text-xs">
      <AdminHeader
        title="Push Notifications Broadcast"
        subtitle="CUSTOMER ENGAGEMENT & FCM MESSAGING HUB"
        activeTab="notifications"
        action={
          <button
            onClick={handleRefreshRecipients}
            disabled={isRefreshing}
            className="bg-neutral-100 text-neutral-800 border border-neutral-300 px-4 py-2 uppercase tracking-widest text-[10px] hover:bg-neutral-200 transition-colors flex items-center space-x-2 rounded-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Users</span>
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Metric Cards Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200 p-5 rounded-xs space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 font-mono text-[10px] uppercase tracking-wider">
              <span>Total Customers</span>
              <Users className="w-4 h-4 text-neutral-400" />
            </div>
            <p className="text-2xl font-serif text-neutral-900 font-medium">{totalUsers}</p>
            <p className="text-[11px] text-neutral-500 font-light">Registered platform accounts</p>
          </div>

          <div className="bg-white border border-neutral-200 p-5 rounded-xs space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 font-mono text-[10px] uppercase tracking-wider">
              <span>Push Subscribed</span>
              <Bell className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-serif text-emerald-600 font-medium">{subscribedCount}</p>
            <p className="text-[11px] text-neutral-500 font-light">
              <span className="font-medium text-emerald-600">{subscriptionRate}%</span> subscriber reach rate
            </p>
          </div>

          <div className="bg-white border border-neutral-200 p-5 rounded-xs space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 font-mono text-[10px] uppercase tracking-wider">
              <span>Push Disabled</span>
              <UserCheck className="w-4 h-4 text-neutral-400" />
            </div>
            <p className="text-2xl font-serif text-neutral-700 font-medium">{unsubscribedCount}</p>
            <p className="text-[11px] text-neutral-500 font-light">No active FCM token registered</p>
          </div>

          <div className="bg-neutral-900 text-white p-5 rounded-xs space-y-1 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 font-mono text-[10px] uppercase tracking-wider">
              <span>Service Status</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium tracking-wide">FCM Engine Ready</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono mt-1">Firebase Cloud Messaging</p>
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {statusResult && (
          <div
            className={`p-4 rounded-xs border flex items-start space-x-3 text-xs ${
              statusResult.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : statusResult.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {statusResult.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  statusResult.type === 'warning' ? 'text-amber-600' : 'text-red-600'
                }`}
              />
            )}
            <div className="flex-1 space-y-1">
              <p className="font-medium tracking-wide">{statusResult.message}</p>
              {statusResult.type === 'success' && (
                <p className="text-[11px] text-emerald-700">
                  Broadcast recorded in{' '}
                  <Link
                    href="/admin/audit-logs"
                    className="underline font-mono font-medium hover:text-emerald-950"
                  >
                    System Audit Logs
                  </Link>
                  .
                </p>
              )}
            </div>
          </div>
        )}

        {/* Main Grid: Broadcast Form & Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Notification Composer (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSendBroadcast} className="bg-white border border-neutral-200 p-6 rounded-xs space-y-6 shadow-2xs">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-sm font-medium text-neutral-900 font-serif flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Compose Notification Broadcast</span>
                </h2>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Draft and dispatch real-time push alerts directly to customer mobile & desktop browsers.
                </p>
              </div>

              {/* Audience Target Selector */}
              <div className="space-y-3">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-700 font-medium">
                  Target Audience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetType('ALL')}
                    className={`p-3.5 text-left border rounded-xs transition-all flex items-start space-x-3 ${
                      targetType === 'ALL'
                        ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <Users
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        targetType === 'ALL' ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    />
                    <div>
                      <span className="font-medium text-neutral-900 block text-xs">All Customers</span>
                      <span className="text-[10px] text-neutral-500 font-light block mt-0.5">
                        Broadcast to all {subscribedCount} push-subscribed users
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('SELECTED')}
                    className={`p-3.5 text-left border rounded-xs transition-all flex items-start space-x-3 ${
                      targetType === 'SELECTED'
                        ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <UserCheck
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        targetType === 'SELECTED' ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    />
                    <div>
                      <span className="font-medium text-neutral-900 block text-xs">Specific Customers</span>
                      <span className="text-[10px] text-neutral-500 font-light block mt-0.5">
                        Choose individual recipients from directory ({selectedUserIds.length} selected)
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Specific User Selector (Expanded when SELECTED) */}
              {targetType === 'SELECTED' && (
                <div className="space-y-3 bg-neutral-50 p-4 border border-neutral-200 rounded-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-700 font-medium">
                      Select Customer Recipients
                    </span>
                    <div className="flex items-center space-x-2 text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={handleSelectSubscribedFiltered}
                        className="text-amber-700 hover:underline hover:text-amber-900"
                      >
                        Select Subscribed ({filteredRecipients.filter((r) => r.hasFcmToken).length})
                      </button>
                      <span className="text-neutral-300">|</span>
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="text-neutral-600 hover:underline hover:text-neutral-900"
                      >
                        Select All
                      </button>
                      <span className="text-neutral-300">|</span>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="text-neutral-600 hover:underline hover:text-neutral-900"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 text-xs focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                    <div className="flex items-center space-x-1 shrink-0 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setTokenFilter('ALL')}
                        className={`px-2.5 py-1.5 border rounded-xs transition-colors ${
                          tokenFilter === 'ALL'
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        All ({recipients.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTokenFilter('WITH_TOKEN')}
                        className={`px-2.5 py-1.5 border rounded-xs transition-colors ${
                          tokenFilter === 'WITH_TOKEN'
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        Push Active ({subscribedCount})
                      </button>
                    </div>
                  </div>

                  {/* Recipient Selection Table */}
                  <div className="max-h-60 overflow-y-auto border border-neutral-200 bg-white rounded-xs divide-y divide-neutral-100 scrollbar-thin scrollbar-thumb-neutral-300">
                    {filteredRecipients.length === 0 ? (
                      <div className="p-4 text-center text-neutral-400 font-light text-xs">
                        No customers match your search criteria.
                      </div>
                    ) : (
                      filteredRecipients.map((user) => {
                        const isSelected = selectedUserIds.includes(user.id);
                        return (
                          <div
                            key={user.id}
                            onClick={() => handleToggleUser(user.id)}
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected ? 'bg-amber-50/60' : 'hover:bg-neutral-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="shrink-0 text-neutral-500">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-amber-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-neutral-300" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-neutral-900 truncate text-xs">
                                  {user.name}
                                </p>
                                <p className="text-[10px] text-neutral-500 font-mono truncate">
                                  {user.email || user.phone || 'No contact on file'}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 pl-2">
                              {user.hasFcmToken ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500 mr-1" />
                                  Push Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-neutral-100 text-neutral-500 border border-neutral-200">
                                  No Token
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Selection Summary Pill */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-600 px-1 pt-1">
                    <span>
                      Selected: <strong className="text-neutral-900">{selectedUserIds.length}</strong>{' '}
                      customers
                    </span>
                    <span className="text-emerald-700 font-medium">
                      ({selectedSubscribedCount} reachable with push token)
                    </span>
                  </div>
                </div>
              )}

              {/* Notification Message Details */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-700 font-medium">
                      Notification Title <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-neutral-400 font-mono">{title.length}/60</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    placeholder="e.g. 🌟 Exclusive Spring Collection Launch"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 text-xs focus:bg-white focus:outline-none focus:border-neutral-900 rounded-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-700 font-medium">
                      Notification Message Body <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-neutral-400 font-mono">{body.length}/160</span>
                  </div>
                  <textarea
                    required
                    rows={3}
                    maxLength={160}
                    placeholder="e.g. Discover our latest couture gowns and book your fitting before weekend slots fill up!"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 text-xs focus:bg-white focus:outline-none focus:border-neutral-900 rounded-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-700 font-medium">
                      Click Action URL / Deep Link <span className="text-neutral-400 font-light">(Optional)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. /products or /account/orders"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 text-xs focus:bg-white focus:outline-none focus:border-neutral-900 rounded-xs font-mono"
                  />
                  <p className="text-[10px] text-neutral-400 font-light">
                    When the customer clicks the push alert, their browser will navigate directly to this path.
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-neutral-100">
                <div className="text-[11px] text-neutral-500 font-light">
                  Targeting:{' '}
                  <strong className="text-neutral-900 font-medium font-mono">
                    {targetType === 'ALL'
                      ? `${subscribedCount} subscribed customers`
                      : `${selectedSubscribedCount} of ${selectedUserIds.length} selected`}
                  </strong>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTitle('');
                      setBody('');
                      setUrl('');
                      setStatusResult(null);
                    }}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs uppercase tracking-wider font-mono hover:bg-neutral-100 rounded-xs transition-colors"
                  >
                    Reset
                  </button>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-medium px-5 py-2 text-xs uppercase tracking-widest transition-colors flex items-center space-x-2 rounded-xs shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Broadcast</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Live Mockup Preview & Quick Presets (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Push Notification Preview Card */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xs space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-700 font-medium flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-neutral-400" />
                  <span>Live Notification Preview</span>
                </h3>
                <span className="text-[10px] font-mono text-neutral-400">Lock Screen / Banner</span>
              </div>

              {/* Mobile Push Notification Mockup Box */}
              <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 p-5 rounded-xl text-white shadow-xl space-y-3">
                {/* Mock Phone Status Header */}
                <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pb-1">
                  <span>9:41 AM</span>
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                  </div>
                </div>

                {/* The Push Notification Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-xl space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-md bg-amber-500 text-black flex items-center justify-center font-serif text-[10px] font-bold">
                        IB
                      </div>
                      <span className="text-[11px] font-medium tracking-wide uppercase font-mono text-neutral-200">
                        Ideal Beauty
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">now</span>
                  </div>

                  <div className="space-y-0.5 pl-7">
                    <p className="text-xs font-semibold text-white tracking-wide leading-tight">
                      {title.trim() || 'Notification Title'}
                    </p>
                    <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                      {body.trim() || 'Notification message body will appear here for the recipient.'}
                    </p>
                    {url && (
                      <p className="text-[9px] text-amber-400 font-mono pt-1 flex items-center space-x-1">
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Link: {url}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-neutral-400 font-light leading-normal">
                This preview approximates how your message will appear when rendered as an operating system push notification.
              </p>
            </div>

            {/* Quick Presets / Templates */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xs space-y-3 shadow-2xs">
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-700 font-medium">
                Quick Message Presets
              </h3>
              <div className="space-y-2">
                {TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-full text-left p-3 border border-neutral-200 hover:border-amber-400 hover:bg-amber-50/40 rounded-xs transition-colors space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-neutral-900 text-xs group-hover:text-amber-900">
                        {tpl.label}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 group-hover:text-amber-700">
                        Apply
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-light line-clamp-1">{tpl.body}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Technical Information & Guidelines */}
            <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-xs space-y-2">
              <div className="flex items-center space-x-2 text-neutral-800 font-medium text-xs">
                <Info className="w-4 h-4 text-neutral-600" />
                <span>Delivery Guidelines</span>
              </div>
              <ul className="text-[11px] text-neutral-600 space-y-1 font-light list-disc list-inside">
                <li>Notifications are delivered instantly via Firebase Cloud Messaging (FCM).</li>
                <li>Only users who accepted the browser prompt will receive alerts.</li>
                <li>Keep titles under 50 characters for clean rendering on all lock screens.</li>
                <li>All broadcast events are logged for security compliance.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
