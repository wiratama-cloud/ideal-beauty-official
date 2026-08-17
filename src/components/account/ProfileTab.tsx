'use client';

import React, { useState } from 'react';
import { updateProfileAction } from '@/app/actions/account';
import { sendEmailVerificationAction, verifyEmailOtpAction } from '@/app/actions/auth';
import { User, Mail, Phone, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import PhoneAuthForm from '@/components/auth/PhoneAuthForm';
import { isValidPhoneNumber, formatPhoneNumber, formatOtp, cleanOtp } from '@/lib/utils/phone';

interface ProfileTabProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    isPhoneVerified: boolean;
    isEmailVerified?: boolean;
  };
}

export default function ProfileTab({ user }: ProfileTabProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone ? formatPhoneNumber(user.phone) : '+62 ',
  });
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [isChangePhoneModalOpen, setIsChangePhoneModalOpen] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [isConfirmingEmailCode, setIsConfirmingEmailCode] = useState(false);
  const [emailCodeStatus, setEmailCodeStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newval = name === 'phone' ? formatPhoneNumber(value) : value;
    setFormData((prev) => ({ ...prev, [name]: newval }));
  };

  const handleSendEmailCode = async () => {
    setIsSendingEmailCode(true);
    setEmailCodeStatus(null);
    try {
      const res = await sendEmailVerificationAction();
      setEmailCodeStatus({
        type: 'success',
        text: res.message || `Verification code sent to ${user.email}`,
      });
    } catch (err: any) {
      setEmailCodeStatus({
        type: 'error',
        text: err.message || 'Failed to dispatch verification email.',
      });
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  const handleConfirmEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmingEmailCode(true);
    setEmailCodeStatus(null);
    try {
      await verifyEmailOtpAction(cleanOtp(emailCode));
      setEmailCodeStatus({
        type: 'success',
        text: 'Email address verified successfully!',
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setEmailCodeStatus({
        type: 'error',
        text: err.message || 'Invalid email verification code.',
      });
    } finally {
      setIsConfirmingEmailCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    const trimmedPhone = formData.phone.trim();
    if (trimmedPhone && !isValidPhoneNumber(trimmedPhone)) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid phone number (e.g. +62 812-3456-7890 or 081234567890).',
      });
      setIsLoading(false);
      return;
    }

    const currentEmail = user.email ? user.email.trim().toLowerCase() : '';
    const newEmail = formData.email.trim().toLowerCase();
    const emailChanged = newEmail !== currentEmail;
    const phoneChanged = (formData.phone.trim() || null) !== (user.phone || null);

    try {
      const res = await updateProfileAction({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });

      if (res.success) {
        if (phoneChanged) {
          setIsVerifyingPhone(true);
          setStatusMessage({
            type: 'success',
            text: 'Profile updated. Please complete mobile phone verification for your new number below.',
          });
        } else {
          let msg = 'Your profile information has been updated successfully.';
          if (emailChanged) {
            msg = 'Profile updated successfully. Your new email address requires re-verification.';
          }
          setStatusMessage({
            type: 'success',
            text: msg,
          });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Failed to update profile information.',
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
    <div className="bg-white border border-neutral-100 p-6 sm:p-8 space-y-6">
      <div className="border-b border-neutral-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-normal text-neutral-900">Personal Details</h2>
          <p className="text-neutral-500 font-light text-xs mt-1">
            Manage your personal contact information and patron details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Email Verification Status Badge */}
          {user.isEmailVerified ? (
            <span className="flex items-center text-emerald-600 bg-emerald-50 px-2.5 py-1 text-[10px] uppercase tracking-wider font-medium border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Email Verified
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setIsVerifyingEmail(!isVerifyingEmail)}
              className="text-amber-800 bg-amber-50 px-2.5 py-1 text-[10px] uppercase tracking-wider font-medium border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              {isVerifyingEmail ? 'Cancel Email Verify' : 'Verify Email'}
            </button>
          )}

          {/* Phone Verification Status Badge */}
          {user.isPhoneVerified ? (
            <span className="flex items-center text-emerald-600 bg-emerald-50 px-2.5 py-1 text-[10px] uppercase tracking-wider font-medium border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Phone Verified
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setIsChangePhoneModalOpen(true)}
              className="text-amber-800 bg-amber-50 px-2.5 py-1 text-[10px] uppercase tracking-wider font-medium border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              Verify Phone
            </button>
          )}
        </div>
      </div>

      {/* Inline Email Verification Drawer */}
      {isVerifyingEmail && (
        <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-3">
          <h3 className="text-xs font-medium text-neutral-800 uppercase tracking-wider">
            Email Re-Verification ({user.email})
          </h3>
          <p className="text-xs text-neutral-600 font-light">
            Click send to dispatch a 6-digit confirmation code to your email address, then enter the code below.
          </p>

          {emailCodeStatus && (
            <div
              className={`p-3 text-xs font-light flex items-center space-x-2 border ${
                emailCodeStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {emailCodeStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <span>{emailCodeStatus.text}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSendEmailCode}
              disabled={isSendingEmailCode}
              className="bg-neutral-800 text-white text-xs px-4 py-2 hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              {isSendingEmailCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Send Verification Code</span>
            </button>

            <form onSubmit={handleConfirmEmailCode} className="flex items-center space-x-2 flex-1">
              <input
                type="text"
                value={emailCode}
                onChange={(e) => setEmailCode(formatOtp(e.target.value))}
                placeholder="123-456"
                maxLength={7}
                required
                className="border border-neutral-300 px-3 py-2 text-xs focus:outline-none focus:border-black font-mono w-full bg-white text-center font-medium"
              />
              <button
                type="submit"
                disabled={isConfirmingEmailCode || !emailCode.trim()}
                className="bg-black text-white text-xs px-4 py-2 hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center space-x-1"
              >
                {isConfirmingEmailCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Inline Phone Verification Drawer */}
      {isVerifyingPhone && (
        <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-3">
          <p className="text-xs text-neutral-700">Please verify your mobile phone number using SMS OTP.</p>
          <PhoneAuthForm
            initialPhoneNumber={formData.phone}
            isProfileVerification={true}
            onSuccess={() => {
              setIsVerifyingPhone(false);
              window.location.reload();
            }}
          />
        </div>
      )}

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
          <div className="space-y-2">
            <label htmlFor="name" className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Patron Name"
                className="w-full border border-neutral-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-black font-light bg-white text-neutral-900"
              />
              <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="patron@example.com"
                className="w-full border border-neutral-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-black font-light bg-white text-neutral-900"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="phone" className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
              Phone Number
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  disabled
                  readOnly
                  placeholder="+62 812-3456-7890"
                  className="w-full border border-neutral-200 pl-9 pr-3 py-2 text-xs font-light bg-neutral-100 text-neutral-500 cursor-not-allowed"
                />
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>
              <button
                type="button"
                onClick={() => setIsChangePhoneModalOpen(true)}
                className="px-4 py-2 bg-neutral-900 text-white text-xs font-medium hover:bg-black transition-colors shrink-0 flex items-center justify-center space-x-1"
              >
                <span>Change Phone Number</span>
              </button>
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
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>

      {/* Change & Verify Phone Number Dialog Modal */}
      {isChangePhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsChangePhoneModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-black transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-neutral-100 pb-4">
              <h2 className="font-serif text-xl font-normal text-neutral-900">
                Change & Verify Phone Number
              </h2>
              <p className="text-neutral-500 font-light text-xs mt-1">
                Enter your new mobile phone number to receive an SMS OTP for verification.
              </p>
            </div>

            <PhoneAuthForm
              initialPhoneNumber={formData.phone}
              isProfileVerification={true}
              onSuccess={() => {
                setIsChangePhoneModalOpen(false);
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
