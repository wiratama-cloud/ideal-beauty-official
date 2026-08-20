import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setStorageCacheHeaders, DEFAULT_CACHE_CONTROL } from '../scripts/set-storage-cache-headers';

const mockGetMetadata = vi.fn();
const mockSetMetadata = vi.fn();
const mockGetFiles = vi.fn();
const mockBucket = vi.fn();

vi.mock('@/lib/firebase/admin', () => ({
  firebaseAdminStorage: {
    bucket: (...args: any[]) => mockBucket(...args),
  },
}));

vi.mock('../src/lib/firebase/admin', () => ({
  firebaseAdminStorage: {
    bucket: (...args: any[]) => mockBucket(...args),
  },
}));

describe('setStorageCacheHeaders Migration Script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-bucket.appspot.com';

    mockBucket.mockImplementation((bucketName: string) => ({
      name: bucketName,
      getFiles: mockGetFiles,
    }));
  });

  it('updates cacheControl on files missing immutable header', async () => {
    const mockFile1Set = vi.fn().mockResolvedValue([{}]);
    const mockFile2Set = vi.fn().mockResolvedValue([{}]);

    const mockFile1 = {
      name: 'products/kaftan.jpg',
      getMetadata: vi.fn().mockResolvedValue([{ cacheControl: 'public, max-age=3600' }]),
      setMetadata: mockFile1Set,
    };
    const mockFile2 = {
      name: 'products/lehenga.jpg',
      getMetadata: vi.fn().mockResolvedValue([{ cacheControl: DEFAULT_CACHE_CONTROL }]),
      setMetadata: mockFile2Set,
    };

    mockGetFiles.mockResolvedValue([[mockFile1, mockFile2]]);

    const stats = await setStorageCacheHeaders({ verbose: false });

    expect(stats.scanned).toBe(2);
    expect(stats.updated).toBe(1);
    expect(stats.skipped).toBe(1);
    expect(stats.errors).toHaveLength(0);
    expect(mockFile1Set).toHaveBeenCalledWith({
      cacheControl: DEFAULT_CACHE_CONTROL,
    });
    expect(mockFile2Set).not.toHaveBeenCalled();
  });

  it('forces update on all files when force=true', async () => {
    const mockFile = {
      name: 'hero/banner.jpg',
      getMetadata: vi.fn().mockResolvedValue([{ cacheControl: DEFAULT_CACHE_CONTROL }]),
      setMetadata: mockSetMetadata.mockResolvedValue([{}]),
    };

    mockGetFiles.mockResolvedValue([[mockFile]]);

    const stats = await setStorageCacheHeaders({ force: true, verbose: false });

    expect(stats.scanned).toBe(1);
    expect(stats.updated).toBe(1);
    expect(stats.skipped).toBe(0);
    expect(mockFile.setMetadata).toHaveBeenCalledWith({
      cacheControl: DEFAULT_CACHE_CONTROL,
    });
  });

  it('captures errors gracefully without throwing when individual file update fails', async () => {
    const mockFile = {
      name: 'error.jpg',
      getMetadata: vi.fn().mockRejectedValue(new Error('Permission denied')),
      setMetadata: mockSetMetadata,
    };

    mockGetFiles.mockResolvedValue([[mockFile]]);

    const stats = await setStorageCacheHeaders({ verbose: false });

    expect(stats.scanned).toBe(1);
    expect(stats.updated).toBe(0);
    expect(stats.errors).toHaveLength(1);
    expect(stats.errors[0].file).toBe('error.jpg');
    expect(stats.errors[0].error).toContain('Permission denied');
  });
});
