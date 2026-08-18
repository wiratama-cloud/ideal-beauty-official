import fs from 'fs';
import path from 'path';
import { ImageProcessingResult, getBaseFileNameWithoutExt } from './image-processor';

export interface ImageUrlsMap {
  '256': string;
  '512': string;
  '768': string;
  '1024': string;
  original: string;
  [key: string]: string;
}

export interface StoredImageVariantsResult {
  url: string;
  urls: ImageUrlsMap;
}

/**
 * Saves a single buffer to local public directory.
 */
export async function saveFileToLocal(
  buffer: Buffer,
  fileName: string,
  subDir: string = 'uploads'
): Promise<string> {
  const publicDir = path.resolve(process.cwd(), 'public');
  const targetDir = path.join(publicDir, subDir);

  if (!fs.existsSync(targetDir)) {
    await fs.promises.mkdir(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, fileName);
  await fs.promises.writeFile(filePath, buffer);

  const cleanSubDir = subDir ? subDir.replace(/^\/+|\/+$/g, '') : '';
  return `/${cleanSubDir ? cleanSubDir + '/' : ''}${fileName}`;
}

/**
 * Saves original image buffer and all generated variants to local disk under public/[subDir].
 */
export async function saveImageVariantsToLocal(
  processingResult: ImageProcessingResult,
  subDir: string = 'uploads'
): Promise<StoredImageVariantsResult> {
  const publicDir = path.resolve(process.cwd(), 'public');
  const targetDir = path.join(publicDir, subDir);

  if (!fs.existsSync(targetDir)) {
    await fs.promises.mkdir(targetDir, { recursive: true });
  }

  const cleanSubDir = subDir ? subDir.replace(/^\/+|\/+$/g, '') : '';
  const prefix = cleanSubDir ? `/${cleanSubDir}` : '';

  // Save original file and all variants concurrently
  const originalPath = path.join(targetDir, processingResult.originalFileName);
  const originalUrl = `${prefix}/${processingResult.originalFileName}`;

  const urls: ImageUrlsMap = {
    original: originalUrl,
    '256': '',
    '512': '',
    '768': '',
    '1024': '',
  };

  const saveOriginalPromise = fs.promises.writeFile(originalPath, processingResult.originalBuffer);

  const saveVariantsPromises = processingResult.variants.map(async (variant) => {
    const variantPath = path.join(targetDir, variant.fileName);
    await fs.promises.writeFile(variantPath, variant.buffer);
    urls[String(variant.resolution)] = `${prefix}/${variant.fileName}`;
  });

  await Promise.all([saveOriginalPromise, ...saveVariantsPromises]);

  // Primary URL defaults to 1024w if available, otherwise original
  const defaultUrl = urls['1024'] || originalUrl;

  return {
    url: defaultUrl,
    urls,
  };
}

/**
 * Deletes all image variants and original file matching a given base/variant name from local disk.
 */
export async function deleteImageVariantsFromLocal(
  fileName: string,
  subDir: string = 'uploads'
): Promise<void> {
  const publicDir = path.resolve(process.cwd(), 'public');
  const targetDir = path.join(publicDir, subDir);

  if (!fs.existsSync(targetDir)) {
    return;
  }

  const baseName = getBaseFileNameWithoutExt(fileName);
  const ext = path.extname(fileName);

  const filesToDelete = [
    fileName,
    `${baseName}-256w.webp`,
    `${baseName}-512w.webp`,
    `${baseName}-768w.webp`,
    `${baseName}-1024w.webp`,
  ];

  if (ext) {
    filesToDelete.push(`${baseName}${ext}`);
  }

  const uniqueFiles = Array.from(new Set(filesToDelete));

  await Promise.allSettled(
    uniqueFiles.map(async (file) => {
      const filePath = path.join(targetDir, file);
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch {
        // Ignore errors if file is locked or missing
      }
    })
  );
}
