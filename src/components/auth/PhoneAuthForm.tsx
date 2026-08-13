'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth, isFirebaseConfigured } from '@/lib/firebase/client';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { Loader2, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
import { verifyFirebaseTokenAction, linkPhoneToUserAction } from '@/app/actions/auth';
import { useRouter, useSearchParams } from 'next/navigation';

interface PhoneAuthFormProps {
  isProfileVerification?: boolean;
  onSuccess?: () => void;
}

export default function PhoneAuthForm({ isProfileVerification = false, onSuccess }: PhoneAuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const redirectParam = searchParams.get('redirect') || '/account';
  const safeRedirectUrl = redirectParam.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : '/account';

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !recaptchaContainerRef.current) return;

    // Initialize reCAPTCHA
    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
    });

    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.startsWith('+')) {
      setError('Phone number must include country code (e.g., +62...)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const appVerifier = recaptchaVerifierRef.current;
      if (!appVerifier) throw new Error('reCAPTCHA not initialized');

      const result = await signInWithPhoneNumber(auth!, phoneNumber, appVerifier);
      setConfirmationResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;

    setLoading(true);
    setError(null);

    try {
      const credential = await confirmationResult.confirm(otp);
      const idToken = await credential.user.getIdToken();

      if (isProfileVerification) {
        await linkPhoneToUserAction(idToken);
        if (onSuccess) onSuccess();
      } else {
        await verifyFirebaseTokenAction(idToken);
        window.location.href = safeRedirectUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  if (!isFirebaseConfigured) {
    return <div className="text-neutral-500 text-xs">Phone authentication is currently unavailable.</div>;
  }

  return (
    <div className="space-y-6">
      <div ref={recaptchaContainerRef} id="recaptcha-container"></div>
      
      {!confirmationResult ? (
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-mono">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+62 812..."
              className="w-full bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white text-xs uppercase tracking-[0.2em] py-3.5 px-4 font-light hover:bg-neutral-800 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Request OTP</span> <ArrowRight className="w-3.5 h-3.5" /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-mono">
              Enter 6-Digit OTP <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs tracking-widest focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white text-xs uppercase tracking-[0.2em] py-3.5 px-4 font-light hover:bg-neutral-800 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Verify & Sign In</span> <ShieldCheck className="w-3.5 h-3.5" /></>}
          </button>
        </form>
      )}

      {error && (
        <div className="text-rose-600 text-xs bg-rose-50 p-3">{error}</div>
      )}
    </div>
  );
}
