'use client';

import React, { useState } from 'react';
import { Truck, X } from 'lucide-react';
import { OrderSerialized } from './types';

interface ShippingInfoModalProps {
  order: OrderSerialized | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderId: string, courierName: string, trackingNumber: string) => Promise<void> | void;
  isPending?: boolean;
}

export default function ShippingInfoModal({
  order,
  isOpen,
  onClose,
  onSave,
  isPending = false,
}: ShippingInfoModalProps) {
  const [prevOrderId, setPrevOrderId] = useState<string | null>(null);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  if (order && order.id !== prevOrderId) {
    setPrevOrderId(order.id);
    setCourierName(order.courierName || 'JNE Express');
    setTrackingNumber(order.trackingNumber || '');
  }

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(order.id, courierName, trackingNumber);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white max-w-md w-full rounded-xs shadow-xl border border-neutral-200 p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-neutral-700" />
            <h3 className="font-serif text-lg font-light text-neutral-900">
              Update Courier & Tracking
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-500 font-mono">
          Order #{order.id} &bull; Customer: {order.user?.name || 'Guest'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
              Courier Name
            </label>
            <input
              type="text"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="e.g. JNE Express / Private Atelier Courier"
              className="w-full border border-neutral-200 rounded-xs p-2 text-xs focus:outline-hidden focus:border-black"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
              Tracking Number
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. JNE1234567890"
              className="w-full border border-neutral-200 rounded-xs p-2 text-xs font-mono focus:outline-hidden focus:border-black"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 text-xs font-medium uppercase tracking-wider rounded-xs text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-black text-white text-xs font-medium uppercase tracking-wider rounded-xs hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Saving...' : 'Save Tracking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
