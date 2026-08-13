'use client';

import React, { useState, useEffect } from 'react';
import { createAddressAction, updateAddressAction } from '@/app/actions/account';
import { X, Loader2, AlertCircle, MapPin, Phone, User, Tag } from 'lucide-react';

export interface AddressData {
  id?: string;
  label?: string | null;
  recipientName: string;
  phone: string;
  addressLine1: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault?: boolean;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressToEdit?: AddressData | null;
  onSuccess?: () => void;
}

export default function AddressModal({
  isOpen,
  onClose,
  addressToEdit,
  onSuccess,
}: AddressModalProps) {
  const [formData, setFormData] = useState<AddressData>({
    label: '',
    recipientName: '',
    phone: '',
    addressLine1: '',
    city: '',
    province: '',
    postalCode: '',
    isDefault: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (addressToEdit) {
      setFormData({
        id: addressToEdit.id,
        label: addressToEdit.label || '',
        recipientName: addressToEdit.recipientName || '',
        phone: addressToEdit.phone || '',
        addressLine1: addressToEdit.addressLine1 || '',
        city: addressToEdit.city || '',
        province: addressToEdit.province || '',
        postalCode: addressToEdit.postalCode || '',
        isDefault: !!addressToEdit.isDefault,
      });
    } else {
      setFormData({
        label: 'Home',
        recipientName: '',
        phone: '',
        addressLine1: '',
        city: '',
        province: '',
        postalCode: '',
        isDefault: false,
      });
    }
    setErrorMessage(null);
  }, [addressToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let res;
      if (addressToEdit?.id) {
        res = await updateAddressAction(addressToEdit.id, {
          label: formData.label || undefined,
          recipientName: formData.recipientName.trim(),
          phone: formData.phone.trim(),
          addressLine1: formData.addressLine1.trim(),
          city: formData.city.trim(),
          province: formData.province.trim(),
          postalCode: formData.postalCode.trim(),
          isDefault: formData.isDefault,
        });
      } else {
        res = await createAddressAction({
          label: formData.label || undefined,
          recipientName: formData.recipientName.trim(),
          phone: formData.phone.trim(),
          addressLine1: formData.addressLine1.trim(),
          city: formData.city.trim(),
          province: formData.province.trim(),
          postalCode: formData.postalCode.trim(),
          isDefault: formData.isDefault,
        });
      }

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to save address.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-neutral-200 max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-black transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b border-neutral-100 pb-4">
          <h2 className="font-serif text-xl font-normal text-neutral-900">
            {addressToEdit ? 'Edit Shipping Address' : 'Add New Address'}
          </h2>
          <p className="text-neutral-500 font-light text-xs mt-1">
            Provide precise location details for seamless courier dispatch.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 text-red-800 border border-red-200 p-3 text-xs font-light flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-light">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="label" className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
                Address Label (e.g., Home, Office)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="label"
                  name="label"
                  value={formData.label || ''}
                  onChange={handleChange}
                  placeholder="Home, Office, Villa"
                  className="w-full border border-neutral-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-black font-light text-neutral-900"
                />
                <Tag className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="recipientName" className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
                Recipient Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="recipientName"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  required
                  placeholder="Full Name"
                  className="w-full border border-neutral-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-black font-light text-neutral-900"
                />
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
                Phone Number *
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
                  className="w-full border border-neutral-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-black font-light text-neutral-900"
                />
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="addressLine1" className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
                Street Address *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="addressLine1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  required
                  placeholder="Street name, building, apartment/suite number"
                  className="w-full border border-neutral-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-black font-light text-neutral-900"
                />
                <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="city" className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
                City / Regency *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="South Jakarta"
                className="w-full border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:border-black font-light text-neutral-900"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="province" className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
                Province / Region *
              </label>
              <input
                type="text"
                id="province"
                name="province"
                value={formData.province}
                onChange={handleChange}
                required
                placeholder="DKI Jakarta"
                className="w-full border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:border-black font-light text-neutral-900"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="postalCode" className="block text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
                Postal Code *
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                required
                placeholder="12190"
                className="w-full border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:border-black font-light text-neutral-900"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault || false}
                  onChange={handleChange}
                  className="rounded border-neutral-300 text-black focus:ring-black h-4 w-4"
                />
                <span className="text-neutral-700 text-xs font-light">
                  Set as my primary default shipping address
                </span>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-neutral-300 text-neutral-700 text-xs uppercase tracking-widest px-5 py-2.5 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-black text-white text-xs uppercase tracking-[0.2em] px-6 py-2.5 font-light hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Address</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
