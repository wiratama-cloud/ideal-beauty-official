import { describe, it, expect } from 'vitest';
import {
  getOptimizedImageUrl,
  getImageSrcSet,
  getDynamicSrcSet,
  getLQIPUrl,
  getBlurDataURL,
  getShimmerPlaceholder,
  getResponsiveImageProps,
  DEFAULT_PRODUCT_FALLBACK,
  DEFAULT_BLUR_DATA_URL,
} from '@/lib/utils/image-url';

describe('Image URL Utility Helpers', () => {
  it('returns fallback URL for null, undefined, or empty inputs', () => {
    expect(getOptimizedImageUrl(null)).toBe(DEFAULT_PRODUCT_FALLBACK);
    expect(getOptimizedImageUrl(undefined)).toBe(DEFAULT_PRODUCT_FALLBACK);
    expect(getOptimizedImageUrl('')).toBe(DEFAULT_PRODUCT_FALLBACK);
    expect(getOptimizedImageUrl('   ')).toBe(DEFAULT_PRODUCT_FALLBACK);
    expect(getOptimizedImageUrl(null, 512, '/custom-fallback.jpg')).toBe('/custom-fallback.jpg');
  });

  it('handles local upload and public images URLs with resolution replacement', () => {
    expect(getOptimizedImageUrl('/uploads/1712345678-dress-1024w.webp', 256)).toBe(
      '/uploads/1712345678-dress-256w.webp'
    );
    expect(getOptimizedImageUrl('/uploads/1712345678-dress-1024w.webp', 512)).toBe(
      '/uploads/1712345678-dress-512w.webp'
    );
    expect(getOptimizedImageUrl('/uploads/1712345678-dress-1024w.webp', 768)).toBe(
      '/uploads/1712345678-dress-768w.webp'
    );
    expect(getOptimizedImageUrl('/uploads/1712345678-dress.jpg', 512)).toBe(
      '/uploads/1712345678-dress-512w.webp'
    );
    expect(getOptimizedImageUrl('/images/products/anarkali-1.jpg', 256)).toBe(
      '/images/products/anarkali-1-256w.webp'
    );
    expect(getOptimizedImageUrl('/images/products/anarkali-1-1024w.webp', 512)).toBe(
      '/images/products/anarkali-1-512w.webp'
    );
    expect(getOptimizedImageUrl('/images/sections/brand-atelier.jpg', 768)).toBe(
      '/images/sections/brand-atelier-768w.webp'
    );
  });

  it('handles Firebase Storage URLs with encoded and unencoded variant patterns', () => {
    const firebaseUrl =
      'https://firebasestorage.googleapis.com/v0/b/bucket-name/o/products%2F1712345678-dress-1024w.webp?alt=media&token=123';
    expect(getOptimizedImageUrl(firebaseUrl, 256)).toBe(
      'https://firebasestorage.googleapis.com/v0/b/bucket-name/o/products%2F1712345678-dress-256w.webp?alt=media&token=123'
    );

    const firebaseEncodedUrl =
      'https://firebasestorage.googleapis.com/v0/b/bucket-name/o/products%2F1712345678-dress%2D1024w.webp?alt=media&token=123';
    expect(getOptimizedImageUrl(firebaseEncodedUrl, 256)).toBe(
      'https://firebasestorage.googleapis.com/v0/b/bucket-name/o/products%2F1712345678-dress%2D256w.webp?alt=media&token=123'
    );

    const firebaseRawUrl =
      'https://firebasestorage.googleapis.com/v0/b/bucket-name/o/products%2F1712345678-dress.jpg?alt=media&token=123';
    expect(getOptimizedImageUrl(firebaseRawUrl, 512)).toBe(
      'https://firebasestorage.googleapis.com/v0/b/bucket-name/o/products%2F1712345678-dress-512w.webp?alt=media&token=123'
    );

    const emulatorUrl =
      'http://127.0.0.1:9199/v0/b/idealbeauty-dev.appspot.com/o/products%2F1712345678-dress-1024w.webp?alt=media';
    expect(getOptimizedImageUrl(emulatorUrl, 256)).toBe(
      'http://127.0.0.1:9199/v0/b/idealbeauty-dev.appspot.com/o/products%2F1712345678-dress-256w.webp?alt=media'
    );

    const emulatorRawUrl =
      'http://localhost:9199/v0/b/idealbeauty-dev.appspot.com/o/products%2F1712345678-dress.jpg?alt=media';
    expect(getOptimizedImageUrl(emulatorRawUrl, 512)).toBe(
      'http://localhost:9199/v0/b/idealbeauty-dev.appspot.com/o/products%2F1712345678-dress-512w.webp?alt=media'
    );
  });

  it('preserves external 3rd-party URLs without alteration', () => {
    const externalUrl = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000';
    expect(getOptimizedImageUrl(externalUrl, 256)).toBe(externalUrl);
    expect(getOptimizedImageUrl(externalUrl, 512)).toBe(externalUrl);
  });

  it('returns clean original URL when targetSize is "original"', () => {
    const localUrl = '/uploads/1712345678-dress.jpg';
    expect(getOptimizedImageUrl(localUrl, 'original')).toBe(localUrl);
  });

  it('generates a valid srcSet string across target resolutions', () => {
    const localUrl = '/uploads/1712345678-dress-1024w.webp';
    const srcSet = getImageSrcSet(localUrl);

    expect(srcSet).toContain('/uploads/1712345678-dress-256w.webp 256w');
    expect(srcSet).toContain('/uploads/1712345678-dress-512w.webp 512w');
    expect(srcSet).toContain('/uploads/1712345678-dress-768w.webp 768w');
    expect(srcSet).toContain('/uploads/1712345678-dress-1024w.webp 1024w');
  });

  it('returns empty string for srcSet when url is empty or null', () => {
    expect(getImageSrcSet(null)).toBe('');
    expect(getImageSrcSet('')).toBe('');
  });

  it('generates dynamic srcSet for arbitrary custom widths', () => {
    const url = '/uploads/sample-dress-1024w.webp';
    const srcSet = getDynamicSrcSet(url, [300, 600, 1000]);
    expect(srcSet).toContain('/uploads/sample-dress-512w.webp 300w');
    expect(srcSet).toContain('/uploads/sample-dress-768w.webp 600w');
    expect(srcSet).toContain('/uploads/sample-dress-1024w.webp 1000w');

    expect(getDynamicSrcSet(null)).toBe('');
    expect(getDynamicSrcSet('')).toBe('');
  });

  it('generates LQIP (low-quality image placeholder) URL', () => {
    const url = '/uploads/sample-dress-1024w.webp';
    expect(getLQIPUrl(url)).toBe('/uploads/sample-dress-256w.webp');
    expect(getLQIPUrl(null)).toBe(DEFAULT_PRODUCT_FALLBACK);
  });

  it('generates base64 blur and shimmer data URLs', () => {
    const blurDataUrl = getBlurDataURL('#e5e7eb');
    expect(blurDataUrl).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(DEFAULT_BLUR_DATA_URL).toMatch(/^data:image\/svg\+xml;base64,/);

    const shimmerUrl = getShimmerPlaceholder(600, 400);
    expect(shimmerUrl).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('generates responsive image props object for Image components', () => {
    const url = '/uploads/sample-dress-1024w.webp';
    const props = getResponsiveImageProps(url, {
      sizes: '(max-width: 768px) 100vw, 50vw',
      defaultSize: 512,
    });

    expect(props.src).toBe('/uploads/sample-dress-512w.webp');
    expect(props.srcSet).toContain('/uploads/sample-dress-256w.webp 256w');
    expect(props.sizes).toBe('(max-width: 768px) 100vw, 50vw');
    expect(props.placeholder).toBe('blur');
    expect(props.blurDataURL).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});
