export const IMAGE_RESOLUTIONS = [256, 512, 768, 1024] as const;
export type ImageResolution = typeof IMAGE_RESOLUTIONS[number];

export const DEFAULT_PRODUCT_FALLBACK = '/images/products/default-product.jpg';

/**
 * Checks if a given URL is a Firebase Storage or Firebase Storage Emulator URL.
 */
function isFirebaseUrl(url: string): boolean {
  return (
    url.includes('firebasestorage.googleapis.com') ||
    url.includes('storage.googleapis.com') ||
    url.includes('/v0/b/') ||
    url.includes(':9199')
  );
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

/**
 * Constructs a dynamic srcSet string for arbitrary custom image widths.
 */
export function getDynamicSrcSet(
  url: string | null | undefined,
  widths: readonly number[] = [256, 512, 768, 1024],
  fallbackUrl: string = DEFAULT_PRODUCT_FALLBACK
): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '';
  }

  return widths
    .map((width) => {
      const targetRes = IMAGE_RESOLUTIONS.find((res) => res >= width) ?? 1024;
      return `${getOptimizedImageUrl(url, targetRes, fallbackUrl)} ${width}w`;
    })
    .join(', ');
}

/**
 * Returns a Low-Quality Image Placeholder (LQIP) URL using the smallest resolution.
 */
export function getLQIPUrl(
  url: string | null | undefined,
  fallbackUrl: string = DEFAULT_PRODUCT_FALLBACK
): string {
  return getOptimizedImageUrl(url, 256, fallbackUrl);
}

/**
 * Static Base64-encoded SVG blur placeholder data URL.
 * Defined as a literal constant to prevent module-initialization or runtime bundling issues in browser contexts.
 */
export const DEFAULT_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDUiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiNmM2Y0ZjYiLz48cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI1IiBmaWxsPSJyZ2JhKDIxNywxMTksNiwwLjA1KSIvPjwvc3ZnPg==';

export const DEFAULT_SHIMMER_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PHJlY3Qgd2lkdGg9IjcwMCIgaGVpZ2h0PSI0NzUiIGZpbGw9IiNmNmY3ZjgiIC8+PC9zdmc+';

/**
 * Generates a base64 encoded SVG blur placeholder data URL for Next.js Image or lazy image loading.
 */
export function getBlurDataURL(color: string = '#f3f4f6'): string {
  if (!color || color === '#f3f4f6') {
    return DEFAULT_BLUR_DATA_URL;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 5"><rect width="8" height="5" fill="${color}"/><rect width="8" height="5" fill="rgba(217,119,6,0.05)"/></svg>`;
  try {
    if (typeof Buffer !== 'undefined') {
      return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    }
    if (typeof btoa !== 'undefined') {
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    }
  } catch {
    // fallback
  }
  return DEFAULT_BLUR_DATA_URL;
}

/**
 * Generates an animated shimmer placeholder SVG data URL.
 */
export function getShimmerPlaceholder(width: number = 700, height: number = 475): string {
  const svg = `<svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="20%" />
      <stop stop-color="#edeef1" offset="50%" />
      <stop stop-color="#f6f7f8" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="#f6f7f8" />
  <rect id="r" width="${width}" height="${height}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${width}" to="${width}" dur="1s" repeatCount="indefinite" />
</svg>`;
  try {
    if (typeof Buffer !== 'undefined') {
      return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    }
    if (typeof btoa !== 'undefined') {
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    }
  } catch {
    // fallback
  }
  return DEFAULT_SHIMMER_DATA_URL;
}

/**
 * Helper to build standard responsive props for Next.js Image or standard <img> elements.
 */
export function getResponsiveImageProps(
  url: string | null | undefined,
  options?: {
    sizes?: string;
    defaultSize?: ImageResolution;
    fallbackUrl?: string;
    widths?: readonly ImageResolution[];
  }
) {
  const fallback = options?.fallbackUrl ?? DEFAULT_PRODUCT_FALLBACK;
  const defaultSize = options?.defaultSize ?? 1024;
  const widths = options?.widths ?? IMAGE_RESOLUTIONS;

  const src = getOptimizedImageUrl(url, defaultSize, fallback);
  const srcSet = getImageSrcSet(url, widths);

  return {
    src,
    srcSet: srcSet || undefined,
    sizes: options?.sizes,
    blurDataURL: getBlurDataURL(),
    placeholder: 'blur' as const,
  };
}
