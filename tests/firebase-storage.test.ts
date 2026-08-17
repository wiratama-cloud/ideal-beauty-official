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

  it('deleteFileFromFirebase calls bucket file delete', async () => {
    const { deleteFileFromFirebase } = await import('@/lib/services/firebase-storage');
    await deleteFileFromFirebase('test.jpg', 'products');

    expect(mockBucket).toHaveBeenCalledWith('test-bucket.appspot.com');
    expect(mockDelete).toHaveBeenCalled();
  });
});
