'use client';

import React, { useState } from 'react';
import { setDefaultAddressAction, deleteAddressAction } from '@/app/actions/account';
import AddressModal, { AddressData } from './AddressModal';
import { MapPin, Plus, Star, Edit3, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AddressTabProps {
  addresses: AddressData[];
}

export default function AddressTab({ addresses }: AddressTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const [loadingAddressId, setLoadingAddressId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenAdd = () => {
    setSelectedAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (address: AddressData) => {
    setSelectedAddress(address);
    setIsModalOpen(true);
  };

  const handleSetDefault = async (addressId: string) => {
    setLoadingAddressId(addressId);
    setStatusMessage(null);
    try {
      const res = await setDefaultAddressAction(addressId);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Default shipping address updated successfully.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Failed to update default address.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoadingAddressId(null);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to remove this address from your address book?')) {
      return;
    }

    setLoadingAddressId(addressId);
    setStatusMessage(null);
    try {
      const res = await deleteAddressAction(addressId);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Address deleted successfully.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Failed to delete address.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoadingAddressId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-100 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <div>
            <h2 className="font-serif text-xl font-normal text-neutral-900">Address Book</h2>
            <p className="text-neutral-500 font-light text-xs mt-1">
              Manage saved shipping locations for expedited atelier deliveries.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-black text-white text-xs uppercase tracking-[0.15em] px-5 py-2.5 font-light hover:bg-neutral-800 transition-colors flex items-center justify-center space-x-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Address</span>
          </button>
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

        {addresses.length === 0 ? (
          <div className="border border-dashed border-neutral-200 p-12 text-center space-y-3">
            <MapPin className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="font-serif text-lg text-neutral-800 font-normal">No Saved Addresses</h3>
            <p className="text-neutral-500 text-xs font-light max-w-md mx-auto">
              Add your home, office, or preferred boutique delivery address to streamline your future checkout process.
            </p>
            <div className="pt-2">
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center space-x-2 bg-neutral-900 text-white text-xs uppercase tracking-widest px-6 py-2.5 font-light hover:bg-black transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Address</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => {
              const isActionLoading = loadingAddressId === address.id;

              return (
                <div
                  key={address.id}
                  className={`bg-white border p-6 space-y-4 relative flex flex-col justify-between transition-all ${
                    address.isDefault
                      ? 'border-neutral-900 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-serif font-medium text-sm text-neutral-900">
                          {address.label || 'Saved Address'}
                        </span>
                        {address.isDefault && (
                          <span className="bg-black text-white text-[9px] uppercase tracking-widest font-mono px-2 py-0.5 flex items-center space-x-1">
                            <Star className="w-2.5 h-2.5 fill-white" />
                            <span>Default</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-light text-neutral-700 space-y-1">
                      <p className="font-medium text-neutral-900">{address.recipientName}</p>
                      <p className="text-neutral-500 font-mono text-[11px]">{address.phone}</p>
                      <p className="pt-1 text-neutral-800">{address.addressLine1}</p>
                      <p className="text-neutral-800">
                        {address.city}, {address.province} {address.postalCode}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                    {!address.isDefault ? (
                      <button
                        onClick={() => address.id && handleSetDefault(address.id)}
                        disabled={isActionLoading}
                        className="text-neutral-600 hover:text-black font-medium uppercase tracking-wider underline underline-offset-4 disabled:opacity-50 flex items-center space-x-1"
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <span>Set as Default</span>
                        )}
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-medium uppercase tracking-wider flex items-center space-x-1 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Primary Address</span>
                      </span>
                    )}

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleOpenEdit(address)}
                        disabled={isActionLoading}
                        className="text-neutral-600 hover:text-black flex items-center space-x-1 uppercase tracking-wider font-medium text-[11px]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => address.id && handleDelete(address.id)}
                        disabled={isActionLoading}
                        className="text-red-600 hover:text-red-800 flex items-center space-x-1 uppercase tracking-wider font-medium text-[11px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        addressToEdit={selectedAddress}
      />
    </div>
  );
}
