import sharp from 'sharp';
import path from 'path';
import { isFirebaseStorageConfigured, uploadImageVariantsToFirebase } from './firebase-storage';
import { saveImageVariantsToLocal, StoredImageVariantsResult, ImageUrlsMap } from './local-storage';
import { IMAGE_RESOLUTIONS, ImageResolution } from '../utils/image-url';

export { IMAGE_RESOLUTIONS };
export type { ImageResolution };

export interface ProcessedVariant {
  resolution: ImageResolution;
  width: number;
  height: number;
  buffer: Buffer;
  contentType: 'image/webp';
  fileName: string;
}

export interface ImageProcessingResult {
  originalFileName: string;
  originalBuffer: Buffer;
  originalContentType: string;
  metadata: {
    originalWidth?: number;
    originalHeight?: number;
    format?: string;
  };
  variants: ProcessedVariant[];
}

export interface ImageProcessOptions {
  quality?: number;
  effort?: number;
  resolutions?: readonly ImageResolution[];
}

export interface ProcessAndStoreResult extends StoredImageVariantsResult {
  metadata: {
    originalWidth?: number;
    originalHeight?: number;
    format?: string;
  };
}

/**
 * Extracts base filename without extension or resolution suffix.
 * e.g. "photo-1024w.webp" -> "photo", "product.jpg" -> "product"
 */
export function getBaseFileNameWithoutExt(fileName: string): string {
  const parsed = path.parse(fileName);
  return parsed.name.replace(/-(\d+)w$/i, '');
}

/**
 * Generates deterministic variant file name.
 * e.g. ("photo.jpg", 256) -> "photo-256w.webp"
 */
export function getVariantFileName(fileName: string, resolution: ImageResolution): string {
  const baseName = getBaseFileNameWithoutExt(fileName);
  return `${baseName}-${resolution}w.webp`;
}

/**
 * Processes an input image buffer and creates optimized WebP variants
 * at 256w, 512w, 768w, and 1024w while preserving aspect ratio.
 */
export async function processImageVariants(
  inputBuffer: Buffer,
  originalFileName: string,
  originalContentType?: string,
  options?: ImageProcessOptions
): Promise<ImageProcessingResult> {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();

  if (!metadata.format) {
    throw new Error('Unsupported or invalid image format');
  }

  const quality = options?.quality ?? 82;
  const effort = options?.effort ?? 4;
  const resolutions = options?.resolutions ?? IMAGE_RESOLUTIONS;

  const variants: ProcessedVariant[] = await Promise.all(
    resolutions.map(async (resolution) => {
      const resized = sharp(inputBuffer)
        .rotate()
        .resize({
          width: resolution,
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({
          quality,
          effort,
        });

      const buffer = await resized.toBuffer();
      const variantMetadata = await sharp(buffer).metadata();

      return {
        resolution,
        width: variantMetadata.width || resolution,
        height: variantMetadata.height || resolution,
        buffer,
        contentType: 'image/webp' as const,
        fileName: getVariantFileName(originalFileName, resolution),
      };
    })
  );

  const detectedContentType =
    originalContentType || (metadata.format ? `image/${metadata.format}` : 'application/octet-stream');

  return {
    originalFileName,
    originalBuffer: inputBuffer,
    originalContentType: detectedContentType,
    metadata: {
      originalWidth: metadata.width,
      originalHeight: metadata.height,
      format: metadata.format,
    },
    variants,
  };
}

/**
 * Helper to process and store image variants either in Firebase Storage
 * or falling back to local public/uploads directory.
 */
export async function processAndStoreImageVariants(
  inputBuffer: Buffer,
  fileName: string,
  contentType?: string,
  options?: ImageProcessOptions & { folder?: string }
): Promise<ProcessAndStoreResult> {
  const processingResult = await processImageVariants(inputBuffer, fileName, contentType, options);
  const folder = options?.folder || 'products';

  let storedResult: StoredImageVariantsResult;

  if (isFirebaseStorageConfigured()) {
    storedResult = await uploadImageVariantsToFirebase(processingResult, folder);
  } else {
    // For local storage, if folder is 'products', save to 'uploads' (or the specified folder)
    const subDir = folder === 'products' ? 'uploads' : (folder || 'uploads');
    storedResult = await saveImageVariantsToLocal(processingResult, subDir);
  }

  return {
    url: storedResult.url,
    urls: storedResult.urls,
    metadata: processingResult.metadata,
  };
}
