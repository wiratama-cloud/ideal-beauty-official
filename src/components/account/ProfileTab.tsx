'use client';

import React, { useState } from 'react';
import { updateProfileAction } from '@/app/actions/account';
import { User, Mail, Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ProfileTabProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

export default function ProfileTab({ user }: ProfileTabProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
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

    try {
      const res = await updateProfileAction({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Your profile information has been updated successfully.',
        });
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
      <div className="border-b border-neutral-100 pb-4">
        <h2 className="font-serif text-xl font-normal text-neutral-900">Personal Details</h2>
        <p className="text-neutral-500 font-light text-xs mt-1">
          Manage your personal contact information and patron details.
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

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+62 812-3456-7890"
                className="w-full border border-neutral-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-black font-light bg-white text-neutral-900"
              />
              <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
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
    </div>
  );
}
