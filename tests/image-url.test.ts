import { describe, it, expect } from 'vitest';
import { getOptimizedImageUrl, getImageSrcSet, DEFAULT_PRODUCT_FALLBACK } from '@/lib/utils/image-url';

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
});
