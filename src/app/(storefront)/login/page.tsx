'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loginUserAction } from '@/app/actions/auth';
import { Sparkles, ArrowRight, AlertCircle, Loader2, Lock, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import PhoneAuthForm from '@/components/auth/PhoneAuthForm';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';

function LoginFormContent() {
  const searchParams = useSearchParams();
  
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [method, setMethod] = useState<'email' | 'phone'>('email');

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

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name to create an account.');
      return;
    }

    if (mode === 'signup' && !password) {
      setError('Please enter a password for your account.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginUserAction(
        email,
        password || undefined,
        mode === 'signup' ? name || undefined : undefined,
        mode === 'signup'
      );
      // Hard navigation to trigger full cookie refresh and RSC re-render
      window.location.href = safeRedirectUrl;
    } catch (err: any) {
      setError(err.message || (mode === 'signup' ? 'Failed to create account.' : 'Failed to sign in.'));
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setError(null);
  };

  return (
    <div className="bg-neutral-50/50 min-h-screen py-16 sm:py-24 font-light text-xs flex items-center justify-center">
      <div className="w-full max-w-md px-4 sm:px-6">
        <div className="bg-white border border-neutral-100 shadow-sm overflow-hidden">
          {/* Main Auth Mode Tabs */}
          <div className="grid grid-cols-2 border-b border-neutral-200">
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              className={`py-3.5 text-xs uppercase tracking-wider font-medium text-center transition-colors ${
                mode === 'signin'
                  ? 'bg-white text-black border-b-2 border-black font-semibold'
                  : 'bg-neutral-50/80 text-neutral-400 hover:text-black'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('signup')}
              className={`py-3.5 text-xs uppercase tracking-wider font-medium text-center transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-black border-b-2 border-black font-semibold'
                  : 'bg-neutral-50/80 text-neutral-400 hover:text-black'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-8 sm:p-10 space-y-7">
            {/* Header */}
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-sans block">
                PATRON PORTAL
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900 flex items-center justify-center space-x-2">
                <span>{mode === 'signin' ? 'Sign In to Atelier' : 'Create Your Account'}</span>
                <Sparkles className="w-4 h-4 text-amber-600 inline-block" />
              </h1>
              <p className="text-neutral-500 font-light text-xs leading-relaxed">
                {mode === 'signin'
                  ? 'Access your account using social sign-in, email, or SMS phone verification.'
                  : 'Register to save items, track orders, and experience personalized concierge service.'}
              </p>
            </div>

            {/* Social Sign-In Options */}
            <SocialAuthButtons />

            {/* Visual Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-neutral-200 w-full" />
              <span className="bg-white px-3 text-[10px] uppercase tracking-widest text-neutral-400 font-mono whitespace-nowrap absolute">
                {mode === 'signin' ? 'Or Sign In With' : 'Or Register With'}
              </span>
            </div>

            {/* Sub Method Selector: Email vs Phone */}
            <div className="flex bg-neutral-100/80 p-1 rounded">
              <button
                type="button"
                onClick={() => setMethod('email')}
                className={`flex-1 py-1.5 text-[11px] uppercase tracking-wider font-medium rounded transition-all flex items-center justify-center space-x-1.5 ${
                  method === 'email' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('phone')}
                className={`flex-1 py-1.5 text-[11px] uppercase tracking-wider font-medium rounded transition-all flex items-center justify-center space-x-1.5 ${
                  method === 'phone' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>SMS OTP</span>
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {method === 'email' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-mono">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Lady / Sir Full Name"
                      className="w-full bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                )}

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
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-mono">
                    Password {mode === 'signup' ? <span className="text-rose-500">*</span> : <span className="text-neutral-400 font-normal">(Optional)</span>}
                  </label>
                  <input
                    type="password"
                    required={mode === 'signup'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white text-xs uppercase tracking-[0.2em] py-3.5 px-4 font-light hover:bg-neutral-800 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>{mode === 'signin' ? 'Sign In' : 'Register Account'}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <PhoneAuthForm />
            )}

            {/* Mode Switcher Footer */}
            <div className="border-t border-neutral-100 pt-5 text-center space-y-3">
              {mode === 'signin' ? (
                <p className="text-xs text-neutral-500">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('signup')}
                    className="font-medium text-black underline underline-offset-4 hover:text-neutral-700 transition-colors"
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p className="text-xs text-neutral-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('signin')}
                    className="font-medium text-black underline underline-offset-4 hover:text-neutral-700 transition-colors"
                  >
                    Sign In
                  </button>
                </p>
              )}

              <div>
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
