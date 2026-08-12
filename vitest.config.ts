import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      USE_IN_MEMORY_DB: 'true',
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
