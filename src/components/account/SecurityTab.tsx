'use client';

import React, { useState } from 'react';
import { updatePasswordAction } from '@/app/actions/account';
import { ShieldCheck, Key, CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';

interface SecurityTabProps {
  user: {
    id: string;
    email: string;
    hasPassword?: boolean;
    createdAt?: Date | string;
  };
}

export default function SecurityTab({ user }: SecurityTabProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    if (formData.newPassword.length < 6) {
      setStatusMessage({
        type: 'error',
        text: 'New password must be at least 6 characters long.',
      });
      setIsLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setStatusMessage({
        type: 'error',
        text: 'New password and confirmation do not match.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const res = await updatePasswordAction({
        currentPassword: user.hasPassword ? formData.currentPassword : undefined,
        newPassword: formData.newPassword,
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Your password has been updated successfully.',
        });
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Failed to update password.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Security Overview */}
      <div className="bg-white border border-neutral-100 p-6 sm:p-8 space-y-4">
        <div className="border-b border-neutral-100 pb-4 flex justify-between items-start">
          <div>
            <h2 className="font-serif text-xl font-normal text-neutral-900">Sign-In Options & Session Security</h2>
            <p className="text-neutral-500 font-light text-xs mt-1">
              Active account status and security settings for {user.email}.
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono px-3 py-1 uppercase tracking-widest border border-emerald-200 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Session Secure</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-light">
          <div className="bg-neutral-50/50 p-4 border border-neutral-100 space-y-1">
            <span className="text-[10px] uppercase text-neutral-400 font-mono block">Primary Credential</span>
            <span className="font-mono text-neutral-800 font-medium">{user.email}</span>
          </div>
          <div className="bg-neutral-50/50 p-4 border border-neutral-100 space-y-1">
            <span className="text-[10px] uppercase text-neutral-400 font-mono block">Password Protection</span>
            <span className="font-mono text-neutral-800 font-medium">
              {user.hasPassword ? 'Enabled (Password Hash Configured)' : 'Not Set (Session Cookie Auth)'}
            </span>
          </div>
        </div>
      </div>

      {/* Update Password Form */}
      <div className="bg-white border border-neutral-100 p-6 sm:p-8 space-y-6">
        <div className="border-b border-neutral-100 pb-4">
          <h2 className="font-serif text-xl font-normal text-neutral-900">
            {user.hasPassword ? 'Change Password' : 'Set Account Password'}
          </h2>
          <p className="text-neutral-500 font-light text-xs mt-1">
            Ensure your account uses a strong, unique password to safeguard your orders and private information.
          </p>
        </div>

        {statusMessage && (
          <div
            className={`p-4 text-xs font-light flex items-center space-x-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user.hasPassword && (
              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="currentPassword"
                  className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required={user.hasPassword}
                    placeholder="Enter current password"
                    className="w-full border border-neutral-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-black font-light bg-white text-neutral-900"
                  />
                  <Key className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="newPassword"
                className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  placeholder="Min. 6 characters"
                  className="w-full border border-neutral-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-black font-light bg-white text-neutral-900"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Re-enter new password"
                  className="w-full border border-neutral-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-black font-light bg-white text-neutral-900"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-black text-white text-xs uppercase tracking-[0.2em] px-8 py-3 font-light hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
