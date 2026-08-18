import { IMAGE_RESOLUTIONS, ImageResolution } from '../services/image-processor';

export const DEFAULT_PRODUCT_FALLBACK = '/images/products/default-product.jpg';

/**
 * Checks if a given URL is a Firebase Storage URL.
 */
function isFirebaseUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com');
}

/**
 * Returns an optimized image URL for a given target resolution variant.
 * Supports local storage paths (/uploads/, /images/) and Firebase Cloud Storage URLs,
 * with graceful fallback for external and legacy URLs.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  targetSize: ImageResolution | 'original' = 1024,
  fallbackUrl: string = DEFAULT_PRODUCT_FALLBACK
): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallbackUrl;
  }

  const cleanUrl = url.trim();

  // If original is requested, return clean URL as-is
  if (targetSize === 'original') {
    return cleanUrl;
  }

  // Handle Firebase Storage URLs
  if (isFirebaseUrl(cleanUrl)) {
    // If it already has a resolution variant suffix (e.g. -1024w.webp or %2D1024w.webp)
    if (/-\d+w\.webp/i.test(cleanUrl)) {
      return cleanUrl.replace(/-\d+w\.webp/i, `-${targetSize}w.webp`);
    }
    if (/%2D\d+w\.webp/i.test(cleanUrl)) {
      return cleanUrl.replace(/%2D\d+w\.webp/i, `%2D${targetSize}w.webp`);
    }

    // If it's a raw uncompressed file in Firebase, replace extension in the path before query params
    return cleanUrl.replace(/(\.[a-zA-Z0-9]+)(\?|$)/, `-${targetSize}w.webp$2`);
  }

  // External URLs (non-Firebase absolute URLs like https://images.unsplash.com or https://lh3.googleusercontent.com)
  if (/^https?:\/\//i.test(cleanUrl)) {
    return cleanUrl;
  }

  // Local uploads and images (/uploads/... or /images/...)
  if (cleanUrl.startsWith('/uploads/') || cleanUrl.startsWith('/images/')) {
    // If it already has a resolution variant suffix
    if (/-\d+w\.webp$/i.test(cleanUrl)) {
      return cleanUrl.replace(/-\d+w\.webp$/i, `-${targetSize}w.webp`);
    }

    // Replace extension with target resolution WebP variant
    return cleanUrl.replace(/\.[a-zA-Z0-9]+$/i, `-${targetSize}w.webp`);
  }

  return cleanUrl;
}

/**
 * Constructs a responsive srcSet string for an image URL across specified resolutions.
 */
export function getImageSrcSet(
  url: string | null | undefined,
  sizes: readonly ImageResolution[] = IMAGE_RESOLUTIONS
): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '';
  }

  return sizes
    .map((size) => `${getOptimizedImageUrl(url, size)} ${size}w`)
    .join(', ');
}
