import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    server: {
      deps: {
        external: [/supertest/]
      }
    },
    include: [
      'apps/backend/tests/**/*.test.ts',
      'apps/backend/tests/**/*.spec.ts'
    ],
    exclude: [
      'tests/e2e/**/*.spec.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 90,
        branches: 85,
        functions: 90,
        statements: 90
      },
      include: [
        'apps/backend/src/**/*.{ts,js}',
        'tests/**/*.{ts,js}'
      ],
      exclude: [
        'node_modules/',
        'dist/',
        '.git/',
        'coverage/'
      ]
    }
  }
})