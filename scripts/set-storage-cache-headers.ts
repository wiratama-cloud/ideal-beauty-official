import { fileURLToPath } from 'url';
import {
  firebaseAdminStorage,
} from '../src/lib/firebase/admin';
import {
  getStorageBucketName,
  isFirebaseStorageConfigured,
} from '../src/lib/services/firebase-storage';

export const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export interface SetCacheHeadersStats {
  scanned: number;
  updated: number;
  skipped: number;
  errors: Array<{ file: string; error: string }>;
}

export interface SetCacheHeadersOptions {
  bucketName?: string;
  cacheControl?: string;
  force?: boolean;
  prefix?: string;
  batchSize?: number;
  verbose?: boolean;
}

/**
 * Batch applies immutable long-term Cache-Control headers to all files in the Firebase Storage bucket.
 */
export async function setStorageCacheHeaders(
  options: SetCacheHeadersOptions = {}
): Promise<SetCacheHeadersStats> {
  const cacheControlValue = options.cacheControl || DEFAULT_CACHE_CONTROL;
  const targetBucketName = options.bucketName || getStorageBucketName();

  if (!firebaseAdminStorage || !targetBucketName) {
    throw new Error('Firebase Storage is not configured. Please verify environment variables.');
  }

  const bucket = firebaseAdminStorage.bucket(targetBucketName);
  const prefix = options.prefix || '';
  const batchSize = options.batchSize || 25;
  const force = !!options.force;
  const verbose = options.verbose ?? true;

  if (verbose) {
    console.log(`[Storage Cache] Connecting to bucket: "${targetBucketName}"...`);
    if (prefix) console.log(`[Storage Cache] Filtering by prefix: "${prefix}"`);
    console.log(`[Storage Cache] Target Cache-Control: "${cacheControlValue}"`);
  }

  const [files] = await bucket.getFiles({ prefix });

  const stats: SetCacheHeadersStats = {
    scanned: files.length,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  if (verbose) {
    console.log(`[Storage Cache] Found ${files.length} file(s). Processing in batches of ${batchSize}...`);
  }

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (file) => {
        try {
          const [metadata] = await file.getMetadata();
          const currentCacheControl = metadata.cacheControl;

          if (!force && currentCacheControl === cacheControlValue) {
            stats.skipped++;
            if (verbose) {
              console.log(`[SKIP] "${file.name}" (already has "${cacheControlValue}")`);
            }
            return;
          }

          await file.setMetadata({
            cacheControl: cacheControlValue,
          });

          stats.updated++;
          if (verbose) {
            console.log(
              `[UPDATED] "${file.name}" -> Cache-Control: "${cacheControlValue}" (was: "${currentCacheControl || 'none'}")`
            );
          }
        } catch (error: any) {
          stats.errors.push({
            file: file.name,
            error: error?.message || String(error),
          });
          if (verbose) {
            console.error(`[ERROR] Failed to update "${file.name}":`, error?.message || error);
          }
        }
      })
    );
  }

  if (verbose) {
    console.log('\n--- Cache-Control Migration Summary ---');
    console.log(`Scanned:  ${stats.scanned}`);
    console.log(`Updated:  ${stats.updated}`);
    console.log(`Skipped:  ${stats.skipped}`);
    console.log(`Errors:   ${stats.errors.length}`);
  }

  return stats;
}

// CLI execution handler
const isDirectExecution =
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith('set-storage-cache-headers.ts') ||
    process.argv[1].endsWith('set-storage-cache-headers.js'));

if (isDirectExecution) {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const prefixArg = args.find((a) => a.startsWith('--prefix='));
  const prefix = prefixArg ? prefixArg.split('=')[1] : undefined;

  setStorageCacheHeaders({ force, prefix })
    .then((stats) => {
      if (stats.errors.length > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Storage Cache] Fatal Error:', err);
      process.exit(1);
    });
}
