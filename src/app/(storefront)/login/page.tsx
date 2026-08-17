'use client';

import React, { Suspense } from 'react';
import { Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';

function LoginFormContent() {
  return (
    <div className="bg-neutral-50/50 min-h-screen py-16 sm:py-24 font-light text-xs flex items-center justify-center">
      <div className="w-full max-w-md px-4 sm:px-6">
        <div className="bg-white border border-neutral-100 shadow-sm overflow-hidden p-8 sm:p-10 space-y-7">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-sans block">
              PATRON PORTAL
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900 flex items-center justify-center space-x-2">
              <span>Sign In or Register</span>
              <Sparkles className="w-4 h-4 text-amber-600 inline-block" />
            </h1>
            <p className="text-neutral-500 font-light text-xs leading-relaxed">
              Access your account or register instantly using your Google Account to save items, track orders, and experience personalized concierge service.
            </p>
          </div>

          {/* Google Account Authentication */}
          <div className="pt-2 space-y-4">
            <SocialAuthButtons
              provider="google"
              label="Continue with Google Account"
              className="flex items-center justify-center space-x-3 py-3.5 px-4 bg-white border border-neutral-300 hover:border-black hover:bg-neutral-50 transition-all text-xs font-semibold text-neutral-900 shadow-xs disabled:opacity-50 w-full rounded-xs cursor-pointer"
            />

            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-neutral-500 bg-neutral-50 p-3 rounded border border-neutral-100 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Fast & secure 1-click Google authentication</span>
            </div>
          </div>

          {/* Sub-footer link */}
          <div className="border-t border-neutral-100 pt-5 text-center">
            <Link
              href="/products"
              className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-black border-b border-neutral-200 pb-0.5 inline-block transition-colors"
            >
              Explore Collections
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-neutral-50/50 min-h-screen py-24 flex items-center justify-center font-light text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
