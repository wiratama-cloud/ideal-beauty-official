'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Maximize2, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/utils/image-url';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
  className?: string;
}

export default function ProductGallery({
  images,
  productName,
  selectedIndex = 0,
  onSelectIndex,
  className = '',
}: ProductGalleryProps) {
  const imageList = images && images.length > 0 ? images : ['/images/products/default-product.jpg'];

  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  // Touch swipe handling
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const heroContainerRef = useRef<HTMLDivElement>(null);

  // Sync external selectedIndex if provided
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < imageList.length) {
      setCurrentIndex(selectedIndex);
    }
  }, [selectedIndex, imageList.length]);

  const handleSelectImage = useCallback(
    (index: number) => {
      const targetIndex = (index + imageList.length) % imageList.length;
      setCurrentIndex(targetIndex);
      onSelectIndex?.(targetIndex);
    },
    [imageList.length, onSelectIndex]
  );

  const handlePrev = useCallback(() => {
    handleSelectImage(currentIndex - 1);
  }, [currentIndex, handleSelectImage]);

  const handleNext = useCallback(() => {
    handleSelectImage(currentIndex + 1);
  }, [currentIndex, handleSelectImage]);

  // Desktop hover zoom handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroContainerRef.current) return;
    const rect = heroContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  // Touch swipe events
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Prev
      handlePrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Keyboard navigation for Lightbox modal
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, handlePrev, handleNext]);

  const currentImage = imageList[currentIndex] || imageList[0];

  return (
    <div className={`space-y-4 select-none ${className}`}>
      {/* Hero Display Container */}
      <div
        ref={heroContainerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-[3/4] w-full bg-neutral-100 overflow-hidden group cursor-crosshair rounded-xs"
      >
        {/* Main Base Image */}
        <Image
          src={getOptimizedImageUrl(currentImage, 1024)}
          alt={`${productName} - Image ${currentIndex + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={`object-cover object-center transition-opacity duration-200 ${
            isZoomed ? 'opacity-0 md:opacity-0' : 'opacity-100'
          }`}
          unoptimized
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== '/images/products/default-product.jpg') {
              target.src = '/images/products/default-product.jpg';
            }
          }}
        />

        {/* Desktop Hover Zoom Preview (Inside Hero Container) */}
        {isZoomed && (
          <div
            className="hidden md:block absolute inset-0 pointer-events-none bg-no-repeat transition-all duration-75 ease-out"
            style={{
              backgroundImage: `url(${getOptimizedImageUrl(currentImage, 1024)})`,
              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              backgroundSize: '220%',
            }}
          />
        )}

        {/* Mobile / Tablet Next & Prev Navigation Overlay Buttons */}
        {imageList.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-xs text-neutral-800 rounded-full opacity-80 md:opacity-0 group-hover:opacity-90 hover:bg-white transition-all shadow-xs"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-xs text-neutral-800 rounded-full opacity-80 md:opacity-0 group-hover:opacity-90 hover:bg-white transition-all shadow-xs"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Action Controls Overlay (Lightbox Trigger) */}
        <div className="absolute bottom-3 right-3 flex items-center space-x-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            className="p-2.5 bg-white/90 backdrop-blur-xs hover:bg-black hover:text-white text-neutral-800 transition-all rounded-xs shadow-xs text-xs font-mono flex items-center space-x-1.5"
            aria-label="Open full-screen image preview"
            title="Full-screen preview"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider font-sans">Zoom</span>
          </button>
        </div>

        {/* Image Index Indicator Pill */}
        {imageList.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-1 rounded-xs uppercase tracking-widest">
            {currentIndex + 1} / {imageList.length}
          </div>
        )}
      </div>

      {/* Thumbnails Carousel / Strip */}
      {imageList.length > 1 && (
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none snap-x">
          {imageList.map((img, idx) => {
            const isSelected = currentIndex === idx;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectImage(idx)}
                aria-label={`View image ${idx + 1}`}
                className={`relative w-20 sm:w-24 aspect-[3/4] flex-shrink-0 bg-neutral-100 overflow-hidden border-2 transition-all snap-start rounded-xs ${
                  isSelected
                    ? 'border-black opacity-100 ring-1 ring-black'
                    : 'border-transparent opacity-60 hover:opacity-90'
                }`}
              >
                <Image
                  src={getOptimizedImageUrl(img, 256)}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== '/images/products/default-product.jpg') {
                      target.src = '/images/products/default-product.jpg';
                    }
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Full-screen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery lightbox"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar: Title, Counter & Close Button */}
          <div
            className="flex items-center justify-between text-white w-full max-w-6xl mx-auto z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3">
              <span className="font-serif text-sm sm:text-base font-light tracking-wide truncate max-w-xs sm:max-w-md">
                {productName}
              </span>
              <span className="text-xs font-mono text-neutral-400">
                ({currentIndex + 1} of {imageList.length})
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-neutral-800"
              aria-label="Close lightbox modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Central Image with Prev / Next Navigation */}
          <div
            className="relative flex-1 flex items-center justify-center my-4 max-w-6xl w-full mx-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            {imageList.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 p-3 rounded-full bg-black/50 text-white hover:bg-black hover:scale-105 transition-all z-20"
                aria-label="Previous image in lightbox"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* High-Resolution Modal Image */}
            <div className="relative w-full h-full max-h-[78vh] flex items-center justify-center">
              <Image
                src={getOptimizedImageUrl(currentImage, 1024)}
                alt={`${productName} - Preview ${currentIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                unoptimized
                priority
              />
            </div>

            {/* Next Button */}
            {imageList.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 sm:right-4 p-3 rounded-full bg-black/50 text-white hover:bg-black hover:scale-105 transition-all z-20"
                aria-label="Next image in lightbox"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip inside Lightbox */}
          {imageList.length > 1 && (
            <div
              className="flex justify-center items-center space-x-2 sm:space-x-3 overflow-x-auto py-2 z-10 max-w-xl mx-auto scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              {imageList.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectImage(idx)}
                  className={`relative w-12 sm:w-16 aspect-[3/4] flex-shrink-0 bg-neutral-900 overflow-hidden border-2 transition-all rounded-xs ${
                    currentIndex === idx ? 'border-white opacity-100' : 'border-transparent opacity-40 hover:opacity-80'
                  }`}
                >
                  <Image
                    src={getOptimizedImageUrl(img, 256)}
                    alt={`Preview thumbnail ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
