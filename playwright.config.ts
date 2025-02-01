import { defineConfig } from '@playwright/test';
import { config } from './e2e/config/test.config';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: config.API_URL,
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      'x-api-key': config.API_KEY,
    },
  },
  projects: [
    {
      name: 'api-testing',
      testMatch: /.*\.e2e\.ts/,
    },
  ],
  outputDir: 'test-results/',
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
});
