'use client';

import React, { useState } from 'react';
import { updatePasswordAction } from '@/app/actions/account';
import {
  ShieldCheck,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Phone,
  Mail,
  Smartphone,
  Globe,
  PlusCircle,
} from 'lucide-react';
import PhoneAuthForm from '@/components/auth/PhoneAuthForm';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';

interface SecurityTabProps {
  user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    isPhoneVerified?: boolean;
    isEmailVerified?: boolean;
    firebaseUid?: string | null;
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

  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [isLinkingSocial, setIsLinkingSocial] = useState(false);

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
            <h2 className="font-serif text-xl font-normal text-neutral-900">Sign-In Methods & Account Security</h2>
            <p className="text-neutral-500 font-light text-xs mt-1">
              Manage your connected sign-in methods, mobile phone verification, and account password.
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono px-3 py-1 uppercase tracking-widest border border-emerald-200 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Account Protected</span>
          </span>
        </div>

        {/* Multi Sign-In Options Grid */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs uppercase tracking-wider text-neutral-700 font-medium">Connected Sign-In Methods</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-light">
            {/* Email / Password Provider */}
            <div className="bg-neutral-50/70 p-4 border border-neutral-200 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-medium text-neutral-800">
                    <Mail className="w-4 h-4 text-neutral-600" />
                    <span>Email & Password</span>
                  </div>
                  {user.isEmailVerified ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 font-mono flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 font-mono">
                      Unverified
                    </span>
                  )}
                </div>
                <p className="font-mono text-neutral-600 text-[11px] truncate">{user.email || 'No email configured'}</p>
                <p className="text-neutral-400 text-[11px]">
                  {user.hasPassword
                    ? 'Allows sign-in via email address and password.'
                    : 'Set a password below to enable password sign-in.'}
                </p>
              </div>
            </div>

            {/* Phone SMS Provider */}
            <div className="bg-neutral-50/70 p-4 border border-neutral-200 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-medium text-neutral-800">
                    <Smartphone className="w-4 h-4 text-neutral-600" />
                    <span>Mobile Phone SMS</span>
                  </div>
                  {user.isPhoneVerified ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 font-mono flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                      <span>Verified</span>
                    </span>
                  ) : user.phone ? (
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 font-mono">
                      Unverified
                    </span>
                  ) : (
                    <span className="text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 font-mono">
                      Not Linked
                    </span>
                  )}
                </div>
                <p className="font-mono text-neutral-600 text-[11px]">
                  {user.phone || 'No phone number linked'}
                </p>
                <p className="text-neutral-400 text-[11px]">
                  {user.isPhoneVerified
                    ? 'Allows instant sign-in using SMS code verification.'
                    : 'Link or verify your mobile number to enable SMS sign-in.'}
                </p>
              </div>

              {!user.isPhoneVerified && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsVerifyingPhone(!isVerifyingPhone)}
                    className="text-[11px] font-medium text-black underline underline-offset-2 hover:text-neutral-700"
                  >
                    {isVerifyingPhone ? 'Cancel Phone Verification' : user.phone ? 'Verify Mobile Number' : 'Link Mobile Number'}
                  </button>
                </div>
              )}
            </div>

            {/* Google Provider Card */}
            <div className="bg-neutral-50/70 p-4 border border-neutral-200 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-medium text-neutral-800">
                    <Globe className="w-4 h-4 text-neutral-600" />
                    <span>Google Account</span>
                  </div>
                  {user.firebaseUid ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 font-mono">
                      Linked
                    </span>
                  ) : (
                    <span className="text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 font-mono">
                      Available
                    </span>
                  )}
                </div>
                <p className="text-neutral-400 text-[11px]">
                  Sign in or verify using your Google credentials.
                </p>
              </div>
              <div className="pt-2">
                <SocialAuthButtons
                  provider="google"
                  onSuccess={() => window.location.reload()}
                />
              </div>
            </div>

            {/* Facebook Provider Card */}
            <div className="bg-neutral-50/70 p-4 border border-neutral-200 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-medium text-neutral-800">
                    <Globe className="w-4 h-4 text-neutral-600" />
                    <span>Facebook Account</span>
                  </div>
                  {user.firebaseUid ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 font-mono">
                      Linked
                    </span>
                  ) : (
                    <span className="text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 font-mono">
                      Available
                    </span>
                  )}
                </div>
                <p className="text-neutral-400 text-[11px]">
                  Sign in or verify using your Facebook credentials.
                </p>
              </div>
              <div className="pt-2">
                <SocialAuthButtons
                  provider="facebook"
                  onSuccess={() => window.location.reload()}
                />
              </div>
            </div>

            {/* Apple Provider Card */}
            <div className="bg-neutral-50/70 p-4 border border-neutral-200 space-y-2 flex flex-col justify-between md:col-span-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-medium text-neutral-800">
                    <Globe className="w-4 h-4 text-neutral-600" />
                    <span>Apple ID</span>
                  </div>
                  {user.firebaseUid ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 font-mono">
                      Linked
                    </span>
                  ) : (
                    <span className="text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 font-mono">
                      Available
                    </span>
                  )}
                </div>
                <p className="text-neutral-400 text-[11px]">
                  Sign in or verify using your Apple ID credentials.
                </p>
              </div>
              <div className="pt-2">
                <SocialAuthButtons
                  provider="apple"
                  onSuccess={() => window.location.reload()}
                />
              </div>
            </div>
          </div>

          {/* Inline Phone Verification Drawer */}
          {isVerifyingPhone && (
            <div className="bg-neutral-50 p-5 border border-neutral-300 space-y-3 mt-4">
              <h4 className="text-xs font-medium text-neutral-900 uppercase tracking-wider">
                SMS OTP Mobile Phone Verification
              </h4>
              <p className="text-xs text-neutral-600 font-light">
                Enter your mobile number to receive a 6-digit SMS OTP verification code.
              </p>
              <PhoneAuthForm
                isProfileVerification={true}
                onSuccess={() => {
                  setIsVerifyingPhone(false);
                  window.location.reload();
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Update Password Form */}
      <div className="bg-white border border-neutral-100 p-6 sm:p-8 space-y-6">
        <div className="border-b border-neutral-100 pb-4">
          <h2 className="font-serif text-xl font-normal text-neutral-900">
            {user.hasPassword ? 'Change Account Password' : 'Set Account Password'}
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
