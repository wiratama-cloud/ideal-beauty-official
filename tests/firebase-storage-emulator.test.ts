import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import sharp from 'sharp';
import {
  uploadImageVariantsToFirebase,
  deleteImageVariantsFromFirebase,
  getStorageBucketName,
  isFirebaseStorageConfigured,
} from '@/lib/services/firebase-storage';
import { processAndStoreImageVariants, processImageVariants } from '@/lib/services/image-processor';

const { mockFileSave, mockFileDelete, mockGetDownloadURL } = vi.hoisted(() => ({
  mockFileSave: vi.fn().mockResolvedValue(undefined),
  mockFileDelete: vi.fn().mockResolvedValue(undefined),
  mockGetDownloadURL: vi.fn().mockImplementation(async (file: any) => {
    const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    if (emulatorHost) {
      return `http://${emulatorHost}/v0/b/${file.bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`;
    }
    return `https://firebasestorage.googleapis.com/v0/b/${file.bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`;
  }),
}));

vi.mock('firebase-admin/storage', () => ({
  getStorage: vi.fn().mockReturnValue({
    bucket: vi.fn().mockImplementation((bucketName: string) => ({
      name: bucketName || 'idealbeauty-dev.appspot.com',
      file: vi.fn().mockImplementation((fileName: string) => ({
        name: fileName,
        bucket: { name: bucketName || 'idealbeauty-dev.appspot.com' },
        save: mockFileSave,
        delete: mockFileDelete,
      })),
    })),
  }),
  getDownloadURL: (file: any) => mockGetDownloadURL(file),
}));

vi.mock('@/lib/firebase/admin', () => ({
  firebaseAdmin: {},
  firebaseAdminStorage: {
    bucket: vi.fn().mockImplementation((bucketName: string) => ({
      name: bucketName || 'idealbeauty-dev.appspot.com',
      file: vi.fn().mockImplementation((fileName: string) => ({
        name: fileName,
        bucket: { name: bucketName || 'idealbeauty-dev.appspot.com' },
        save: mockFileSave,
        delete: mockFileDelete,
      })),
    })),
  },
}));

describe('Firebase Storage Emulator Service', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
    process.env.FIREBASE_PROJECT_ID = 'idealbeauty-dev';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'idealbeauty-dev.appspot.com';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('detects storage bucket name from emulator host and project id if bucket is not explicit', () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    delete process.env.FIREBASE_STORAGE_BUCKET;
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
    process.env.FIREBASE_PROJECT_ID = 'idealbeauty-dev';

    expect(getStorageBucketName()).toBe('idealbeauty-dev.appspot.com');
  });

  it('returns true for isFirebaseStorageConfigured when emulator is configured', () => {
    expect(isFirebaseStorageConfigured()).toBe(true);
  });

  it('uploads all variants to the emulator bucket and returns emulator download URLs', async () => {
    const testBuffer = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: { r: 200, g: 150, b: 100 },
      },
    })
      .jpeg()
      .toBuffer();

    const processingResult = await processImageVariants(testBuffer, 'couture-gown.jpg', 'image/jpeg');
    const stored = await uploadImageVariantsToFirebase(processingResult, 'products');

    // 4 variants + 1 original = 5 save calls
    expect(mockFileSave).toHaveBeenCalledTimes(5);
    expect(mockGetDownloadURL).toHaveBeenCalledTimes(5);

    expect(stored.url).toContain('127.0.0.1:9199');
    expect(stored.urls['1024']).toContain('127.0.0.1:9199');
    expect(stored.urls['768']).toContain('127.0.0.1:9199');
    expect(stored.urls['512']).toContain('127.0.0.1:9199');
    expect(stored.urls['256']).toContain('127.0.0.1:9199');
    expect(stored.urls['original']).toContain('127.0.0.1:9199');
  });

  it('processAndStoreImageVariants directly stores into Firebase Storage Emulator', async () => {
    const testBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await processAndStoreImageVariants(testBuffer, 'silk-sari.jpg', 'image/jpeg', {
      folder: 'products',
    });

    expect(result.url).toBeDefined();
    expect(result.urls['1024']).toBeDefined();
    expect(result.metadata.originalWidth).toBe(800);
    expect(result.metadata.originalHeight).toBe(600);
    expect(mockFileSave).toHaveBeenCalled();
  });

  it('deletes all variants and original from Firebase Storage Emulator', async () => {
    const emulatorUrl =
      'http://127.0.0.1:9199/v0/b/idealbeauty-dev.appspot.com/o/products%2F1712345678-couture-gown-1024w.webp?alt=media';

    await deleteImageVariantsFromFirebase(emulatorUrl);

    // Should delete 4 variants + 1 original = 5 delete calls
    expect(mockFileDelete).toHaveBeenCalledTimes(5);
  });
});
