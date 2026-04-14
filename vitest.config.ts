import { defineConfig } from 'vitest/config';

/**
 * Kept for tooling / docs that expect `vitest.config.ts` at repo root.
 * `npm run test:unit` uses `vitest.config.mts` so Vitest 4 loads as native ESM without `package.json` `"type": "module"`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
