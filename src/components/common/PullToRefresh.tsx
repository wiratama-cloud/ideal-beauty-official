'use client';

import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, RefreshCw, ArrowDown } from 'lucide-react';
import { CartContext } from '@/components/cart/CartContext';

const PULL_THRESHOLD = 65; // Distance in px needed to trigger refresh
const MAX_PULL = 90; // Maximum visual pull distance
const HOLD_REFRESH_HEIGHT = 52; // Visual height while refreshing

export interface PullToRefreshProps {
  onRefresh?: () => Promise<void> | void;
  children?: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const router = useRouter();
  const cartContext = useContext(CartContext);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isTracking = useRef(false);
  const hasTriggeredHaptic = useRef(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullDistance(HOLD_REFRESH_HEIGHT);
    setIsReady(false);

    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        router.refresh();
      }

      if (cartContext?.refreshCart) {
        await cartContext.refreshCart();
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ideal:refresh'));
      }
    } catch {
      // Safe fallback
    } finally {
      // Keep refreshing indicator visible briefly for smooth user feedback
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        hasTriggeredHaptic.current = false;
      }, 850);
    }
  }, [onRefresh, router, cartContext]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshing || e.touches.length > 1) return;

      // Only enable pull to refresh when user is scrolled to the very top
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollY <= 0) {
        touchStartY.current = e.touches[0].clientY;
        touchStartX.current = e.touches[0].clientX;
        isTracking.current = true;
        hasTriggeredHaptic.current = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTracking.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - touchStartY.current;
      const deltaX = currentX - touchStartX.current;

      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollY > 0) {
        // User scrolled down into content, cancel pull tracking
        isTracking.current = false;
        setPullDistance(0);
        setIsReady(false);
        return;
      }

      // If user is swiping horizontally (e.g. tabs or image carousel), cancel pull gesture
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        isTracking.current = false;
        setPullDistance(0);
        setIsReady(false);
        return;
      }

      if (deltaY > 0) {
        // Calculate dampened resistance pull distance
        const distance = Math.min(MAX_PULL, Math.pow(deltaY, 0.8) * 1.5);
        setPullDistance(distance);

        if (distance >= PULL_THRESHOLD) {
          setIsReady(true);
          if (!hasTriggeredHaptic.current) {
            hasTriggeredHaptic.current = true;
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate?.(12);
              } catch {
                // Ignore vibration errors
              }
            }
          }
        } else {
          setIsReady(false);
          hasTriggeredHaptic.current = false;
        }

        // Prevent native rubber banding / pull conflicts in standalone mode
        if (e.cancelable && distance > 10) {
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = () => {
      if (!isTracking.current || isRefreshing) return;
      isTracking.current = false;

      if (pullDistance >= PULL_THRESHOLD) {
        handleRefresh();
      } else {
        setPullDistance(0);
        setIsReady(false);
        hasTriggeredHaptic.current = false;
      }
    };

    const onTouchCancel = () => {
      isTracking.current = false;
      if (!isRefreshing) {
        setPullDistance(0);
        setIsReady(false);
        hasTriggeredHaptic.current = false;
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [isRefreshing, pullDistance, handleRefresh]);

  const isVisible = pullDistance > 0 || isRefreshing;
  const progressRatio = Math.min(1, pullDistance / PULL_THRESHOLD);

  return (
    <>
      {/* Floating Luxury Atelier Pull Indicator Capsule */}
      <div
        aria-hidden={!isVisible}
        className={`fixed top-3 inset-x-0 z-50 flex justify-center pointer-events-none transition-all duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0 -translate-y-8'
        }`}
        style={{
          transform: isVisible
            ? `translateY(${Math.min(pullDistance, MAX_PULL)}px) scale(${0.85 + progressRatio * 0.15})`
            : 'translateY(-2rem) scale(0.85)',
        }}
      >
        <div className="bg-neutral-950/90 text-white border border-amber-500/40 shadow-xl backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center space-x-2 text-[10px] uppercase font-mono tracking-widest">
          {isRefreshing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
              <span className="text-amber-200">Updating Atelier...</span>
            </>
          ) : isReady ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              <span className="text-amber-300 font-medium">Release to Refresh</span>
            </>
          ) : (
            <>
              <ArrowDown
                className="w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform duration-150"
                style={{
                  transform: `rotate(${progressRatio * 180}deg)`,
                }}
              />
              <span className="text-neutral-300">Pull to Refresh</span>
            </>
          )}
        </div>
      </div>

      {children}
    </>
  );
}
