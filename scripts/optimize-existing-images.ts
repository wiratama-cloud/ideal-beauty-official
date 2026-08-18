import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  processImageVariants,
  IMAGE_RESOLUTIONS,
  ImageResolution,
  getVariantFileName,
} from '../src/lib/services/image-processor';

export const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const VARIANT_SUFFIX_REGEX = /-\d+w\.webp$/i;

export interface OptimizeStats {
  scanned: number;
  processed: number;
  skipped: number;
  variantsGenerated: number;
  errors: Array<{ file: string; error: string }>;
}

export interface OptimizeOptions {
  force?: boolean;
  quality?: number;
  effort?: number;
  resolutions?: readonly ImageResolution[];
  verbose?: boolean;
}

/**
 * Checks if a filename is an already generated variant (e.g. "product-256w.webp").
 */
export function isVariantFileName(fileName: string): boolean {
  return VARIANT_SUFFIX_REGEX.test(fileName);
}

/**
 * Checks if a file has a supported image extension.
 */
export function isSupportedImage(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext) && !isVariantFileName(fileName);
}

/**
 * Recursively retrieves all supported original image files in a directory.
 */
export async function findImageFiles(dir: string): Promise<string[]> {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results: string[] = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await findImageFiles(fullPath);
      results.push(...nested);
    } else if (entry.isFile() && isSupportedImage(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Optimizes a single image file by generating all missing WebP resolution variants.
 */
export async function optimizeSingleImage(
  filePath: string,
  options: OptimizeOptions = {}
): Promise<{ variantsCreated: number; skipped: boolean }> {
  const dir = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const resolutions = options.resolutions ?? IMAGE_RESOLUTIONS;

  // Determine which variants are missing
  const missingResolutions: ImageResolution[] = [];
  for (const res of resolutions) {
    const variantName = getVariantFileName(fileName, res);
    const variantPath = path.join(dir, variantName);
    if (options.force || !fs.existsSync(variantPath)) {
      missingResolutions.push(res);
    }
  }

  if (missingResolutions.length === 0) {
    return { variantsCreated: 0, skipped: true };
  }

  const inputBuffer = await fs.promises.readFile(filePath);
  const result = await processImageVariants(inputBuffer, fileName, undefined, {
    quality: options.quality,
    effort: options.effort,
    resolutions: missingResolutions,
  });

  let createdCount = 0;
  for (const variant of result.variants) {
    const variantPath = path.join(dir, variant.fileName);
    await fs.promises.writeFile(variantPath, variant.buffer);
    createdCount++;
  }

  return { variantsCreated: createdCount, skipped: false };
}

/**
 * Scans directories (default: public/images and public/uploads) and generates
 * missing multi-resolution WebP variants alongside each original image.
 */
export async function optimizeExistingImages(
  targetDirs: string[] = ['public/images', 'public/uploads'],
  options: OptimizeOptions = {}
): Promise<OptimizeStats> {
  const stats: OptimizeStats = {
    scanned: 0,
    processed: 0,
    skipped: 0,
    variantsGenerated: 0,
    errors: [],
  };

  const projectRoot = process.cwd();
  const allImagePaths: string[] = [];

  for (const relDir of targetDirs) {
    const absoluteDir = path.isAbsolute(relDir) ? relDir : path.resolve(projectRoot, relDir);
    const images = await findImageFiles(absoluteDir);
    allImagePaths.push(...images);
  }

  stats.scanned = allImagePaths.length;

  for (const imagePath of allImagePaths) {
    try {
      const { variantsCreated, skipped } = await optimizeSingleImage(imagePath, options);
      if (skipped) {
        stats.skipped++;
      } else {
        stats.processed++;
        stats.variantsGenerated += variantsCreated;
        if (options.verbose) {
          console.log(
            `[OPTIMIZE] Processed: ${path.relative(projectRoot, imagePath)} (+${variantsCreated} variants)`
          );
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      stats.errors.push({
        file: path.relative(projectRoot, imagePath),
        error: errorMessage,
      });
      if (options.verbose) {
        console.error(`[ERROR] Failed to process ${imagePath}:`, errorMessage);
      }
    }
  }

  return stats;
}

// Direct execution from CLI
const isDirectExecution =
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith('optimize-existing-images.ts') ||
    process.argv[1].endsWith('optimize-existing-images.js'));

if (isDirectExecution) {
  const isForce = process.argv.includes('--force');
  const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v');

  console.log('=====================================================');
  console.log('🚀 Starting Image Multi-Resolution Batch Optimization');
  console.log(`- Force regenerate: ${isForce}`);
  console.log('- Scanning directories: public/images, public/uploads');
  console.log('=====================================================\n');

  optimizeExistingImages(['public/images', 'public/uploads'], {
    force: isForce,
    verbose: isVerbose,
  })
    .then((stats) => {
      console.log('\n=====================================================');
      console.log('🎉 Image Optimization Complete!');
      console.log(`- Total original images scanned: ${stats.scanned}`);
      console.log(`- Images processed with new variants: ${stats.processed}`);
      console.log(`- Images skipped (already optimized): ${stats.skipped}`);
      console.log(`- Total WebP variants generated: ${stats.variantsGenerated}`);
      if (stats.errors.length > 0) {
        console.log(`- Errors encountered: ${stats.errors.length}`);
        stats.errors.forEach((e) => console.log(`  ❌ ${e.file}: ${e.error}`));
      }
      console.log('=====================================================');
    })
    .catch((err) => {
      console.error('Fatal error during image optimization:', err);
      process.exit(1);
    });
}
