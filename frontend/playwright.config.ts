import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'python -m app.main',
      url: 'http://localhost:8000/api/health',
      cwd: '../backend',
      reuseExistingServer: !process.env.CI,
      env: {
        A2V_TEST_MODE: '1',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5174',
      url: 'http://localhost:5174',
      cwd: '.',
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_BASE_URL: 'http://localhost:8000',
        VITE_TEST_MODE: 'true',
      },
    },
  ],
});
