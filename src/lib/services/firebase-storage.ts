import fs from 'fs';
import path from 'path';
import { firebaseAdminStorage } from '../firebase/admin';
import { getDownloadURL } from 'firebase-admin/storage';

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

  const imageMap: Record<string, string> = {};

  async function walkDir(currentDir: string) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walkDir(fullPath);
      } else if (entry.isFile()) {
        const relFromImages = path.relative(imagesDir, fullPath);
        const relDir = path.dirname(relFromImages);
        const folder = relDir === '.' ? 'images' : relDir.replace(/\\/g, '/');
        const fileName = entry.name;

        const localPathKey = '/' + path.relative(publicDir, fullPath).replace(/\\/g, '/');
        const downloadUrl = await uploadLocalFileToFirebase(fullPath, folder, fileName);
        imageMap[localPathKey] = downloadUrl;
      }
    }
  }

  await walkDir(imagesDir);
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
