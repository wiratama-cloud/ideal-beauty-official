import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbTestFiles = [
  '**/tests/storefront.test.ts',
  '**/tests/account.test.ts',
  '**/tests/admin-access.test.ts',
  '**/tests/admin-actions.test.ts',
  '**/tests/admin-notifications.test.ts',
  '**/tests/admin-storefront-entry.test.ts',
  '**/tests/hero-banner.test.ts',
  '**/tests/nav-category-tree.test.ts',
  '**/tests/product-actions.test.ts',
  '**/tests/search-product.test.ts',
  '**/tests/size-chart-template.test.ts',
  '**/tests/size-chart-type.test.ts',
];

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: true,
    env: {
      USE_IN_MEMORY_DB: 'true',
      DATABASE_POOL_MAX: '20',
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
          exclude: dbTestFiles,
          fileParallelism: true,
          env: {
            USE_IN_MEMORY_DB: 'true',
          },
          alias: {
            '@': path.resolve(__dirname, './src'),
          },
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'node',
          include: dbTestFiles,
          fileParallelism: true,
          env: {
            USE_IN_MEMORY_DB: 'true',
            DATABASE_POOL_MAX: '20',
          },
          alias: {
            '@': path.resolve(__dirname, './src'),
          },
        },
      },
    ],
  },
});
