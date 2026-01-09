import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for React component testing
    environment: 'jsdom',

    // Enable global test functions (describe, it, expect)
    globals: true,

    // Setup files run before each test file
    setupFiles: ['./src/__tests__/setup.ts'],

    // Test file patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', '.next'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/lib/**/*.ts',
        'src/context/**/*.tsx',
        'src/hooks/**/*.ts',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'src/types/**',
      ],
      // Thresholds - baseline after initial test setup
      // Can be increased as more tests are added
      thresholds: {
        statements: 35,
        branches: 30,
        functions: 45,
        lines: 35,
      },
    },

    // Mock configuration
    mockReset: true,
    restoreMocks: true,

    // Performance - run tests in single thread for consistency
    sequence: {
      concurrent: false,
    },
  },

  // Path aliases matching tsconfig
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
