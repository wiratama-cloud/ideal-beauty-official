'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loginUserAction } from '@/app/actions/auth';
import { Sparkles, ArrowRight, AlertCircle, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const redirectParam = searchParams.get('redirect') || '/account';
  // Ensure redirect URL stays internal
  const safeRedirectUrl = redirectParam.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginUserAction(email, password || undefined, name || undefined);
      // Hard navigation to trigger full cookie refresh and RSC re-render
      window.location.href = safeRedirectUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-50/50 min-h-screen py-16 sm:py-24 font-light text-xs flex items-center justify-center">
      <div className="w-full max-w-md px-4 sm:px-6">
        <div className="bg-white border border-neutral-100 p-8 sm:p-10 shadow-sm space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-sans block">
              PATRON PORTAL
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900 flex items-center justify-center space-x-2">
              <span>Sign In to Atelier</span>
              <Sparkles className="w-4 h-4 text-amber-600 inline-block" />
            </h1>
            <p className="text-neutral-500 font-light text-xs leading-relaxed">
              Enter your email to access your orders, saved addresses, and private wishlist.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-mono">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patron@example.com"
                className="w-full bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-mono">
                  Password <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-mono">
                Full Name <span className="text-neutral-400 font-normal">(For New Patrons)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lady / Sir Full Name"
                className="w-full bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white text-xs uppercase tracking-[0.2em] py-3.5 px-4 font-light hover:bg-neutral-800 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Access Account</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </button>
          </form>

          <div className="border-t border-neutral-100 pt-6 text-center space-y-2">
            <p className="text-[11px] text-neutral-400 font-light">
              Browsing haute couture or bridal collections?
            </p>
            <Link
              href="/products"
              className="text-[10px] uppercase tracking-widest text-neutral-800 hover:text-black border-b border-neutral-300 pb-0.5 inline-block transition-colors"
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
