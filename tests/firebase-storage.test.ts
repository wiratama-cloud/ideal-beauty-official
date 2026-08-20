import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

const mockSave = vi.fn();
const mockDelete = vi.fn();
const mockBucket = vi.fn();
const mockGetDownloadURL = vi.fn();

vi.mock('@/lib/firebase/admin', () => ({
  firebaseAdminStorage: {
    bucket: (...args: any[]) => mockBucket(...args),
  },
}));

vi.mock('firebase-admin/storage', () => ({
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args),
}));

describe('Firebase Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-bucket.appspot.com';
    delete process.env.FIREBASE_STORAGE_BUCKET;

    mockSave.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockGetDownloadURL.mockImplementation(async (fileObj: any) => {
      return `https://firebasestorage.googleapis.com/v0/b/test-bucket.appspot.com/o/${encodeURIComponent(fileObj.name)}?alt=media`;
    });
    mockBucket.mockImplementation((bucketName: string) => ({
      file: (fileName: string) => ({
        name: fileName,
        save: mockSave,
        delete: mockDelete,
      }),
    }));
  });

  it('isFirebaseStorageConfigured returns true when bucket is set and storage client exists', async () => {
    const { isFirebaseStorageConfigured } = await import('@/lib/services/firebase-storage');
    expect(isFirebaseStorageConfigured()).toBe(true);
  });

  it('isFirebaseStorageConfigured returns false when bucket is not set', async () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    delete process.env.FIREBASE_STORAGE_BUCKET;
    const { isFirebaseStorageConfigured } = await import('@/lib/services/firebase-storage');
    expect(isFirebaseStorageConfigured()).toBe(false);
  });

  it('uploadFileToFirebase uploads buffer with custom folder, contentType and metadata', async () => {
    const { uploadFileToFirebase } = await import('@/lib/services/firebase-storage');
    const buffer = Buffer.from('test image content');
    const url = await uploadFileToFirebase(buffer, 'test.jpg', 'products', 'image/jpeg', {
      customMeta: '123',
    });

    expect(mockBucket).toHaveBeenCalledWith('test-bucket.appspot.com');
    expect(mockSave).toHaveBeenCalledWith(buffer, {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000, immutable',
        customMeta: '123',
      },
    });
    expect(url).toContain('products%2Ftest.jpg');
  });

  it('uploadLocalFileToFirebase reads local file and uploads it with correct content type', async () => {
    const { uploadLocalFileToFirebase } = await import('@/lib/services/firebase-storage');
    const localPath = 'public/images/hero/hero-banner.jpg';

    const url = await uploadLocalFileToFirebase(localPath, 'hero');

    expect(mockBucket).toHaveBeenCalledWith('test-bucket.appspot.com');
    expect(mockSave).toHaveBeenCalledWith(expect.any(Buffer), {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });
    expect(url).toContain('hero%2Fhero-banner.jpg');
  });

  it('uploadLocalFileToFirebase throws error if local file does not exist', async () => {
    const { uploadLocalFileToFirebase } = await import('@/lib/services/firebase-storage');
    await expect(uploadLocalFileToFirebase('public/images/non-existent-file.jpg', 'products')).rejects.toThrow('File not found');
  });

  it('syncSeedImagesToFirebase scans public/images and returns a mapping of local path to download URL', async () => {
    const { syncSeedImagesToFirebase } = await import('@/lib/services/firebase-storage');
    const result = await syncSeedImagesToFirebase();

    expect(typeof result).toBe('object');
    expect(result['/images/hero/hero-banner.jpg']).toBeDefined();
    expect(result['/images/products/kaftan-1.jpg']).toBeDefined();
    expect(result['/images/sections/brand-atelier.jpg']).toBeDefined();
    expect(result['/images/hero/hero-banner.jpg']).toContain('hero-banner.jpg');
  });

  it('syncSeedImagesToFirebase skips upload when remote files already exist', async () => {
    mockBucket.mockImplementation((bucketName: string) => ({
      file: (fileName: string) => ({
        name: fileName,
        exists: vi.fn().mockResolvedValue([true]),
        save: mockSave,
        delete: mockDelete,
      }),
    }));

    const { syncSeedImagesToFirebase } = await import('@/lib/services/firebase-storage');
    const result = await syncSeedImagesToFirebase();

    expect(typeof result).toBe('object');
    expect(result['/images/hero/hero-banner.jpg']).toBeDefined();
    // mockSave should not have been called because all files already existed
    expect(mockSave).not.toHaveBeenCalled();
    expect(mockGetDownloadURL).toHaveBeenCalled();
  });

  it('deleteFileFromFirebase calls bucket file delete', async () => {
    const { deleteFileFromFirebase } = await import('@/lib/services/firebase-storage');
    await deleteFileFromFirebase('test.jpg', 'products');

    expect(mockBucket).toHaveBeenCalledWith('test-bucket.appspot.com');
    expect(mockDelete).toHaveBeenCalled();
  });

  it('uploadImageVariantsToFirebase uploads original and all 4 variants', async () => {
    const { uploadImageVariantsToFirebase } = await import('@/lib/services/firebase-storage');
    const dummyProcessingResult = {
      originalFileName: 'hero-banner.jpg',
      originalBuffer: Buffer.from('original data'),
      originalContentType: 'image/jpeg',
      metadata: { originalWidth: 1200, originalHeight: 800, format: 'jpeg' },
      variants: [
        {
          resolution: 256 as const,
          width: 256,
          height: 171,
          buffer: Buffer.from('v256'),
          contentType: 'image/webp' as const,
          fileName: 'hero-banner-256w.webp',
        },
        {
          resolution: 512 as const,
          width: 512,
          height: 341,
          buffer: Buffer.from('v512'),
          contentType: 'image/webp' as const,
          fileName: 'hero-banner-512w.webp',
        },
        {
          resolution: 768 as const,
          width: 768,
          height: 512,
          buffer: Buffer.from('v768'),
          contentType: 'image/webp' as const,
          fileName: 'hero-banner-768w.webp',
        },
        {
          resolution: 1024 as const,
          width: 1024,
          height: 683,
          buffer: Buffer.from('v1024'),
          contentType: 'image/webp' as const,
          fileName: 'hero-banner-1024w.webp',
        },
      ],
    };

    const result = await uploadImageVariantsToFirebase(dummyProcessingResult, 'hero');

    expect(result.url).toContain('hero%2Fhero-banner-1024w.webp');
    expect(result.urls.original).toContain('hero%2Fhero-banner.jpg');
    expect(result.urls['256']).toContain('hero%2Fhero-banner-256w.webp');
    expect(result.urls['512']).toContain('hero%2Fhero-banner-512w.webp');
    expect(result.urls['768']).toContain('hero%2Fhero-banner-768w.webp');
    expect(result.urls['1024']).toContain('hero%2Fhero-banner-1024w.webp');

    // 1 original + 4 variants = 5 saves
    expect(mockSave).toHaveBeenCalledTimes(5);

    // Verify all 5 saves share the exact same firebaseStorageDownloadTokens
    const savedTokens: string[] = [];
    for (const call of mockSave.mock.calls) {
      savedTokens.push(call[1]?.metadata?.metadata?.firebaseStorageDownloadTokens);
    }
    expect(savedTokens).toHaveLength(5);
    expect(savedTokens[0]).toBeDefined();
    expect(typeof savedTokens[0]).toBe('string');
    expect(new Set(savedTokens).size).toBe(1);
  });

  it('deleteImageVariantsFromFirebase attempts deletion of all variants and original', async () => {
    const { deleteImageVariantsFromFirebase } = await import('@/lib/services/firebase-storage');
    await deleteImageVariantsFromFirebase('products/kaftan-1024w.webp', 'products');

    expect(mockDelete).toHaveBeenCalled();
  });
});
