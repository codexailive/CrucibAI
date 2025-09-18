import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    },
    setupFiles: ['./test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@services': path.resolve(__dirname, './apps/backend/src/services'),
      '@routes': path.resolve(__dirname, './apps/backend/src/routes'),
      '@middleware': path.resolve(__dirname, './apps/backend/src/middleware'),
      '@webhooks': path.resolve(__dirname, './apps/backend/src/webhooks')
    }
  }
});
