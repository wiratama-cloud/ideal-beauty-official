import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { firebaseAdminStorage } from '../firebase/admin';
import { getDownloadURL } from 'firebase-admin/storage';
import { ImageProcessingResult, getBaseFileNameWithoutExt } from './image-processor';
import { ImageUrlsMap, StoredImageVariantsResult } from './local-storage';

function getStorageBucketName(): string | undefined {
  return process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.avif':
      return 'image/avif';
    case '.json':
      return 'application/json';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

export function isFirebaseStorageConfigured(): boolean {
  const bucketName = getStorageBucketName();
  return Boolean(firebaseAdminStorage && bucketName);
}

export async function uploadFileToFirebase(
  buffer: Buffer,
  fileName: string,
  folder: string = 'uploads',
  contentType: string = 'image/jpeg',
  metadata?: Record<string, any>
): Promise<string> {
  const bucketName = getStorageBucketName();
  if (!firebaseAdminStorage || !bucketName) {
    throw new Error('Firebase Storage not configured');
  }

  const bucket = firebaseAdminStorage.bucket(bucketName);
  const cleanFolder = folder ? folder.replace(/^\/+|\/+$/g, '') : '';
  const filePath = cleanFolder ? `${cleanFolder}/${fileName}` : fileName;
  const file = bucket.file(filePath);

  await file.save(buffer, {
    metadata: {
      contentType,
      ...metadata,
    },
  });

  const downloadUrl = await getDownloadURL(file);
  return downloadUrl;
}

export async function uploadLocalFileToFirebase(
  localFilePath: string,
  folder: string = 'uploads',
  fileName?: string
): Promise<string> {
  const resolvedPath = path.isAbsolute(localFilePath)
    ? localFilePath
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), localFilePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const buffer = await fs.promises.readFile(resolvedPath);
  const resolvedFileName = fileName || path.basename(resolvedPath);
  const contentType = getMimeType(resolvedPath);

  return uploadFileToFirebase(buffer, resolvedFileName, folder, contentType);
}

export async function syncSeedImagesToFirebase(): Promise<Record<string, string>> {
  if (!isFirebaseStorageConfigured()) {
    throw new Error('Firebase Storage not configured');
  }

  const publicDir = path.resolve(process.cwd(), 'public');
  const imagesDir = path.join(publicDir, 'images');

  if (!fs.existsSync(imagesDir)) {
    return {};
  }

  const bucketName = getStorageBucketName();
  const bucket = firebaseAdminStorage && bucketName ? firebaseAdminStorage.bucket(bucketName) : null;

  interface FileEntry {
    fullPath: string;
    folder: string;
    fileName: string;
    localPathKey: string;
  }

  const fileEntries: FileEntry[] = [];

  async function collectFiles(currentDir: string) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await collectFiles(fullPath);
        } else if (entry.isFile()) {
          const relFromImages = path.relative(imagesDir, fullPath);
          const relDir = path.dirname(relFromImages);
          const folder = relDir === '.' ? 'images' : relDir.replace(/\\/g, '/');
          const fileName = entry.name;
          const localPathKey = '/' + path.relative(publicDir, fullPath).replace(/\\/g, '/');
          fileEntries.push({ fullPath, folder, fileName, localPathKey });
        }
      })
    );
  }

  await collectFiles(imagesDir);

  const imageMap: Record<string, string> = {};

  // Process files in parallel batches with existence checks
  const CONCURRENCY = 20;
  for (let i = 0; i < fileEntries.length; i += CONCURRENCY) {
    const batch = fileEntries.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ({ fullPath, folder, fileName, localPathKey }) => {
        let downloadUrl: string;
        const cleanFolder = folder ? folder.replace(/^\/+|\/+$/g, '') : '';
        const filePath = cleanFolder ? `${cleanFolder}/${fileName}` : fileName;
        const file = bucket ? bucket.file(filePath) : null;

        let exists = false;
        if (file && typeof (file as any).exists === 'function') {
          try {
            const [fileExisted] = await file.exists();
            exists = Boolean(fileExisted);
          } catch {
            exists = false;
          }
        }

        if (exists && file) {
          downloadUrl = await getDownloadURL(file);
        } else {
          downloadUrl = await uploadLocalFileToFirebase(fullPath, folder, fileName);
        }

        imageMap[localPathKey] = downloadUrl;
      })
    );
  }

  return imageMap;
}

export async function deleteFileFromFirebase(fileName: string, folder: string = 'uploads') {
  const bucketName = getStorageBucketName();
  if (!firebaseAdminStorage || !bucketName) {
    throw new Error('Firebase Storage not configured');
  }

  const bucket = firebaseAdminStorage.bucket(bucketName);
  const cleanFolder = folder ? folder.replace(/^\/+|\/+$/g, '') : '';
  const filePath = cleanFolder ? `${cleanFolder}/${fileName}` : fileName;
  const file = bucket.file(filePath);

  await file.delete();
}

/**
 * Uploads original image buffer and all generated variants to Firebase Storage.
 */
export async function uploadImageVariantsToFirebase(
  processingResult: ImageProcessingResult,
  folder: string = 'uploads',
  metadata?: Record<string, any>
): Promise<StoredImageVariantsResult> {
  if (!isFirebaseStorageConfigured()) {
    throw new Error('Firebase Storage not configured');
  }

  const downloadToken = crypto.randomUUID();
  const sharedMetadata = {
    ...metadata,
    metadata: {
      firebaseStorageDownloadTokens: downloadToken,
      ...(metadata?.metadata || {}),
    },
  };

  // Upload original file
  const originalUrl = await uploadFileToFirebase(
    processingResult.originalBuffer,
    processingResult.originalFileName,
    folder,
    processingResult.originalContentType,
    sharedMetadata
  );

  const urls: ImageUrlsMap = {
    original: originalUrl,
    '256': '',
    '512': '',
    '768': '',
    '1024': '',
  };

  // Upload variants in parallel
  await Promise.all(
    processingResult.variants.map(async (variant) => {
      const variantUrl = await uploadFileToFirebase(
        variant.buffer,
        variant.fileName,
        folder,
        variant.contentType,
        sharedMetadata
      );
      urls[String(variant.resolution)] = variantUrl;
    })
  );

  const defaultUrl = urls['1024'] || originalUrl;

  return {
    url: defaultUrl,
    urls,
  };
}

/**
 * Deletes all image variants and original file for a given filename or path in Firebase Storage.
 */
export async function deleteImageVariantsFromFirebase(
  fileNameOrPath: string,
  folder: string = 'uploads'
): Promise<void> {
  if (!isFirebaseStorageConfigured()) {
    throw new Error('Firebase Storage not configured');
  }

  const fileName = path.basename(fileNameOrPath);
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
      try {
        await deleteFileFromFirebase(file, folder);
      } catch {
        // Ignore file not found or deletion failure for individual variants
      }
    })
  );
}
