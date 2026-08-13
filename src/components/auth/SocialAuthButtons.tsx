'use client';

import React, { useState } from 'react';
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase/client';
import { verifyFirebaseTokenAction } from '@/app/actions/auth';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface SocialAuthButtonsProps {
  onSuccess?: () => void;
  provider?: 'google' | 'facebook' | 'apple';
}

export default function SocialAuthButtons({ onSuccess, provider }: SocialAuthButtonsProps) {
  const searchParams = useSearchParams();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectParam = searchParams?.get('redirect') || '/account';
  const safeRedirectUrl = redirectParam.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : '/account';

  const handleSocialSignIn = async (providerType: 'google' | 'facebook' | 'apple') => {
    if (!isFirebaseConfigured || !auth) {
      setError('Social sign-in is currently unavailable.');
      return;
    }

    setLoadingProvider(providerType);
    setError(null);

    try {
      let oauthProvider;
      if (providerType === 'google') {
        oauthProvider = new GoogleAuthProvider();
      } else if (providerType === 'facebook') {
        oauthProvider = new FacebookAuthProvider();
      } else {
        oauthProvider = new OAuthProvider('apple.com');
      }

      const userCredential = await signInWithPopup(auth, oauthProvider);
      const idToken = await userCredential.user.getIdToken();

      await verifyFirebaseTokenAction(idToken);

      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = safeRedirectUrl;
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setLoadingProvider(null);
        return;
      }
      setError(err.message || `Failed to sign in with ${providerType}. Please try again.`);
      setLoadingProvider(null);
    }
  };

  const renderGoogleButton = () => (
    <button
      type="button"
      onClick={() => handleSocialSignIn('google')}
      disabled={loadingProvider !== null}
      aria-label="Sign in with Google"
      className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors text-xs font-medium text-neutral-800 disabled:opacity-50 w-full"
    >
      {loadingProvider === 'google' ? (
        <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span>Connect Google</span>
    </button>
  );

  const renderFacebookButton = () => (
    <button
      type="button"
      onClick={() => handleSocialSignIn('facebook')}
      disabled={loadingProvider !== null}
      aria-label="Sign in with Facebook"
      className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors text-xs font-medium text-neutral-800 disabled:opacity-50 w-full"
    >
      {loadingProvider === 'facebook' ? (
        <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
      ) : (
        <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )}
      <span>Connect Facebook</span>
    </button>
  );

  const renderAppleButton = () => (
    <button
      type="button"
      onClick={() => handleSocialSignIn('apple')}
      disabled={loadingProvider !== null}
      aria-label="Sign in with Apple"
      className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors text-xs font-medium text-neutral-800 disabled:opacity-50 w-full"
    >
      {loadingProvider === 'apple' ? (
        <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
      ) : (
        <svg className="w-4 h-4 fill-black" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.62-.76 1.05-1.83.93-2.91-.91.04-2.02.61-2.67 1.37-.58.67-1.09 1.76-.95 2.81 1.02.08 2.07-.51 2.69-1.27z" />
        </svg>
      )}
      <span>Connect Apple</span>
    </button>
  );

  return (
    <div className="space-y-3 w-full">
      {error && (
        <div className="bg-rose-50 text-rose-700 text-xs p-2.5 rounded border border-rose-200">
          {error}
        </div>
      )}

      {provider === 'google' ? (
        renderGoogleButton()
      ) : provider === 'facebook' ? (
        renderFacebookButton()
      ) : provider === 'apple' ? (
        renderAppleButton()
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {renderGoogleButton()}
          {renderFacebookButton()}
          {renderAppleButton()}
        </div>
      )}
    </div>
  );
}
