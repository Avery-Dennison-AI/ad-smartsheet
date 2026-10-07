import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    setupFiles: ['./src/tests/helpers/setup.ts'],
    testTimeout: 30000,
  },
});
