'use client';

import React from 'react';
import { ShieldCheck, Globe } from 'lucide-react';
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
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Session Security Overview */}
      <div className="bg-white border border-neutral-100 p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="border-b border-neutral-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-normal text-neutral-900">Sign-In Methods & Account Security</h2>
            <p className="text-neutral-500 font-light text-xs mt-1">
              Manage your connected Google Account sign-in method and authentication security.
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono px-3 py-1 uppercase tracking-widest border border-emerald-200 flex items-center space-x-1 self-start sm:self-auto shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Account Protected</span>
          </span>
        </div>

        {/* Connected Sign-In Methods */}
        <div className="space-y-3 sm:space-y-4 pt-2">
          <h3 className="text-xs uppercase tracking-wider text-neutral-700 font-medium">Connected Sign-In Methods</h3>

          <div className="bg-neutral-50/70 p-4 sm:p-5 border border-neutral-200 space-y-3 max-w-lg">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 font-medium text-neutral-800">
                  <Globe className="w-4 h-4 text-neutral-600 shrink-0" />
                  <span>Google Account</span>
                </div>
                {user.firebaseUid ? (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 font-mono shrink-0">
                    Linked
                  </span>
                ) : (
                  <span className="text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 font-mono shrink-0">
                    Available
                  </span>
                )}
              </div>
              <p className="text-neutral-500 text-[11px] font-light leading-relaxed">
                Your account uses 1-click Google Account sign-in for secure authentication.
              </p>
            </div>
            <div className="pt-2">
              <SocialAuthButtons
                provider="google"
                label={user.firebaseUid ? 'Google Account Connected' : 'Connect Google Account'}
                disabled={Boolean(user.firebaseUid)}
                onSuccess={() => window.location.reload()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
